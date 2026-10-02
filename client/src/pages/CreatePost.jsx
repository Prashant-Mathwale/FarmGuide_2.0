import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Camera, Image as ImageIcon, X, AlertTriangle, 
  Sprout, ShieldAlert, Sparkles, Check
} from 'lucide-react';
import api from '../services/api';
import CameraCapture from '../components/CameraCapture';
import { t } from '../config/translations';

export default function CreatePost({ user }) {
  const navigate = useNavigate();
  const location = useLocation();

  // Incoming state from "Share a Scan" in DiseaseDetect.jsx (Stage 4)
  const scanData = location.state || null;

  const [crops, setCrops] = useState([]);
  const [selectedCrop, setSelectedCrop] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [photos, setPhotos] = useState([]); // array of File objects
  const [photoPreviews, setPhotoPreviews] = useState([]); // array of preview URLs

  // Camera modal state
  const [isCameraOpen, setIsCameraOpen] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const galleryInputRef = useRef(null);
  const userLang = user?.language || 'en';

  const TITLE_MAX = 120;
  const BODY_MAX = 2000;
  const MAX_PHOTOS = 3;

  // Fetch available crops
  useEffect(() => {
    let isMounted = true;
    const fetchCrops = async () => {
      try {
        const res = await api.get('/meta/crops');
        if (isMounted && res.data?.crops) {
          setCrops(res.data.crops);

          // Priority 1: Match crop from incoming scanData (if shared from disease detection)
          if (scanData?.cropKey || scanData?.cropName) {
            const matched = res.data.crops.find(c => 
              c.key === scanData.cropKey || 
              c.name.toLowerCase().includes((scanData.cropName || '').toLowerCase())
            );
            if (matched) {
              setSelectedCrop(matched._id);
              return;
            }
          }

          // Priority 2: User's first crop from profile
          if (user?.crops && user.crops.length > 0) {
            const firstUserCropId = typeof user.crops[0] === 'object' ? user.crops[0]._id : user.crops[0];
            setSelectedCrop(firstUserCropId);
          } else if (res.data.crops.length > 0) {
            setSelectedCrop(res.data.crops[0]._id);
          }
        }
      } catch (e) {
        console.error('Failed to load crops', e);
      }
    };

    fetchCrops();

    // If pre-filled scan data exists (Stage 4)
    if (scanData) {
      if (scanData.suggestedTitle) setTitle(scanData.suggestedTitle);
      if (scanData.suggestedBody) setBody(scanData.suggestedBody);
      if (scanData.imageFile instanceof File) {
        setPhotos([scanData.imageFile]);
        setPhotoPreviews([URL.createObjectURL(scanData.imageFile)]);
      }
    }

    return () => { isMounted = false; };
  }, [scanData, user]);

  // Handle gallery file selection
  const handleGallerySelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const remainingSlots = MAX_PHOTOS - photos.length;
    if (remainingSlots <= 0) return;

    const validFiles = files.slice(0, remainingSlots).filter(file => {
      const isAllowed = ['image/jpeg', 'image/png', 'image/webp'].includes(file.type);
      const isSizeOk = file.size <= 5 * 1024 * 1024;
      return isAllowed && isSizeOk;
    });

    if (validFiles.length < files.length) {
      setError('Some files were skipped. Only JPEG, PNG, WebP up to 5MB are allowed.');
    }

    const newPreviews = validFiles.map(f => URL.createObjectURL(f));
    setPhotos(prev => [...prev, ...validFiles]);
    setPhotoPreviews(prev => [...prev, ...newPreviews]);
  };

  // Handle photo captured from CameraCapture
  const handleCameraCapture = (file) => {
    if (photos.length >= MAX_PHOTOS) return;
    setPhotos(prev => [...prev, file]);
    setPhotoPreviews(prev => [...prev, URL.createObjectURL(file)]);
    setIsCameraOpen(false);
  };

  // Remove photo
  const handleRemovePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
    setPhotoPreviews(prev => {
      URL.revokeObjectURL(prev[index]);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedCrop) {
      setError('Please select a crop');
      return;
    }

    if (!title.trim()) {
      setError('Please provide a title');
      return;
    }

    if (!body.trim()) {
      setError('Please provide description details');
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('crop', selectedCrop);
      formData.append('title', title.trim());
      formData.append('body', body.trim());

      if (scanData?.scanSummary) {
        formData.append('scanSummary', JSON.stringify(scanData.scanSummary));
      }

      photos.forEach(file => {
        formData.append('images', file);
      });

      const res = await api.post('/community/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.post?._id) {
        navigate(`/community/${res.data.post._id}`);
      } else {
        navigate('/community');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to publish post');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-16 text-white text-left">
      {/* ── BACK BUTTON & TITLE ── */}
      <div className="flex items-center gap-3">
        <Link
          to="/community"
          className="w-10 h-10 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
        >
          <ArrowLeft size={18} />
        </Link>
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            {t('community_btn_ask', userLang)}
          </h2>
          <p className="text-xs text-white/50">
            {t('community_posting_as', userLang)}{' '}
            <strong className="text-white capitalize">{user?.fullName}</strong>
            {user?.district ? `, ${user.district}` : ''}
          </p>
        </div>
      </div>

      {/* ── MANDATORY KVK ADVISORY NOTICE ── */}
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.1)]">
        <ShieldAlert size={18} className="text-amber-400 flex-shrink-0 mt-0.5" />
        <p className="leading-relaxed">
          {t('community_disclaimer', userLang)}
        </p>
      </div>

      {/* Scan Share Consent Banner (Stage 4) */}
      {scanData && (
        <div className="p-4 rounded-2xl bg-purple-500/15 border border-purple-500/30 text-purple-200 text-xs flex items-center justify-between gap-3 shadow-[0_0_15px_rgba(168,85,247,0.15)]">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-purple-400" />
            <p className="leading-relaxed font-medium">
              {t('community_share_consent', userLang)}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-xl bg-purple-500/20 text-purple-300 text-[10px] font-bold uppercase tracking-wider">
            {scanData.scanSummary?.label || 'Scan Attached'}
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-2xl bg-error/15 border border-error/30 text-error text-xs font-semibold text-center">
          {error}
        </div>
      )}

      {/* ── POST CREATION FORM ── */}
      <form onSubmit={handleSubmit} className="glass-card p-6 sm:p-8 rounded-3xl border border-white/10 space-y-6 shadow-[0_15px_40px_rgba(0,0,0,0.5)]">
        {/* Crop Selection */}
        <div>
          <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
            {t('community_crop_select', userLang)} *
          </label>
          <select
            value={selectedCrop}
            onChange={(e) => setSelectedCrop(e.target.value)}
            required
            className="input-field w-full bg-neutral-900 cursor-pointer"
          >
            <option value="">Select Crop</option>
            {crops.map(crop => (
              <option key={crop._id} value={crop._id} className="bg-neutral-900 text-white">
                {crop.names?.[userLang] || crop.name}
              </option>
            ))}
          </select>
        </div>

        {/* Title & Counter */}
        <div>
          <div className="flex items-center justify-between mb-1.5 ml-1">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest">
              {t('community_post_title', userLang)} *
            </label>
            <span className={`text-[11px] font-mono ${title.length > TITLE_MAX ? 'text-red-400' : 'text-white/40'}`}>
              {title.length} / {TITLE_MAX}
            </span>
          </div>
          <input
            type="text"
            maxLength={TITLE_MAX}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder={t('community_post_title_placeholder', userLang)}
            className="input-field w-full"
          />
        </div>

        {/* Body & Counter */}
        <div>
          <div className="flex items-center justify-between mb-1.5 ml-1">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest">
              {t('community_post_body', userLang)} *
            </label>
            <span className={`text-[11px] font-mono ${body.length > BODY_MAX ? 'text-red-400' : 'text-white/40'}`}>
              {body.length} / {BODY_MAX}
            </span>
          </div>
          <textarea
            rows={5}
            maxLength={BODY_MAX}
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
            placeholder={t('community_post_body_placeholder', userLang)}
            className="input-field w-full resize-none leading-relaxed"
          />
        </div>

        {/* Photo Upload: Up to 3 photos */}
        <div>
          <div className="flex items-center justify-between mb-2 ml-1">
            <label className="block text-xs font-bold text-primary uppercase tracking-widest">
              {t('community_photos_label', userLang)}
            </label>
            <span className="text-[11px] text-white/40 font-mono">
              {photos.length} / {MAX_PHOTOS}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* Preview Thumbnails */}
            {photoPreviews.map((url, i) => (
              <div key={i} className="relative w-24 h-24 rounded-2xl overflow-hidden border border-white/20 bg-black/40 group">
                <img src={url} alt="Attached preview" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => handleRemovePhoto(i)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                >
                  <X size={13} />
                </button>
              </div>
            ))}

            {/* Action buttons (if under max 3) */}
            {photos.length < MAX_PHOTOS && (
              <div className="flex gap-2">
                {/* Camera button */}
                <button
                  type="button"
                  onClick={() => setIsCameraOpen(true)}
                  className="h-24 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-primary flex flex-col items-center justify-center gap-1.5 text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <Camera size={20} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase">{t('community_camera_btn', userLang)}</span>
                </button>

                {/* Gallery button */}
                <button
                  type="button"
                  onClick={() => galleryInputRef.current?.click()}
                  className="h-24 px-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-dashed border-white/20 hover:border-primary flex flex-col items-center justify-center gap-1.5 text-white/70 hover:text-white transition-all cursor-pointer"
                >
                  <ImageIcon size={20} className="text-primary" />
                  <span className="text-[10px] font-bold uppercase">{t('community_gallery_btn', userLang)}</span>
                </button>
                <input
                  ref={galleryInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleGallerySelect}
                  className="hidden"
                />
              </div>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full btn-primary py-4 text-sm font-bold uppercase tracking-widest rounded-2xl shadow-[0_10px_25px_rgba(76,175,80,0.3)] cursor-pointer"
        >
          {loading ? t('community_submitting_post', userLang) : t('community_submit_post', userLang)}
        </button>
      </form>

      {/* Camera Capture Modal */}
      {isCameraOpen && (
        <CameraCapture
          onCapture={handleCameraCapture}
          onClose={() => setIsCameraOpen(false)}
        />
      )}
    </div>
  );
}
