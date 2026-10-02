import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  User, MapPin, Calendar, Award, Lock, LogOut, Edit3, 
  Check, X, Sprout, MessageSquare, HelpCircle, CheckCircle, 
  AlertCircle, ShieldCheck, Globe
} from 'lucide-react';
import api from '../services/api';
import { t } from '../config/translations';

export default function Profile({ user, setUser }) {
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState(null);
  const [locations, setLocations] = useState({});
  const [allCrops, setAllCrops] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit details state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: '',
    state: '',
    district: '',
    landSizeAcres: '',
    crops: [],
    language: 'en'
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState({ type: '', text: '' });

  // Password change state
  const [pwdForm, setPwdForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState({ type: '', text: '' });

  // Activity questions & answers
  const [myPosts, setMyPosts] = useState([]);
  const [activityStats, setActivityStats] = useState({ questions: 0, answers: 0, helpful: 0 });

  useEffect(() => {
    let isMounted = true;
    const fetchProfileAndData = async () => {
      try {
        const [meRes, locRes, cropRes, postsRes] = await Promise.all([
          api.get('/users/me'),
          api.get('/meta/locations'),
          api.get('/meta/crops'),
          api.get('/community/posts?filter=mine&limit=20')
        ]);

        if (isMounted) {
          const userData = meRes.data?.user || meRes.data;
          setProfileData(userData);
          setEditForm({
            fullName: userData.fullName || '',
            state: userData.state || '',
            district: userData.district || '',
            landSizeAcres: userData.landSizeAcres ?? 1,
            crops: (userData.crops || []).map(c => typeof c === 'object' ? c._id : c),
            language: userData.language || 'en'
          });

          if (locRes.data?.locations) setLocations(locRes.data.locations);
          if (cropRes.data?.crops) setAllCrops(cropRes.data.crops);
          if (postsRes.data?.posts) setMyPosts(postsRes.data.posts);

          // Also fetch public stats for own user id
          if (userData._id) {
            try {
              const pubRes = await api.get(`/users/${userData._id}/public`);
              if (pubRes.data?.stats) setActivityStats(pubRes.data.stats);
            } catch (e) {
              // fallback
            }
          }
        }
      } catch (err) {
        console.error('Failed to load profile data:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchProfileAndData();
    return () => { isMounted = false; };
  }, []);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setEditForm(prev => ({ ...prev, state: value, district: '' }));
    } else {
      setEditForm(prev => ({ ...prev, [name]: value }));
    }
  };

  const toggleCrop = (cropId) => {
    setEditForm(prev => {
      const exists = prev.crops.includes(cropId);
      return {
        ...prev,
        crops: exists ? prev.crops.filter(id => id !== cropId) : [...prev.crops, cropId]
      };
    });
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaveMessage({ type: '', text: '' });
    setSaveLoading(true);

    try {
      const payload = {
        fullName: editForm.fullName.trim(),
        state: editForm.state,
        district: editForm.district,
        landSizeAcres: Number(editForm.landSizeAcres) || 0,
        crops: editForm.crops,
        language: editForm.language
      };

      const res = await api.patch('/users/me', payload);
      const updatedUser = res.data?.user || res.data;
      setProfileData(updatedUser);

      // Update in localStorage
      const currentUser = JSON.parse(localStorage.getItem('userInfo') || '{}');
      const merged = { ...currentUser, ...updatedUser };
      localStorage.setItem('userInfo', JSON.stringify(merged));
      if (setUser) setUser(merged);

      setIsEditing(false);
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
    } catch (err) {
      setSaveMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to update profile' 
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdMessage({ type: '', text: '' });

    if (pwdForm.newPassword.length < 8) {
      setPwdMessage({ type: 'error', text: 'New password must be at least 8 characters' });
      return;
    }

    if (pwdForm.newPassword !== pwdForm.confirmPassword) {
      setPwdMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    setPwdLoading(true);
    try {
      await api.post('/users/me/change-password', {
        currentPassword: pwdForm.currentPassword,
        newPassword: pwdForm.newPassword
      });
      setPwdMessage({ type: 'success', text: 'Password changed successfully!' });
      setPwdForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdMessage({ 
        type: 'error', 
        text: err.response?.data?.message || 'Failed to change password' 
      });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('userInfo');
    if (setUser) setUser(null);
    navigate('/');
  };

  if (loading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 rounded-full border-3 border-primary border-t-transparent animate-spin" />
        <p className="text-white/60 text-sm">Loading your profile...</p>
      </div>
    );
  }

  const userLang = profileData?.language || 'en';
  const availableDistricts = editForm.state && locations[editForm.state] 
    ? locations[editForm.state] 
    : [];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-16 text-white text-left">
      {/* ── 1. HEADER CARD ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/30 to-emerald-500/10 border-2 border-primary/40 flex items-center justify-center text-primary font-black text-3xl shadow-[0_0_30px_rgba(76,175,80,0.25)]">
            {profileData?.fullName?.charAt(0) || 'F'}
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight capitalize">
                {profileData?.fullName}
              </h2>
              {profileData?.role === 'expert' ? (
                <span className="px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-xs font-bold uppercase tracking-wider border border-blue-500/30 flex items-center gap-1">
                  <Award size={12} /> Expert
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-bold uppercase tracking-wider border border-primary/30 flex items-center gap-1">
                  <Sprout size={12} /> Farmer
                </span>
              )}
            </div>

            <p className="text-sm text-white/70 flex items-center gap-1.5 mt-1">
              <MapPin size={14} className="text-primary" />
              {profileData?.district}, {profileData?.state}
            </p>

            <p className="text-xs text-white/40 flex items-center gap-1.5 mt-1.5 font-medium">
              <Calendar size={13} />
              {t('profile_member_since', userLang)} {profileData?.createdAt ? new Date(profileData.createdAt).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'Recently'}
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="btn-secondary py-2.5 px-4 text-xs font-bold border-red-500/30 text-red-400 hover:bg-red-500/10 hover:border-red-500/50 flex items-center gap-2 rounded-xl transition-all cursor-pointer"
        >
          <LogOut size={14} />
          {t('nav_logout', userLang)}
        </button>
      </div>

      {saveMessage.text && (
        <div className={`p-4 rounded-2xl text-xs font-semibold text-center border ${
          saveMessage.type === 'success' 
            ? 'bg-green-500/15 border-green-500/30 text-green-300' 
            : 'bg-red-500/15 border-red-500/30 text-red-300'
        }`}>
          {saveMessage.text}
        </div>
      )}

      {/* ── 2. MY DETAILS (READ-ONLY WITH EDIT TOGGLE) ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-white/10">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <User size={20} className="text-primary" />
              {t('profile_personal_details', userLang)}
            </h3>
            <p className="text-xs text-white/50 mt-0.5">
              Personal credentials and region
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsEditing(!isEditing);
              setSaveMessage({ type: '', text: '' });
            }}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-xs font-bold text-white/90 hover:text-white flex items-center gap-2 transition-all cursor-pointer"
          >
            {isEditing ? (
              <>
                <X size={14} /> {t('profile_cancel', userLang)}
              </>
            ) : (
              <>
                <Edit3 size={14} className="text-primary" /> {t('profile_edit_toggle', userLang)}
              </>
            )}
          </button>
        </div>

        {!isEditing ? (
          /* READ-ONLY VIEW */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 text-sm">
            <div>
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1">
                Full Name
              </span>
              <p className="text-white font-semibold capitalize">{profileData?.fullName}</p>
            </div>

            <div>
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1">
                Phone Number
              </span>
              <p className="text-white font-mono font-semibold">{profileData?.phone}</p>
              <span className="text-[10px] text-white/40 block mt-0.5 italic">
                {t('profile_phone_hint', userLang)}
              </span>
            </div>

            <div>
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1">
                Location
              </span>
              <p className="text-white font-semibold">{profileData?.district}, {profileData?.state}</p>
            </div>

            <div>
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1">
                Land Size
              </span>
              <p className="text-white font-semibold">
                {profileData?.landSizeAcres ? `${profileData.landSizeAcres} acres` : 'Not specified'}
              </p>
            </div>

            <div>
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1">
                Language
              </span>
              <p className="text-white font-semibold uppercase">{profileData?.language || 'en'}</p>
            </div>

            <div>
              <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-1">
                Role
              </span>
              <p className="text-primary font-semibold uppercase tracking-wider text-xs">
                {profileData?.role || 'Farmer'}
              </p>
            </div>
          </div>
        ) : (
          /* EDIT FORM */
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
                  Full Name
                </label>
                <input
                  name="fullName"
                  type="text"
                  value={editForm.fullName}
                  onChange={handleEditChange}
                  required
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-1.5">
                  Phone (Immutable)
                </label>
                <input
                  type="text"
                  disabled
                  value={profileData?.phone}
                  className="input-field w-full opacity-60 cursor-not-allowed bg-black/40 font-mono"
                />
                <span className="text-[10px] text-white/40 mt-1 block">
                  {t('profile_phone_hint', userLang)}
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
                  State
                </label>
                <select
                  name="state"
                  value={editForm.state}
                  onChange={handleEditChange}
                  required
                  className="input-field w-full bg-neutral-900 cursor-pointer"
                >
                  <option value="">Select State</option>
                  {Object.keys(locations).map(st => (
                    <option key={st} value={st} className="bg-neutral-900 text-white">{st}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
                  District
                </label>
                <select
                  name="district"
                  value={editForm.district}
                  onChange={handleEditChange}
                  required
                  disabled={!editForm.state}
                  className="input-field w-full bg-neutral-900 cursor-pointer disabled:opacity-50"
                >
                  <option value="">Select District</option>
                  {availableDistricts.map(dt => (
                    <option key={dt} value={dt} className="bg-neutral-900 text-white">{dt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
                  Land Size (acres)
                </label>
                <input
                  name="landSizeAcres"
                  type="number"
                  step="0.1"
                  min="0"
                  value={editForm.landSizeAcres}
                  onChange={handleEditChange}
                  className="input-field w-full"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
                  Preferred Language
                </label>
                <select
                  name="language"
                  value={editForm.language}
                  onChange={handleEditChange}
                  className="input-field w-full bg-neutral-900 cursor-pointer"
                >
                  <option value="en" className="bg-neutral-900 text-white">English (en)</option>
                  <option value="hi" className="bg-neutral-900 text-white">हिंदी (hi)</option>
                  <option value="mr" className="bg-neutral-900 text-white">मराठी (mr)</option>
                </select>
              </div>
            </div>

            {/* Crops Selector in Edit Mode */}
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2">
                My Crops (multi-select)
              </label>
              <div className="flex flex-wrap gap-2 max-h-44 overflow-y-auto p-2 bg-black/20 rounded-2xl border border-white/5">
                {allCrops.map(crop => {
                  const isSelected = editForm.crops.includes(crop._id);
                  const displayName = crop.names?.[userLang] || crop.name;
                  return (
                    <button
                      type="button"
                      key={crop._id}
                      onClick={() => toggleCrop(crop._id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-primary text-black font-bold shadow-[0_0_12px_rgba(76,175,80,0.4)]'
                          : 'bg-white/5 text-white/80 hover:bg-white/10 hover:text-white border border-white/10'
                      }`}
                    >
                      {isSelected && <Check size={12} className="stroke-[3]" />}
                      {displayName}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="btn-secondary py-2.5 px-5 text-xs font-bold rounded-xl"
              >
                {t('profile_cancel', userLang)}
              </button>
              <button
                type="submit"
                disabled={saveLoading}
                className="btn-primary py-2.5 px-6 text-xs font-black uppercase tracking-wider rounded-xl shadow-lg shadow-primary/25"
              >
                {saveLoading ? t('profile_saving', userLang) : t('profile_save', userLang)}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── 3. MY CROPS CHIPS ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Sprout size={20} className="text-primary" />
          {t('profile_my_crops', userLang)}
        </h3>

        {profileData?.crops && profileData.crops.length > 0 ? (
          <div className="flex flex-wrap gap-2.5">
            {profileData.crops.map((crop) => {
              const name = typeof crop === 'object' 
                ? (crop.names?.[userLang] || crop.name) 
                : crop;
              return (
                <span
                  key={typeof crop === 'object' ? crop._id : crop}
                  className="px-4 py-2 rounded-2xl bg-primary/10 border border-primary/30 text-primary text-xs font-bold tracking-wide flex items-center gap-2 shadow-[0_0_15px_rgba(76,175,80,0.15)]"
                >
                  <Sprout size={13} className="text-primary/70" />
                  {name}
                </span>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-white/50 italic">No crops selected yet.</p>
        )}
      </div>

      {/* ── 4. MY ACTIVITY (STATS & RECENT POSTS) ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)] space-y-6">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <MessageSquare size={20} className="text-primary" />
          {t('profile_activity_title', userLang)}
        </h3>

        {/* Counts */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
              <HelpCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-white/50 font-bold uppercase">{t('profile_stat_questions', userLang)}</p>
              <p className="text-2xl font-black text-white">{activityStats.questions}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="text-xs text-white/50 font-bold uppercase">{t('profile_stat_answers', userLang)}</p>
              <p className="text-2xl font-black text-white">{activityStats.answers}</p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-white/50 font-bold uppercase">{t('profile_stat_helpful', userLang)}</p>
              <p className="text-2xl font-black text-emerald-400">{activityStats.helpful}</p>
            </div>
          </div>
        </div>

        {/* My Questions List */}
        <div className="pt-2">
          <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-3">
            {t('profile_my_questions', userLang)}
          </h4>
          {myPosts.length > 0 ? (
            <div className="space-y-2.5">
              {myPosts.map(post => (
                <Link
                  key={post._id}
                  to={`/community/${post._id}`}
                  className="p-3.5 rounded-2xl bg-white/[0.02] hover:bg-white/[0.06] border border-white/10 flex items-center justify-between transition-all group"
                >
                  <div className="overflow-hidden pr-3">
                    <p className="text-sm font-bold text-white group-hover:text-primary transition-colors truncate">
                      {post.title}
                    </p>
                    <p className="text-xs text-white/50 truncate mt-0.5">
                      {post.crop?.name || 'Crop'} • {post.commentCount || 0} answers • {new Date(post.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  {post.isSolved && (
                    <span className="px-2.5 py-1 rounded-full bg-green-500/20 text-green-300 text-[10px] font-bold uppercase border border-green-500/30 flex-shrink-0">
                      Solved
                    </span>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-xs text-white/50 italic">{t('profile_no_questions', userLang)}</p>
          )}
        </div>
      </div>

      {/* ── 5. CHANGE PASSWORD ── */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-2">
          <Lock size={20} className="text-primary" />
          {t('profile_change_pwd', userLang)}
        </h3>
        <p className="text-xs text-white/50 mb-6">
          Update your secure login password
        </p>

        {pwdMessage.text && (
          <div className={`p-3.5 rounded-2xl text-xs font-semibold text-center border mb-6 ${
            pwdMessage.type === 'success' 
              ? 'bg-green-500/15 border-green-500/30 text-green-300' 
              : 'bg-red-500/15 border-red-500/30 text-red-300'
          }`}>
            {pwdMessage.text}
          </div>
        )}

        <form onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
              {t('profile_current_pwd', userLang)}
            </label>
            <input
              type="password"
              value={pwdForm.currentPassword}
              onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
              required
              className="input-field w-full"
              placeholder="••••••••"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
                {t('profile_new_pwd', userLang)}
              </label>
              <input
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                required
                minLength={8}
                className="input-field w-full"
                placeholder="Min 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5">
                {t('profile_confirm_pwd', userLang)}
              </label>
              <input
                type="password"
                value={pwdForm.confirmPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, confirmPassword: e.target.value })}
                required
                minLength={8}
                className="input-field w-full"
                placeholder="Re-enter new password"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwdLoading}
            className="btn-primary py-2.5 px-6 text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg shadow-primary/25 mt-2"
          >
            {pwdLoading ? 'Updating...' : t('profile_update_pwd_btn', userLang)}
          </button>
        </form>
      </div>
    </div>
  );
}
