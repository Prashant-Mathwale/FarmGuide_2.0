import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, Brain, BarChart3, CloudRain } from 'lucide-react';

const Landing = () => {
    return (
        <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-transparent">

            {/* Navbar */}
            <nav className="absolute top-0 w-full p-6 flex justify-between items-center z-20 xl:px-24">
                <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-lg p-2 shadow-lg">
                        <Sprout size={24} className="text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight text-white">FarmGuide</span>
                </div>
                <div className="flex gap-4">
                    <Link to="/login" className="btn-secondary">Login</Link>
                    <Link to="/register" className="btn-primary">Get Started</Link>
                </div>
            </nav>

            {/* Hero section */}
            <main className="z-10 flex flex-col items-center justify-center text-center px-6 max-w-5xl mx-auto mt-20">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-medium mb-8 backdrop-blur-md"
                >
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    Powered by Next-Gen AI
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight"
                >
                    Smart Farming <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-300">
                        Powered by AI
                    </span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                    className="text-lg md:text-xl text-slate-400 mb-10 max-w-2xl leading-relaxed"
                >
                    FarmGuide brings enterprise-grade artificial intelligence to your fields. Optimize crop yield, detect diseases early, and predict market trends with precision.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.8, delay: 0.3 }}
                    className="flex flex-col sm:flex-row gap-4"
                >
                    <Link to="/register" className="btn-primary text-lg px-8 py-4 w-full sm:w-auto">
                        Start Free Trial
                    </Link>
                    <a href="#features" className="btn-secondary text-lg px-8 py-4 w-full sm:w-auto">
                        Explore Features
                    </a>
                </motion.div>
            </main>

            {/* Features Grid */}
            <section id="features" className="z-10 w-full max-w-6xl mx-auto px-6 mt-32 pb-24">
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6"
                >
                    <div className="glass-card p-8 group">
                        <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center mb-6 group-hover:bg-emerald-500/20 transition-colors">
                            <Sprout size={24} className="text-emerald-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Crop Recommendation</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Input soil composition and get robust, AI-driven recommendations on the best cash crops to plant for maximum yield.
                        </p>
                    </div>

                    <div className="glass-card p-8 group border-t border-t-emerald-500/30 relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 to-transparent pointer-events-none" />
                        <div className="w-12 h-12 rounded-xl bg-teal-500/10 flex items-center justify-center mb-6 group-hover:bg-teal-500/20 transition-colors">
                            <Brain size={24} className="text-teal-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Disease Detection</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Upload a picture of a diseased leaf and let our CNN models instantly classify the disease and provide treatment steps.
                        </p>
                    </div>

                    <div className="glass-card p-8 group">
                        <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center mb-6 group-hover:bg-blue-500/20 transition-colors">
                            <BarChart3 size={24} className="text-blue-400" />
                        </div>
                        <h3 className="text-xl font-semibold text-white mb-3">Market Insights</h3>
                        <p className="text-slate-400 leading-relaxed">
                            Track real-time commodity pricing across regional mandis to sell at the absolute best margin.
                        </p>
                    </div>
                </motion.div>
            </section>
        </div>
    );
};

export default Landing;
