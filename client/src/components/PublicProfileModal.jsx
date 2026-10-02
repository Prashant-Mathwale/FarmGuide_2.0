import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, MapPin, Calendar, Award, MessageSquare, CheckCircle, HelpCircle } from 'lucide-react';
import api from '../services/api';

/**
 * PublicProfileModal — Displays whitelisted public profile info of an author
 * Strictly shows: id, fullName, state, district, createdAt, role, and stats (questions, answers, helpful)
 * NEVER shows phone, landSizeAcres, or exact address.
 */
export default function PublicProfileModal({ userId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    const fetchPublicProfile = async () => {
      try {
        const res = await api.get(`/users/${userId}/public`);
        if (isMounted) setProfile(res.data);
      } catch (err) {
        if (isMounted) setError(err.response?.data?.message || 'Could not load profile');
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    if (userId) {
      fetchPublicProfile();
    }
    return () => { isMounted = false; };
  }, [userId]);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Modal Content */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-neutral-900/95 border border-white/15 rounded-3xl p-6 shadow-2xl z-10 text-white"
        >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>

          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-white/60 text-xs">Loading profile...</p>
            </div>
          ) : error ? (
            <div className="py-8 text-center">
              <p className="text-error text-sm font-semibold">{error}</p>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/20 border border-primary/40 flex items-center justify-center text-primary font-bold text-xl shadow-[0_0_20px_rgba(76,175,80,0.25)]">
                  {profile.fullName?.charAt(0) || 'F'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white capitalize">{profile.fullName}</h3>
                    {profile.role === 'expert' ? (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px] font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
                        <Award size={10} /> Expert
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider border border-primary/30">
                        Farmer
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-white/60 flex items-center gap-1 mt-0.5">
                    <MapPin size={12} className="text-primary/70" />
                    {profile.district}, {profile.state}
                  </p>
                  <p className="text-[11px] text-white/40 flex items-center gap-1 mt-1">
                    <Calendar size={11} />
                    Member since {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }) : 'Recently'}
                  </p>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-white/50 text-[11px] mb-1 font-medium">
                    <HelpCircle size={12} /> Questions
                  </div>
                  <p className="text-lg font-bold text-white">{profile.stats?.questions || 0}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-white/50 text-[11px] mb-1 font-medium">
                    <MessageSquare size={12} /> Answers
                  </div>
                  <p className="text-lg font-bold text-white">{profile.stats?.answers || 0}</p>
                </div>
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 text-center">
                  <div className="flex items-center justify-center gap-1 text-green-400/70 text-[11px] mb-1 font-medium">
                    <CheckCircle size={12} /> Helpful
                  </div>
                  <p className="text-lg font-bold text-green-400">{profile.stats?.helpful || 0}</p>
                </div>
              </div>
            </div>
          ) : null}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
