import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  MapPin, Calendar, Globe, Bell, User as UserIcon,
  Sun, CloudSun, Droplets, CloudRain, Wind 
} from 'lucide-react';

export default function DashboardHeader({ user, weatherData, selectedLang, onLangChange, isWeatherLoading }) {
  const [showLangMenu, setShowLangMenu] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const username = user?.fullName?.split(' ')[0] || user?.fullName || 'Farmer';
  const location = user?.district && user?.state 
    ? `${user.district}, ${user.state}` 
    : user?.district || 'Pune, Maharashtra';

  // Format today's date: e.g. "Tue, 30 Sep 2026"
  const formattedDate = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const temp = weatherData?.current?.temp ? Math.round(weatherData.current.temp) : 28;
  const condition = weatherData?.current?.description || 'Partly Cloudy';
  const humidity = weatherData?.current?.humidity ?? 62;
  const rainChance = weatherData?.current?.rainChance ?? 20;
  const windSpeed = weatherData?.current?.windSpeed 
    ? `${Math.round(weatherData.current.windSpeed * 3.6)} km/h` 
    : '12 km/h';

  const languages = [
    { code: 'en', label: 'English' },
    { code: 'hi', label: 'हिंदी (Hindi)' },
    { code: 'mr', label: 'मराठी (Marathi)' },
    { code: 'pa', label: 'ਪੰਜਾਬੀ (Punjabi)' },
    { code: 'gu', label: 'ગુજરાતી (Gujarati)' },
    { code: 'ta', label: 'தமிழ் (Tamil)' },
    { code: 'te', label: 'తెలుగు (Telugu)' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'ml', label: 'മലയാളം (Malayalam)' },
    { code: 'bn', label: 'বাংলা (Bengali)' },
    { code: 'or', label: 'ଓଡ଼ିଆ (Odia)' },
    { code: 'ur', label: 'اردو (Urdu)' }
  ];

  return (
    <header className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 mb-8 text-left">
      {/* ── Left Side: Greeting & Meta ── */}
      <div className="relative max-w-2xl">
        {/* Soft dark backing aura to guarantee 100% legibility on any background image */}
        <div className="absolute -inset-3 sm:-inset-4 bg-gradient-to-r from-black/70 via-black/45 to-transparent rounded-3xl blur-md pointer-events-none -z-10" />

        <h1 
          className="text-3xl sm:text-4xl lg:text-[2.65rem] font-extrabold text-white tracking-tight leading-tight"
          style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 4px 20px rgba(0, 0, 0, 0.85), 0 1px 3px rgba(0, 0, 0, 1)' }}
        >
          {getGreeting()},{' '}
          <span 
            className="text-emerald-400 font-extrabold inline-block"
            style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.95), 0 0 25px rgba(52, 211, 153, 0.7)' }}
          >
            {username}
          </span>{' '}
          <span className="inline-block drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">👋</span>
        </h1>
        <p 
          className="text-sm sm:text-base text-emerald-50/95 font-medium mt-1.5"
          style={{ textShadow: '0 1px 6px rgba(0, 0, 0, 0.95), 0 2px 12px rgba(0, 0, 0, 0.85)' }}
        >
          Here's what's happening with your farm today.
        </p>

        <div className="flex flex-wrap items-center gap-3 mt-3.5 text-xs sm:text-sm font-semibold">
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
            <MapPin size={15} className="text-emerald-400 drop-shadow" />
            <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{location}</span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white shadow-[0_4px_14px_rgba(0,0,0,0.6)]">
            <Calendar size={15} className="text-emerald-400 drop-shadow" />
            <span style={{ textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>{formattedDate}</span>
          </div>
        </div>
      </div>

      {/* ── Right Side: Top Action Controls & Weather Summary ── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 lg:self-start">
        {/* Top Controls: Language, Notifications, Profile */}
        <div className="flex items-center justify-end gap-2.5 sm:self-start lg:absolute lg:top-8 lg:right-8">
          {/* Language Selector */}
          <div className="relative">
            <button
              onClick={() => setShowLangMenu(!showLangMenu)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-[#0d1c13]/80 hover:bg-[#14281b] border border-white/15 text-xs font-semibold text-white/90 hover:text-white transition-all shadow-md cursor-pointer"
            >
              <Globe size={15} className="text-emerald-400" />
              <span>{languages.find(l => l.code === selectedLang)?.label.split(' ')[0] || 'Select Language'}</span>
              <span className="text-[10px] text-white/40">▼</span>
            </button>

            {showLangMenu && (
              <div className="absolute right-0 mt-2 w-44 max-h-72 overflow-y-auto custom-scrollbar rounded-2xl bg-[#09150d] border border-white/15 p-1.5 shadow-2xl z-50 text-left">
                {languages.map(lang => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLangChange(lang.code);
                      setShowLangMenu(false);
                      const gtCombo = document.querySelector('.goog-te-combo');
                      if (gtCombo) {
                        gtCombo.value = lang.code;
                        gtCombo.dispatchEvent(new Event('change'));
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
                      selectedLang === lang.code 
                        ? 'bg-emerald-500/20 text-emerald-300 font-bold' 
                        : 'text-white/80 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notification Icon */}
          <button 
            className="w-10 h-10 rounded-2xl bg-[#0d1c13]/80 hover:bg-[#14281b] border border-white/15 flex items-center justify-center text-white/80 hover:text-white transition-all shadow-md cursor-pointer relative"
            title="Notifications"
          >
            <Bell size={17} />
            <span className="w-2 h-2 rounded-full bg-emerald-400 absolute top-2.5 right-2.5 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
          </button>

          {/* Profile Button */}
          <Link
            to="/profile"
            className="w-10 h-10 rounded-2xl bg-[#0d1c13]/80 hover:bg-[#14281b] border border-white/15 flex items-center justify-center text-white/80 hover:text-emerald-400 transition-all shadow-md cursor-pointer"
            title="My Profile"
          >
            <UserIcon size={18} />
          </Link>
        </div>

        {/* ── Weather Summary Card (Top Right in Reference Image) ── */}
        <div className="lg:mt-14 w-full sm:w-auto bg-[#0b1810]/80 backdrop-blur-xl border border-white/15 rounded-3xl p-4 sm:px-6 sm:py-3.5 flex items-center gap-5 shadow-[0_8px_30px_rgba(0,0,0,0.5)] min-h-[88px] min-w-[280px]">
          {isWeatherLoading ? (
            <div className="flex items-center justify-center w-full gap-3">
              <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <span className="text-sm font-medium text-emerald-400/80 animate-pulse">Detecting weather...</span>
            </div>
          ) : (
            <>
              {/* Main Temp & Condition */}
              <div className="flex items-center gap-3 pr-4 border-r border-white/10">
                <div className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]">
                  <CloudSun size={38} className="stroke-[1.75]" />
                </div>
                <div>
                  <p className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-none">
                    {temp}°C
                  </p>
                  <p className="text-xs text-white/70 font-semibold mt-1 capitalize whitespace-nowrap">
                    {condition}
                  </p>
                </div>
              </div>

              {/* Weather Secondary Stats */}
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between gap-3 text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Droplets size={13} className="text-blue-400" /> Humidity
                  </span>
                  <span className="font-bold text-white font-mono">{humidity}%</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-white/60">
                  <span className="flex items-center gap-1.5">
                    <CloudRain size={13} className="text-sky-400" /> Rain Chance
                  </span>
                  <span className="font-bold text-white font-mono">{rainChance}%</span>
                </div>
                <div className="flex items-center justify-between gap-3 text-white/60">
                  <span className="flex items-center gap-1.5">
                    <Wind size={13} className="text-teal-400" /> Wind
                  </span>
                  <span className="font-bold text-white font-mono">{windSpeed}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
