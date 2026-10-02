import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, Check, Globe } from 'lucide-react';
import api from '../services/api';
import { t } from '../config/translations';

function Register({ setAuthUser }) {
    const [locations, setLocations] = useState({});
    const [availableCrops, setAvailableCrops] = useState([]);
    const [selectedLanguage, setSelectedLanguage] = useState('en');

    const [formData, setFormData] = useState({
        fullName: '',
        phone: '',
        password: '',
        confirmPassword: '',
        state: '',
        district: '',
        landSizeAcres: '',
        crops: [],
        language: 'en'
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fetchingMeta, setFetchingMeta] = useState(true);
    const navigate = useNavigate();

    // Fetch dynamic locations and crops from backend
    useEffect(() => {
        let isMounted = true;
        const fetchMeta = async () => {
            try {
                const [locRes, cropRes] = await Promise.all([
                    api.get('/meta/locations'),
                    api.get('/meta/crops')
                ]);
                if (isMounted) {
                    if (locRes.data?.locations) setLocations(locRes.data.locations);
                    if (cropRes.data?.crops) setAvailableCrops(cropRes.data.crops);
                }
            } catch (err) {
                console.error('Error fetching registration metadata:', err);
            } finally {
                if (isMounted) setFetchingMeta(false);
            }
        };
        fetchMeta();
        return () => { isMounted = false; };
    }, []);

    const handleLanguageChange = (lang) => {
        setSelectedLanguage(lang);
        setFormData(prev => ({ ...prev, language: lang }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name === 'state') {
            setFormData(prev => ({ ...prev, state: value, district: '' }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const toggleCrop = (cropId) => {
        setFormData(prev => {
            const exists = prev.crops.includes(cropId);
            return {
                ...prev,
                crops: exists 
                    ? prev.crops.filter(id => id !== cropId) 
                    : [...prev.crops, cropId]
            };
        });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');

        // Client-side validations
        const cleanPhone = formData.phone.trim();
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(cleanPhone)) {
            setError(t('reg_err_phone', selectedLanguage));
            return;
        }

        if (formData.password.length < 8) {
            setError(t('reg_err_password_length', selectedLanguage));
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            setError(t('reg_err_password_match', selectedLanguage));
            return;
        }

        if (!formData.state || !formData.district) {
            setError(t('reg_err_state_district', selectedLanguage));
            return;
        }

        if (!formData.crops || formData.crops.length === 0) {
            setError(t('reg_err_crops', selectedLanguage));
            return;
        }

        setLoading(true);
        try {
            const payload = {
                fullName: formData.fullName.trim(),
                phone: cleanPhone,
                password: formData.password,
                state: formData.state,
                district: formData.district,
                landSizeAcres: formData.landSizeAcres ? Number(formData.landSizeAcres) : 1,
                crops: formData.crops,
                language: formData.language
            };

            const res = await api.post('/auth/register', payload);
            localStorage.setItem('userInfo', JSON.stringify(res.data));
            setAuthUser(res.data);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    const availableDistricts = formData.state && locations[formData.state] 
        ? locations[formData.state] 
        : [];

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 sm:p-6 py-10 bg-transparent">
            <motion.div
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-xl z-10 glass-panel rounded-3xl p-6 sm:p-10 border border-white/10"
            >
                {/* Header & Language Selector */}
                <div className="flex flex-col items-center justify-center mb-6 relative">
                    <div className="absolute right-0 top-0 flex items-center gap-1 bg-white/5 border border-white/10 rounded-xl px-2 py-1">
                        <Globe size={13} className="text-primary" />
                        <select 
                            value={selectedLanguage}
                            onChange={(e) => handleLanguageChange(e.target.value)}
                            className="bg-transparent text-xs text-white outline-none cursor-pointer"
                        >
                            <option value="en" className="bg-neutral-900 text-white">English</option>
                            <option value="hi" className="bg-neutral-900 text-white">हिंदी</option>
                            <option value="mr" className="bg-neutral-900 text-white">मराठी</option>
                        </select>
                    </div>

                    <div className="w-12 h-12 bg-primary-container/20 rounded-2xl flex items-center justify-center mb-3 shadow-lg shadow-primary/20 border border-primary/30">
                        <Sprout size={24} className="text-primary" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-headline font-black text-on-surface tracking-tight text-center">
                        {t('reg_title', selectedLanguage)}
                    </h2>
                    <p className="text-on-surface-variant font-body mt-1 text-xs uppercase tracking-widest font-bold text-center">
                        {t('reg_subtitle', selectedLanguage)}
                    </p>
                </div>

                {error && (
                    <div className="bg-error/15 border border-error/30 text-error p-3.5 rounded-2xl mb-6 text-xs font-semibold text-center leading-relaxed">
                        {error}
                    </div>
                )}

                <form onSubmit={handleRegister} className="space-y-4 sm:space-y-5">
                    {/* Full Name */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                            {t('reg_full_name', selectedLanguage)} *
                        </label>
                        <input
                            name="fullName"
                            type="text"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                            className="input-field w-full"
                            placeholder={t('reg_full_name_placeholder', selectedLanguage)}
                        />
                    </div>

                    {/* Phone Number */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                            {t('reg_phone', selectedLanguage)} *
                        </label>
                        <input
                            name="phone"
                            type="tel"
                            maxLength={10}
                            value={formData.phone}
                            onChange={handleChange}
                            required
                            className="input-field w-full font-mono"
                            placeholder={t('reg_phone_placeholder', selectedLanguage)}
                        />
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                                {t('reg_password', selectedLanguage)} *
                            </label>
                            <input
                                name="password"
                                type="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength={8}
                                className="input-field w-full"
                                placeholder={t('reg_password_placeholder', selectedLanguage)}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                                {t('reg_confirm_password', selectedLanguage)} *
                            </label>
                            <input
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                required
                                minLength={8}
                                className="input-field w-full"
                                placeholder={t('reg_confirm_password_placeholder', selectedLanguage)}
                            />
                        </div>
                    </div>

                    {/* State & District */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                                {t('reg_state', selectedLanguage)} *
                            </label>
                            <select
                                name="state"
                                value={formData.state}
                                onChange={handleChange}
                                required
                                className="input-field w-full bg-neutral-900/80 cursor-pointer"
                            >
                                <option value="">{t('reg_select_state', selectedLanguage)}</option>
                                {Object.keys(locations).map(st => (
                                    <option key={st} value={st} className="bg-neutral-900 text-white">{st}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                                {t('reg_district', selectedLanguage)} *
                            </label>
                            <select
                                name="district"
                                value={formData.district}
                                onChange={handleChange}
                                required
                                disabled={!formData.state}
                                className="input-field w-full bg-neutral-900/80 cursor-pointer disabled:opacity-50"
                            >
                                <option value="">{t('reg_select_district', selectedLanguage)}</option>
                                {availableDistricts.map(dt => (
                                    <option key={dt} value={dt} className="bg-neutral-900 text-white">{dt}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Land Size (Optional) */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-1.5 ml-1">
                            {t('reg_land_size', selectedLanguage)}
                        </label>
                        <input
                            name="landSizeAcres"
                            type="number"
                            step="0.1"
                            min="0"
                            value={formData.landSizeAcres}
                            onChange={handleChange}
                            className="input-field w-full"
                            placeholder={t('reg_land_size_placeholder', selectedLanguage)}
                        />
                    </div>

                    {/* Multi-Select Crops */}
                    <div>
                        <label className="block text-xs font-bold text-primary uppercase tracking-widest mb-2 ml-1">
                            {t('reg_crops', selectedLanguage)} *
                        </label>
                        {fetchingMeta ? (
                            <p className="text-white/40 text-xs italic">Loading crops...</p>
                        ) : (
                            <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto custom-scrollbar p-1.5 bg-black/20 rounded-2xl border border-white/5">
                                {availableCrops.map(crop => {
                                    const isSelected = formData.crops.includes(crop._id);
                                    const displayName = crop.names?.[selectedLanguage] || crop.name;
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
                                            {isSelected && <Check size={13} className="text-black stroke-[3]" />}
                                            {displayName}
                                        </button>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-[11px] text-white/50 mt-1.5 ml-1">
                            Selected: {formData.crops.length} {formData.crops.length === 1 ? 'crop' : 'crops'}
                        </p>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full btn-primary text-sm h-12 uppercase tracking-widest font-black mt-2 shadow-[0_10px_25px_rgba(76,175,80,0.3)] active:scale-[0.98]"
                    >
                        {loading ? t('reg_btn_submitting', selectedLanguage) : t('reg_btn_submit', selectedLanguage)}
                    </button>
                </form>

                <p className="mt-6 text-center text-on-surface-variant text-xs sm:text-sm">
                    {t('reg_has_account', selectedLanguage)}{' '}
                    <Link to="/login" className="text-primary hover:underline font-bold transition-colors">
                        {t('reg_login_link', selectedLanguage)}
                    </Link>
                </p>
            </motion.div>
        </div>
    );
}

export default Register;
