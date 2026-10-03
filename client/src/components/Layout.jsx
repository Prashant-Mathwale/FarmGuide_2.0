import { useState } from 'react';
import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Sprout } from 'lucide-react';
import WelcomeTour from './WelcomeTour';

const Layout = ({ children, user, setUser }) => {
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-transparent text-on-surface font-body selection:bg-primary selection:text-on-primary">
            <WelcomeTour />
            {/* Mobile Top Header Bar */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-16 bg-[#0c1811]/90 backdrop-blur-md border-b border-white/10 z-30 flex items-center justify-between px-4">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-green-600 flex items-center justify-center">
                        <Sprout size={18} className="text-black stroke-[2.5]" />
                    </div>
                    <span className="font-extrabold text-white text-base">FarmGuide</span>
                </div>
                <button
                    onClick={() => setSidebarOpen(true)}
                    className="p-2 rounded-xl bg-white/5 border border-white/10 text-white/80 hover:text-white"
                    aria-label="Open navigation menu"
                >
                    <Menu size={22} />
                </button>
            </div>

            <div className="flex min-h-screen">
                <Sidebar 
                    user={user} 
                    setUser={setUser} 
                    isOpen={sidebarOpen} 
                    onClose={() => setSidebarOpen(false)} 
                />
                
                <div className="flex-1 md:ml-64 p-3.5 sm:p-6 md:p-8 pt-20 md:pt-8 min-h-screen">
                    <AnimatePresence mode="wait">
                        <motion.main
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.35, ease: "easeOut" }}
                            className="max-w-[1400px] mx-auto"
                        >
                            {children}
                        </motion.main>
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Layout;
