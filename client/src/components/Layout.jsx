import Sidebar from './Sidebar';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const Layout = ({ children, user, setUser }) => {
    const location = useLocation();

    return (
        <div className="min-h-screen bg-transparent text-on-surface font-body selection:bg-primary selection:text-on-primary">
            <div className="flex min-h-screen">
                <Sidebar user={user} setUser={setUser} />
                
                <div className="flex-1 ml-64 p-8 pt-24 min-h-screen">
                    <AnimatePresence mode="wait">
                        <motion.main
                            key={location.pathname}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -15 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="max-w-7xl mx-auto"
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
