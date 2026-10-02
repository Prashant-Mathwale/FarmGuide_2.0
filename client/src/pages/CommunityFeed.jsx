import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Search, Plus, CheckCircle, MessageSquare, Clock, 
  MapPin, User, Sprout, Filter, AlertCircle, Sparkles, Image as ImageIcon, X
} from 'lucide-react';
import api from '../services/api';
import { t } from '../config/translations';

export default function CommunityFeed({ user }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Filters & Pagination
  const [searchQuery, setSearchQuery] = useState('');
  const [cropFilter, setCropFilter] = useState('');
  const [selectedTab, setSelectedTab] = useState('all'); // 'all' | 'unanswered' | 'solved' | 'mine'
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [totalPosts, setTotalPosts] = useState(0);

  const userLang = user?.language || 'en';

  // Fetch posts on filter/query/tab changes
  useEffect(() => {
    let isMounted = true;
    const fetchPosts = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams();
        params.append('filter', selectedTab);
        params.append('page', '1');
        params.append('limit', '10');
        if (cropFilter.trim()) params.append('crop', cropFilter.trim());
        if (searchQuery.trim()) params.append('q', searchQuery.trim());

        const res = await api.get(`/community/posts?${params.toString()}`);
        if (isMounted && res.data) {
          setPosts(res.data.posts || []);
          setTotalPosts(res.data.total || 0);
          setPage(1);
          setHasMore(res.data.page < res.data.pages);
        }
      } catch (err) {
        console.error('Failed to load community posts', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    const timer = setTimeout(() => {
      fetchPosts();
    }, 250); // debounce search query

    return () => {
      clearTimeout(timer);
      isMounted = false;
    };
  }, [selectedTab, cropFilter, searchQuery]);

  // Load more posts
  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const params = new URLSearchParams();
      params.append('filter', selectedTab);
      params.append('page', nextPage.toString());
      params.append('limit', '10');
      if (cropFilter.trim()) params.append('crop', cropFilter.trim());
      if (searchQuery.trim()) params.append('q', searchQuery.trim());

      const res = await api.get(`/community/posts?${params.toString()}`);
      if (res.data?.posts) {
        setPosts(prev => [...prev, ...res.data.posts]);
        setPage(nextPage);
        setHasMore(res.data.page < res.data.pages);
      }
    } catch (err) {
      console.error('Failed to load more posts', err);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatTimeAgo = (dateStr) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    if (minutes < 60) return `${Math.max(1, minutes)}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-16 text-white text-left">
      {/* ── HEADER & ASK BUTTON ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <Sprout size={28} className="text-primary" />
            {t('community_title', userLang)}
          </h2>
          <p className="text-xs sm:text-sm text-white/60 mt-1">
            {t('community_subtitle', userLang)}
          </p>
        </div>

        <Link
          to="/community/new"
          className="btn-primary py-3 px-5 text-sm font-bold uppercase tracking-wider rounded-2xl flex items-center justify-center gap-2 shadow-[0_10px_25px_rgba(76,175,80,0.3)] self-start sm:self-auto cursor-pointer"
        >
          <Plus size={18} />
          {t('community_btn_ask', userLang)}
        </Link>
      </div>

      {/* ── SEARCH & TABS ── */}
      <div className="glass-card p-4 rounded-2xl border border-white/10 space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('community_search_placeholder', userLang)}
            className="input-field w-full pl-10 pr-4 text-sm"
          />
        </div>

        {/* Tabs: All / Unanswered / Solved / Mine */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar text-xs font-bold">
          {[
            { id: 'all', label: t('community_tab_all', userLang) },
            { id: 'unanswered', label: t('community_tab_unanswered', userLang) },
            { id: 'solved', label: t('community_tab_solved', userLang) },
            { id: 'mine', label: t('community_tab_mine', userLang) }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap cursor-pointer ${
                selectedTab === tab.id
                  ? 'bg-primary text-black shadow-[0_0_12px_rgba(76,175,80,0.3)]'
                  : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Filter by Crop Name Input */}
        <div className="relative">
          <Sprout size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-primary" />
          <input
            type="text"
            value={cropFilter}
            onChange={(e) => setCropFilter(e.target.value)}
            placeholder="Filter by crop name (e.g. Grape, Tomato, Cotton, Wheat)..."
            className="w-full pl-10 pr-9 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white text-xs placeholder:text-white/40 focus:border-primary focus:outline-none transition-colors"
          />
          {cropFilter && (
            <button
              onClick={() => setCropFilter('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white p-1 cursor-pointer"
              title="Clear crop filter"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* ── POSTS LIST ── */}
      {loading ? (
        /* Skeletons */
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="glass-card p-5 rounded-3xl border border-white/10 animate-pulse space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10" />
                <div className="w-32 h-4 rounded bg-white/10" />
              </div>
              <div className="w-3/4 h-5 rounded bg-white/10" />
              <div className="w-full h-12 rounded bg-white/5" />
            </div>
          ))}
        </div>
      ) : posts.length === 0 ? (
        /* Friendly Empty State */
        <div className="glass-card p-12 rounded-3xl border border-white/10 text-center space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
            <MessageSquare size={26} />
          </div>
          <h3 className="text-lg font-bold text-white">
            {t('community_empty', userLang)}
          </h3>
          <p className="text-xs text-white/50 max-w-sm mx-auto">
            Be the first farmer to ask a question or share advice on crop problems with your peers.
          </p>
          <div className="pt-2">
            <Link
              to="/community/new"
              className="btn-primary py-2.5 px-5 text-xs font-bold uppercase rounded-xl inline-flex items-center gap-2"
            >
              <Plus size={14} />
              {t('community_btn_ask', userLang)}
            </Link>
          </div>
        </div>
      ) : (
        /* Post Cards */
        <div className="space-y-4">
          {posts.map(post => {
            const hasThumbnail = post.images && post.images.length > 0;
            const cropName = post.cropName || post.crop?.names?.[userLang] || post.crop?.name || 'General Crop';

            return (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-5 sm:p-6 rounded-3xl border border-white/10 hover:border-white/20 transition-all shadow-[0_10px_30px_rgba(0,0,0,0.4)] group"
              >
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Left: Thumbnail (if present) */}
                  {hasThumbnail && (
                    <div className="w-full sm:w-28 sm:h-28 h-44 rounded-2xl overflow-hidden flex-shrink-0 border border-white/10 bg-black/40">
                      <img
                        src={post.images[0].url}
                        alt="Crop observation"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                        onError={(e) => {
                          if (!e.currentTarget.dataset.retried) {
                            e.currentTarget.dataset.retried = 'true';
                            const cleanUrl = post.images[0].url.startsWith('/') ? post.images[0].url : `/${post.images[0].url}`;
                            e.currentTarget.src = `http://localhost:5000${cleanUrl}`;
                          }
                        }}
                      />
                    </div>
                  )}

                  {/* Right: Content details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      {/* Top Meta: Crop Chip, Solved Badge, Scan Result Chip */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-primary/15 text-primary text-[11px] font-bold border border-primary/30 flex items-center gap-1">
                          <Sprout size={11} /> {cropName}
                        </span>

                        {post.isSolved && (
                          <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[11px] font-bold uppercase border border-green-500/30 flex items-center gap-1">
                            <CheckCircle size={11} className="text-green-400" />
                            {t('community_solved_badge', userLang)}
                          </span>
                        )}

                        {post.scanSummary && (
                          <span className="px-2.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[11px] font-semibold border border-purple-500/30 flex items-center gap-1">
                            <Sparkles size={11} className="text-purple-400" />
                            {post.scanSummary.label || t('community_share_scan_chip', userLang)}
                          </span>
                        )}

                        <span className="text-[11px] text-white/40 ml-auto flex items-center gap-1">
                          <Clock size={11} /> {formatTimeAgo(post.createdAt)}
                        </span>
                      </div>

                      {/* Post Title & Snippet */}
                      <Link to={`/community/${post._id}`} className="block group-hover:text-primary transition-colors">
                        <h3 className="text-base sm:text-lg font-bold text-white tracking-tight line-clamp-2">
                          {post.title}
                        </h3>
                      </Link>

                      <p className="text-xs sm:text-sm text-white/70 line-clamp-2 mt-1.5 leading-relaxed">
                        {post.body}
                      </p>
                    </div>

                    {/* Footer: Author Name & District + Comment Count */}
                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-white/5 text-xs text-white/50">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-[10px]">
                          {post.author?.fullName?.charAt(0) || 'F'}
                        </div>
                        <span className="font-semibold text-white/80 capitalize">
                          {post.author?.fullName}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-0.5">
                          <MapPin size={11} className="text-primary/70" />
                          {post.district}
                        </span>
                      </div>

                      <Link 
                        to={`/community/${post._id}`} 
                        className="flex items-center gap-1.5 text-white/70 hover:text-white font-semibold transition-colors"
                      >
                        <MessageSquare size={14} className="text-primary" />
                        <span>{post.commentCount || 0}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="btn-secondary py-3 px-8 text-xs font-bold rounded-2xl border-white/20 hover:bg-white/10 cursor-pointer"
              >
                {loadingMore ? 'Loading...' : t('community_load_more', userLang)}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
