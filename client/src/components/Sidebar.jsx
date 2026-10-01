import { NavLink, useNavigate } from 'react-router-dom';
import { Home as House, Sprout, Bug, TrendingUp, CloudRain, LogOut, Droplets, Landmark, Activity, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

const Sidebar = ({ user, setUser }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('userInfo');
        setUser(null);
        navigate('/');
    };

    const menuItems = [
        { name: 'Dashboard', icon: House, path: '/dashboard' },
        { name: 'Crop Recs', icon: Sprout, path: '/crop-rec' },
        { name: 'Disease Detect', icon: Bug, path: '/disease-detect' },
        { name: 'Market Prices', icon: TrendingUp, path: '/market-prices' },
        { name: 'Weather', icon: CloudRain, path: '/weather' },
        { name: 'Irrigation', icon: Droplets, path: '/irrigation' },
        { name: 'Schemes', icon: Landmark, path: '/schemes' },
        { name: 'Nutrients', icon: Activity, path: '/fertilizer' },
        { name: 'Pest Predict', icon: AlertTriangle, path: '/pest-predict' },
    ];

    return (
        <aside className="fixed left-0 top-0 bottom-0 w-64 z-50 flex flex-col p-4 bg-transparent">
            <div className="glass-panel rounded-3xl h-full flex flex-col font-body font-medium relative">
                {/* Header */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center shadow-[0_0_15px_rgba(120,220,119,0.3)]">
                        <Sprout size={20} className="text-primary" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-primary leading-none">FarmGuide</h1>
                    </div>
                </div>

                {/* Main Tabs - Scrollable */}
                <nav className="flex-1 px-3 space-y-1 mt-2 overflow-y-auto custom-scrollbar">
                    {menuItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) => {
                                const base = "flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-300 group";
                                const active = isActive
                                    ? "bg-primary-container/40 text-primary shadow-[0_0_15px_rgba(120,220,119,0.2)]"
                                    : "text-on-surface-variant/70 hover:bg-white/5 hover:text-primary";
                                return `${base} ${active}`;
                            }}
                        >
                            <item.icon size={18} className="group-hover:scale-110 transition-transform" />
                            <span className="text-sm font-semibold">{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Fixed Footer Section */}
                <div className="p-3 mt-auto border-t border-white/5 bg-white/[0.02]">
                    <div className="flex items-center gap-3 mb-3 px-1">
                        <div className="w-8 h-8 rounded-full border border-primary/30 p-0.5 flex-shrink-0">
                            <div className="w-full h-full bg-primary-container/20 flex items-center justify-center rounded-full text-primary font-bold text-xs">
                                {user?.fullName?.charAt(0) || 'F'}
                            </div>
                        </div>
                        <div className="overflow-hidden">
                            <p className="text-[11px] font-bold text-on-surface truncate leading-tight">{user?.fullName}</p>
                            <p className="text-[9px] text-primary truncate leading-tight">{user?.phone}</p>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        className="w-full bg-gradient-to-r from-primary to-primary-container text-on-primary py-2 rounded-xl font-bold text-xs shadow-[0_4px_12px_rgba(120,220,119,0.2)] hover:brightness-110 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                        <LogOut size={13} />
                        Logout
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
