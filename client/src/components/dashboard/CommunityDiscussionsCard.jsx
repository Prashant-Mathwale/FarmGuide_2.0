import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Users, ArrowRight, MessageSquare, UserCircle } from 'lucide-react';
import api from '../../services/api';

const DEFAULT_POSTS = [
    {
        _id: 'default-1',
        title: 'My soybean leaves are turning yellow. Is it a disease?',
        authorName: 'Rahul Patil',
        timeAgo: '12 min ago',
        commentCount: 8,
        image: '/soybean-leaves.jpg',
    },
    {
        _id: 'default-2',
        title: 'Which treatment worked for tomato late blight?',
        authorName: 'Amit Jadhav',
        timeAgo: '35 min ago',
        commentCount: 5,
        image: '/ripe-tomatoes.jpg',
    },
];

const CommunityDiscussionsCard = () => {
    const [posts, setPosts] = useState(DEFAULT_POSTS);

    useEffect(() => {
        let isMounted = true;
        const fetchCommunityPosts = async () => {
            try {
                const res = await api.get('/community/posts?limit=2');
                if (res.data?.posts && Array.isArray(res.data.posts) && res.data.posts.length > 0 && isMounted) {
                    const mapped = res.data.posts.slice(0, 2).map((post, idx) => {
                        const fallback = DEFAULT_POSTS[idx] || DEFAULT_POSTS[0];
                        const img = post.images && post.images.length > 0 ? post.images[0] : fallback.image;
                        const author = post.author?.fullName || post.author?.district || fallback.authorName;
                        
                        // Calculate simple relative time
                        let timeAgo = fallback.timeAgo;
                        if (post.createdAt) {
                            const diffMinutes = Math.floor((new Date() - new Date(post.createdAt)) / (1000 * 60));
                            if (diffMinutes < 60) {
                                timeAgo = `${Math.max(1, diffMinutes)} min ago`;
                            } else if (diffMinutes < 1440) {
                                timeAgo = `${Math.floor(diffMinutes / 60)}h ago`;
                            } else {
                                timeAgo = `${Math.floor(diffMinutes / 1440)}d ago`;
                            }
                        }

                        return {
                            _id: post._id,
                            title: post.title,
                            authorName: author,
                            timeAgo,
                            commentCount: post.commentCount || 0,
                            image: img,
                        };
                    });
                    setPosts(mapped);
                }
            } catch (err) {
                // If unauthenticated or no posts, fallback smoothly to defaults
            }
        };

        fetchCommunityPosts();
        return () => { isMounted = false; };
    }, []);

    return (
        <div className="bg-[#0b2416]/75 backdrop-blur-md border border-[#1e4d30]/70 rounded-2xl p-5 shadow-[0_8px_30px_rgba(0,0,0,0.35)] w-full">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
                        <Users className="w-5 h-5" />
                    </div>
                    <h3 className="text-white font-semibold text-base tracking-wide">Community Discussions</h3>
                </div>
                <Link
                    to="/community"
                    className="text-xs text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 font-medium group"
                >
                    <span>View Community</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* Posts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {posts.map((post) => (
                    <Link
                        key={post._id}
                        to={post._id.startsWith('default') ? '/community' : `/community/posts/${post._id}`}
                        className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] hover:bg-white/[0.07] border border-emerald-500/10 hover:border-emerald-500/25 transition-all group"
                    >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            {/* Thumbnail */}
                            <div className="w-14 h-14 rounded-xl overflow-hidden shrink-0 border border-emerald-500/20 shadow-md bg-black/40">
                                <img
                                    src={post.image}
                                    alt={post.title}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = '/leaf-early-blight.jpg';
                                    }}
                                />
                            </div>

                            {/* Post Info */}
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-medium text-emerald-50 group-hover:text-emerald-300 transition-colors line-clamp-1">
                                    {post.title}
                                </h4>
                                <div className="flex flex-wrap items-center gap-2 mt-1.5 text-xs text-emerald-200/70">
                                    <div className="flex items-center gap-1">
                                        <UserCircle className="w-3.5 h-3.5 text-emerald-400" />
                                        <span>{post.authorName}</span>
                                    </div>
                                    <span>•</span>
                                    <span>{post.timeAgo}</span>
                                    <span>•</span>
                                    <div className="flex items-center gap-1">
                                        <MessageSquare className="w-3 h-3 text-emerald-400" />
                                        <span>{post.commentCount} replies</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Speech Bubble Icon on Right */}
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-300/60 group-hover:text-emerald-300 group-hover:bg-emerald-500/10 transition-colors shrink-0 ml-2">
                            <MessageSquare className="w-4 h-4" />
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default CommunityDiscussionsCard;
