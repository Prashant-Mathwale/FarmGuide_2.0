import { NavLink, Link, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Users, Sprout, Bug, AlertTriangle, 
  TrendingUp, Cloud, Landmark, Newspaper, LogOut, User as UserIcon, X, HelpCircle, ShieldAlert
} from 'lucide-react';

const Sidebar = ({ user, setUser, isOpen, onClose }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        if (setUser) setUser(null);
        navigate('/');
    };

    // Ordered exactly as requested and shown in reference image
    const menuItems = [
        { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
        { name: 'Community', icon: Users, path: '/community' },
        { name: 'Crop Recs', icon: Sprout, path: '/crop-rec' },
        { name: 'Disease Detect', icon: Bug, path: '/disease-detect' },
        { name: 'Disease Advisor', icon: ShieldAlert, path: '/disease-advisor' },
        { name: 'Pest Predict', icon: AlertTriangle, path: '/pest-predict' },

        { name: 'Market Prices', icon: TrendingUp, path: '/market-prices' },
        { name: 'Weather', icon: Cloud, path: '/weather' },
        { name: 'Govt Schemes', icon: Landmark, path: '/schemes' },
        { name: 'User Guide', icon: HelpCircle, path: '/guide' },
    ];

    const displayName = user?.fullName?.split(' ')[0] || user?.fullName || 'Farmer';

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div 
                    onClick={onClose}
                    className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 md:hidden"
                />
            )}

            <aside className={`fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col p-4 bg-transparent select-none transition-transform duration-300 md:translate-x-0 ${
                isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
            }`}>
                <div className="bg-[#0b1710]/90 backdrop-blur-xl border border-white/10 rounded-3xl h-full flex flex-col font-body font-medium relative shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
                    {/* Header / Logo */}
                    <div className="p-6 pb-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center shadow-[0_0_20px_rgba(74,222,128,0.35)]">
                                <Sprout size={22} className="text-black stroke-[2.5]" />
                            </div>
                            <h1 className="text-xl font-extrabold text-white tracking-tight leading-none">
                                FarmGuide
                            </h1>
                        </div>

                        {/* Mobile close button */}
                        <button 
                            onClick={onClose}
                            className="md:hidden text-white/60 hover:text-white p-1 rounded-lg"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Main Tabs - Scrollable */}
                    <nav className="flex-1 px-3 space-y-1.5 mt-2 overflow-y-auto custom-scrollbar">
                        {menuItems.map((item) => (
                            <NavLink
                                key={item.name}
                                to={item.path}
                                onClick={() => onClose?.()}
                                className={({ isActive }) => {
                                    const base = "flex items-center gap-3.5 px-4 py-2.5 rounded-2xl transition-all duration-200 group text-sm font-semibold";
                                    const active = isActive
                                        ? "bg-[#14532d] text-white shadow-[0_0_18px_rgba(20,83,45,0.6)] border border-emerald-500/30"
                                        : "text-white/70 hover:bg-white/[0.06] hover:text-white";
                                    return `${base} ${active}`;
                                }}
                            >
                                <item.icon size={19} className="group-hover:scale-110 transition-transform" />
                                <span>{item.name}</span>
                            </NavLink>
                        ))}
                    </nav>

                    {/* Fixed Footer Profile Card */}
                    <div className="p-3 mt-auto">
                        <div className="bg-[#050c07]/70 border border-white/10 rounded-2xl p-3 shadow-lg">
                            <Link 
                                to="/profile"
                                onClick={() => onClose?.()}
                                className="flex items-center gap-3 mb-3 p-1 rounded-xl hover:bg-white/5 transition-all group cursor-pointer"
                                title="View My Profile"
                            >
                                <div className="w-10 h-10 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/90 group-hover:border-emerald-400 transition-colors flex-shrink-0">
                                    <UserIcon size={20} />
                                </div>
                                <div className="overflow-hidden">
                                    <p className="text-sm font-bold text-white truncate leading-tight group-hover:text-emerald-400 transition-colors capitalize">
                                        {displayName}
                                    </p>
                                    <p className="text-[11px] text-white/50 truncate leading-tight mt-0.5">
                                        My Profile
                                    </p>
                                </div>
                            </Link>

                            <button 
                                onClick={handleLogout}
                                className="w-full bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-400 py-2 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer shadow-[0_0_12px_rgba(16,185,129,0.15)]"
                            >
                                <LogOut size={14} className="rotate-180" />
                                Logout
                            </button>
                        </div>
                    </div>
                </div>
            </aside>
        </>
    );
};

export default Sidebar;
