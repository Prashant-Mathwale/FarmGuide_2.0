import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sprout, Bug, TrendingUp, CloudRain, ChevronRight, Activity, Droplets, Landmark, AlertTriangle } from 'lucide-react';
import api from '../services/api';

function Dashboard() {
    const user = JSON.parse(localStorage.getItem('userInfo'));
    const [trendData, setTrendData] = useState([]);
    const [trendMetrics, setTrendMetrics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTrend = async () => {
            try {
                const { data } = await api.get('/market/trend?crop=wheat');
                if (data.success) {
                    setTrendData(data.data.chart_data);
                    setTrendMetrics({
                        volatility: data.data.volatility_status,
                        recommendation: data.data.recommendation,
                        current: data.data.current_price,
                        sma: data.data.sma
                    });
                }
            } catch (error) {
                console.error("Dashboard: Trend data load failed", error);
            } finally {
                setLoading(false);
            }
        };
        fetchTrend();
    }, []);

    const containerVariants = {
        hidden: { opacity: 0 },
        show: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
    };

    return (
        <div className="w-full max-w-7xl mx-auto">
            <section className="mb-10 mt-4">
                <h2 className="font-headline text-4xl font-bold text-on-surface tracking-tight leading-tight">
                    Welcome back, <span className="text-primary glow-text">{user?.fullName?.split(' ')[0]}</span>
                </h2>
            </section>

            <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10"
            >
                {/* Feature Cards Loop */}
                {[
                    { to: "/crop-rec", icon: Sprout, color: "primary", title: "Crop Recs", desc: "Predictive seasonal analysis" },
                    { to: "/disease-detect", icon: Bug, color: "error", title: "Disease Detect", desc: "AI foliage scanning" },
                    { to: "/market-prices", icon: TrendingUp, color: "secondary", title: "Market Insights", desc: "Real-time tracking" },
                    { to: "/weather", icon: CloudRain, color: "primary", title: "Weather", desc: "Local micro-climatics" },
                    { to: "/irrigation", icon: Droplets, color: "blue-400", title: "Irrigation", desc: "Smart valve control" },
                    { to: "/schemes", icon: Landmark, color: "primary", title: "Govt Schemes", desc: "Financial aid tracking" },
                    { to: "/pest-predict", icon: AlertTriangle, color: "orange-400", title: "Pest Predict", desc: "Outbreak risk assessment" },
                    { to: "/fertilizer", icon: Activity, color: "secondary", title: "Nutrient Calc", desc: "NPK ratio mapping" }
                ].map((item, idx) => (
                    <Link key={idx} to={item.to} className="lg:col-span-1">
                        <motion.div variants={itemVariants} className="glass-panel glass-card-hover rounded-3xl p-6 transition-all duration-300 flex flex-col justify-between group h-48">
                            <div className="flex justify-between items-start">
                                <div className={`w-12 h-12 bg-${item.color}/10 rounded-2xl flex items-center justify-center text-${item.color} group-hover:scale-110 transition-transform`}>
                                    <item.icon size={28} />
                                </div>
                                <ChevronRight className="text-on-surface-variant/40 group-hover:text-primary transition-colors cursor-pointer" />
                            </div>
                            <div>
                                <h3 className={`font-headline text-lg font-bold text-${item.color} drop-shadow-[0_2px_4px_rgba(0,0,0,0.4)]`}>{item.title}</h3>
                                <p className="text-on-surface-variant text-xs mt-1 drop-shadow-md">{item.desc}</p>
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </motion.div>
        </div>
    );
}

export default Dashboard;
