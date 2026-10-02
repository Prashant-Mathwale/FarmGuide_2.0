import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, CheckCircle, Clock, MapPin, Trash2, Flag, 
  MessageSquare, Send, ShieldAlert, AlertTriangle, Sprout, 
  Sparkles, Award, User, X
} from 'lucide-react';
import api from '../services/api';
import PublicProfileModal from '../components/PublicProfileModal';
import { t } from '../config/translations';

export default function PostDetail({ user }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Comment input state
  const [newComment, setNewComment] = useState('');
  const [commentLoading, setCommentLoading] = useState(false);
  const [commentError, setCommentError] = useState('');

  // Public Profile Modal state
  const [selectedUserId, setSelectedUserId] = useState(null);

  // Reporting Modal state
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    targetType: 'post',
    targetId: null,
    reason: '',
    note: ''
  });
  const [reportLoading, setReportLoading] = useState(false);
  const [reportMessage, setReportMessage] = useState('');

  // Full-size image modal state
  const [activeImage, setActiveImage] = useState(null);

  const userLang = user?.language || 'en';
  const COMMENT_MAX = 1000;

  const fetchPostDetails = async () => {
    try {
      const res = await api.get(`/community/posts/${id}`);
      if (res.data) {
        setPost(res.data.post);
        setComments(res.data.comments || []);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load post details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPostDetails();
  }, [id]);

  // Handle submit comment
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setCommentLoading(true);
    setCommentError('');

    try {
      const res = await api.post(`/community/posts/${id}/comments`, {
        body: newComment.trim()
      });

      if (res.data?.comment) {
        setComments(prev => [...prev, res.data.comment]);
        setNewComment('');
        // Update post comment count locally
        setPost(prev => prev ? { ...prev, commentCount: (prev.commentCount || 0) + 1 } : prev);
      }
    } catch (err) {
      setCommentError(err.response?.data?.message || 'Failed to submit comment');
    } finally {
      setCommentLoading(false);
    }
  };

  // Toggle helpful comment (post author only)
  const handleToggleHelpful = async (commentId) => {
    try {
      const res = await api.post(`/community/posts/${id}/helpful/${commentId}`);
      if (res.data) {
        setPost(prev => prev ? {
          ...prev,
          isSolved: res.data.isSolved,
          acceptedComment: res.data.acceptedComment
        } : prev);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Could not toggle helpful status');
    }
  };

  // Delete post (author or admin)
  const handleDeletePost = async () => {
    if (!window.confirm('Are you sure you want to delete this post?')) return;
    try {
      await api.delete(`/community/posts/${id}`);
      navigate('/community');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete post');
    }
  };

  // Delete comment (author or admin)
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Are you sure you want to delete this comment?')) return;
    try {
      await api.delete(`/community/comments/${commentId}`);
      setComments(prev => prev.filter(c => c._id !== commentId));
      setPost(prev => prev ? { ...prev, commentCount: Math.max(0, (prev.commentCount || 1) - 1) } : prev);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete comment');
    }
  };

  // Submit report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportModal.reason) return;

    setReportLoading(true);
    setReportMessage('');

    try {
      const res = await api.post('/community/report', {
        targetType: reportModal.targetType,
        targetId: reportModal.targetId,
        reason: reportModal.reason,
        note: reportModal.note
      });

      alert(res.data?.message || 'Report submitted successfully');
      setReportModal({ isOpen: false, targetType: 'post', targetId: null, reason: '', note: '' });
    } catch (err) {
      setReportMessage(err.response?.data?.message || 'Failed to submit report');
    } finally {
      setReportLoading(false);
    }
  };

  const isPostAuthor = user && post && post.author?._id?.toString() === user._id?.toString();
  const isAdmin = user && user.role === 'admin';

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
        <p className="text-white/60 text-sm">Loading discussion...</p>
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="glass-card p-10 rounded-3xl border border-white/10 text-center space-y-4 max-w-lg mx-auto my-12">
        <AlertTriangle size={32} className="text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">{error || 'Post not found'}</h3>
        <Link to="/community" className="btn-primary py-2 px-5 text-xs font-bold inline-block">
          Back to Community
        </Link>
      </div>
    );
  }

  const cropName = post.cropName || post.crop?.names?.[userLang] || post.crop?.name || 'General Crop';

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-16 text-white text-left">
      {/* ── TOP NAV BAR ── */}
      <div className="flex items-center justify-between">
        <Link
          to="/community"
          className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>

        <div className="flex items-center gap-2">
          {/* Delete post option */}
          {(isPostAuthor || isAdmin) && (
            <button
              onClick={handleDeletePost}
              className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Trash2 size={13} /> {t('community_delete_post', userLang)}
            </button>
          )}

          {/* Report post button */}
          {!isPostAuthor && (
            <button
              onClick={() => setReportModal({
                isOpen: true,
                targetType: 'post',
                targetId: post._id,
                reason: '',
                note: ''
              })}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Flag size={13} /> {t('community_report', userLang)}
            </button>
          )}
        </div>
      </div>

      {/* ── POST MAIN CARD ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        {/* Meta Header */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelectedUserId(post.author?._id)}
              className="w-10 h-10 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/40 flex items-center justify-center font-bold text-sm transition-all cursor-pointer"
              title="View farmer public profile"
            >
              {post.author?.fullName?.charAt(0) || 'F'}
            </button>
            <div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserId(post.author?._id)}
                  className="font-bold text-white hover:text-primary transition-colors text-sm sm:text-base capitalize cursor-pointer text-left"
                >
                  {post.author?.fullName}
                </button>
                {post.author?.role === 'expert' && (
                  <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
                    <Award size={10} /> Expert
                  </span>
                )}
              </div>
              <p className="text-xs text-white/50 flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="text-primary/70" />
                {post.district}, {post.state} • {new Date(post.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-bold border border-primary/30 flex items-center gap-1.5">
              <Sprout size={13} /> {cropName}
            </span>

            {post.isSolved && (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold uppercase border border-green-500/30 flex items-center gap-1.5">
                <CheckCircle size={13} className="text-green-400" />
                {t('community_solved_badge', userLang)}
              </span>
            )}
          </div>
        </div>

        {/* Scan Summary Banner (if attached) */}
        {post.scanSummary && (
          <div className="p-4 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-purple-400" />
              <div>
                <p className="text-purple-300 font-bold uppercase tracking-wider text-[11px]">
                  {t('community_share_scan_chip', userLang)}
                </p>
                <p className="text-white/80 font-medium">
                  Diagnosis: <strong className="text-white">{post.scanSummary.label}</strong>
                  {post.scanSummary.confidence && ` (${post.scanSummary.confidence.toFixed(1)}% match)`}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Post Title & Body */}
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight leading-snug">
            {post.title}
          </h1>
          <p className="text-sm sm:text-base text-white/85 leading-relaxed mt-3 whitespace-pre-wrap">
            {post.body}
          </p>
        </div>

        {/* Photo Gallery (up to 3 photos) */}
        {post.images && post.images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            {post.images.map((img, i) => (
              <div
                key={i}
                onClick={() => setActiveImage(img.url)}
                className="relative aspect-square rounded-2xl overflow-hidden border border-white/10 bg-black/40 cursor-pointer group"
              >
                <img
                  src={img.url}
                  alt={`Observation ${i + 1}`}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    if (!e.currentTarget.dataset.retried) {
                      e.currentTarget.dataset.retried = 'true';
                      const cleanUrl = img.url.startsWith('/') ? img.url : `/${img.url}`;
                      e.currentTarget.src = `http://localhost:5000${cleanUrl}`;
                    }
                  }}
                />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-semibold">
                  Click to enlarge
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── COMMENTS SECTION ── */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <MessageSquare size={18} className="text-primary" />
            {t('community_comments_title', userLang)} ({comments.length})
          </h3>
        </div>

        {/* Add Comment Input Form */}
        <form onSubmit={handleAddComment} className="glass-card p-5 rounded-3xl border border-white/10 space-y-3">
          <div className="flex items-center justify-between text-xs text-white/50 px-1">
            <span>Replying as <strong className="text-white capitalize">{user?.fullName}</strong></span>
            <span className="font-mono">{newComment.length} / {COMMENT_MAX}</span>
          </div>

          <textarea
            rows={3}
            maxLength={COMMENT_MAX}
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            required
            placeholder={t('community_add_comment', userLang)}
            className="input-field w-full resize-none text-sm leading-relaxed"
          />

          {commentError && (
            <p className="text-xs text-error font-semibold">{commentError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={commentLoading || !newComment.trim()}
              className="btn-primary py-2.5 px-5 text-xs font-bold uppercase tracking-wider rounded-xl flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              <Send size={13} />
              {commentLoading ? 'Submitting...' : t('community_post_comment', userLang)}
            </button>
          </div>
        </form>

        {/* Comments List */}
        <div className="space-y-4">
          {comments.map((comment) => {
            const isAccepted = post.acceptedComment && (
              post.acceptedComment === comment._id || 
              post.acceptedComment._id === comment._id
            );
            const isCommentAuthor = user && comment.author?._id?.toString() === user._id?.toString();

            return (
              <div
                key={comment._id}
                className={`glass-card p-5 sm:p-6 rounded-3xl border transition-all ${
                  isAccepted
                    ? 'border-green-500/50 bg-green-500/[0.04] shadow-[0_0_25px_rgba(74,222,128,0.15)]'
                    : 'border-white/10'
                }`}
              >
                {/* Comment Header */}
                <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/5">
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => setSelectedUserId(comment.author?._id)}
                      className="w-8 h-8 rounded-full bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs cursor-pointer"
                    >
                      {comment.author?.fullName?.charAt(0) || 'F'}
                    </button>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedUserId(comment.author?._id)}
                          className="font-bold text-white hover:text-primary transition-colors text-xs sm:text-sm capitalize cursor-pointer"
                        >
                          {comment.author?.fullName}
                        </button>
                        {comment.author?.role === 'expert' && (
                          <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-400 text-[9px] font-bold uppercase">
                            Expert
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-white/40">
                        {comment.author?.district ? `${comment.author.district} • ` : ''}
                        {new Date(comment.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Accepted Answer Badge */}
                    {isAccepted && (
                      <span className="px-2.5 py-0.5 rounded-full bg-green-500/20 text-green-300 text-[10px] font-bold uppercase tracking-wider border border-green-500/40 flex items-center gap-1">
                        <CheckCircle size={11} className="text-green-400" />
                        Helpful Answer
                      </span>
                    )}

                    {/* Delete own comment */}
                    {(isCommentAuthor || isAdmin) && (
                      <button
                        onClick={() => handleDeleteComment(comment._id)}
                        className="text-white/40 hover:text-red-400 p-1.5 transition-colors cursor-pointer"
                        title="Delete comment"
                      >
                        <Trash2 size={13} />
                      </button>
                    )}

                    {/* Report comment */}
                    {!isCommentAuthor && (
                      <button
                        onClick={() => setReportModal({
                          isOpen: true,
                          targetType: 'comment',
                          targetId: comment._id,
                          reason: '',
                          note: ''
                        })}
                        className="text-white/40 hover:text-white p-1.5 transition-colors cursor-pointer"
                        title="Report comment"
                      >
                        <Flag size={13} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Chemical / Dosage Advisory Caution Banner */}
                {comment.flags?.advisory && (
                  <div className="mb-3 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-2 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
                    <ShieldAlert size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">
                      {t('community_advisory_notice', userLang)}
                    </p>
                  </div>
                )}

                {/* Comment Body */}
                <p className="text-xs sm:text-sm text-white/90 leading-relaxed whitespace-pre-wrap">
                  {comment.body}
                </p>

                {/* Mark as Helpful Button (Post author only) */}
                {isPostAuthor && (
                  <div className="pt-3 mt-3 border-t border-white/5 flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleToggleHelpful(comment._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isAccepted
                          ? 'bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-green-500/30'
                          : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      <CheckCircle size={13} className={isAccepted ? 'text-green-400' : 'text-white/40'} />
                      {isAccepted ? t('community_unmark_helpful', userLang) : t('community_mark_helpful', userLang)}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── PUBLIC PROFILE MODAL ── */}
      {selectedUserId && (
        <PublicProfileModal
          userId={selectedUserId}
          onClose={() => setSelectedUserId(null)}
        />
      )}

      {/* ── REPORT CONTENT MODAL ── */}
      <AnimatePresence>
        {reportModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReportModal({ ...reportModal, isOpen: false })}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-md bg-neutral-900 border border-white/15 rounded-3xl p-6 shadow-2xl z-10 text-white"
            >
              <div className="flex items-center justify-between pb-3 mb-4 border-b border-white/10">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Flag size={16} className="text-red-400" />
                  {t('community_report_title', userLang)}
                </h3>
                <button
                  onClick={() => setReportModal({ ...reportModal, isOpen: false })}
                  className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70"
                >
                  <X size={15} />
                </button>
              </div>

              {reportMessage && (
                <p className="text-xs text-error font-semibold mb-3">{reportMessage}</p>
              )}

              <form onSubmit={handleSubmitReport} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                    {t('community_report_reason', userLang)} *
                  </label>
                  <select
                    value={reportModal.reason}
                    onChange={(e) => setReportModal({ ...reportModal, reason: e.target.value })}
                    required
                    className="input-field w-full bg-neutral-950 cursor-pointer"
                  >
                    <option value="">Select a reason</option>
                    <option value="Harmful or dangerous chemical advice">Harmful or dangerous chemical advice</option>
                    <option value="Incorrect or misleading diagnosis">Incorrect or misleading diagnosis</option>
                    <option value="Spam or promotional content">Spam or promotional content</option>
                    <option value="Harassment or inappropriate language">Harassment or inappropriate language</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-white/60 uppercase tracking-wider mb-1">
                    Additional notes (optional)
                  </label>
                  <textarea
                    rows={3}
                    value={reportModal.note}
                    onChange={(e) => setReportModal({ ...reportModal, note: e.target.value })}
                    className="input-field w-full resize-none text-xs"
                    placeholder="Provide additional details..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setReportModal({ ...reportModal, isOpen: false })}
                    className="btn-secondary py-2 px-4 text-xs font-bold rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportLoading}
                    className="btn-primary py-2 px-5 text-xs font-bold uppercase rounded-xl bg-red-500 hover:bg-red-600 border-red-500"
                  >
                    {reportLoading ? 'Submitting...' : t('community_report_submit', userLang)}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── FULL IMAGE ENLARGE MODAL ── */}
      <AnimatePresence>
        {activeImage && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="relative max-w-4xl max-h-[90vh] rounded-3xl overflow-hidden border border-white/20"
            >
              <button
                onClick={() => setActiveImage(null)}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center transition-colors cursor-pointer z-10"
              >
                <X size={20} />
              </button>
              <img src={activeImage} alt="Enlarged leaf" className="max-h-[85vh] w-auto object-contain" />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
