import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Newspaper, ExternalLink, Calendar, Loader2, AlertCircle, Search } from 'lucide-react';

export default function News() {
    const [news, setNews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('General');
    const [fetchTrigger, setFetchTrigger] = useState(0);

    const handleSearch = (e) => {
        e.preventDefault();
        setActiveTab('Search');
        setFetchTrigger(prev => prev + 1);
    };

    useEffect(() => {
        const fetchNews = async () => {
            setLoading(true);
            setError('');
            try {
                let query = 'agriculture+farming+india';
                if (activeTab === 'General') query = 'agriculture+farming+india';
                else if (activeTab === 'Market Trends') query = 'crop+commodity+market+prices+india';
                else if (activeTab === 'Fertilizers') query = 'fertilizers+pesticides+agrochemicals+india';
                else if (activeTab === 'Subsidies') query = 'yojana+government+schemes+subsidies+farmers+india';
                else if (activeTab === 'Search' && searchQuery) query = encodeURIComponent(searchQuery) + '+agriculture+india';
                
                // Add a timestamp to the rss URL to completely bust any intermediate caches
                const rssUrl = encodeURIComponent(`https://news.google.com/rss/search?q=${query}&hl=en-IN&gl=IN&ceid=IN:en&_cb=${Date.now()}`);
                // Use allorigins proxy to bypass CORS
                const proxyUrl = `https://api.allorigins.win/get?url=${rssUrl}`;
                
                const response = await fetch(proxyUrl);
                const data = await response.json();

                if (data.contents) {
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(data.contents, "text/xml");
                    
                    const items = Array.from(xmlDoc.querySelectorAll("item")).slice(0, 12).map(item => ({
                        title: item.querySelector("title")?.textContent,
                        link: item.querySelector("link")?.textContent,
                        pubDate: item.querySelector("pubDate")?.textContent,
                        description: item.querySelector("description")?.textContent,
                        author: item.querySelector("source")?.textContent || "Google News"
                    }));
                    
                    setNews(items);
                } else {
                    setError('Failed to fetch the latest agricultural news.');
                }
            } catch (err) {
                console.error("News fetch error:", err);
                setError('Could not connect to the news server.');
            } finally {
                setLoading(false);
            }
        };

        fetchNews();
    }, [activeTab, fetchTrigger]);

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString('en-IN', options);
    };

    return (
        <div className="w-full max-w-6xl mx-auto pb-10">
            <header className="mb-10 mt-4 flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                    <Newspaper size={32} className="text-blue-400" />
                </div>
                <div>
                    <h2 className="text-4xl font-headline font-bold text-on-surface tracking-tight">
                        Agri <span className="text-blue-400" style={{ textShadow: '0 0 20px rgba(96,165,250,0.4)' }}>News</span>
                    </h2>
                    <p className="text-on-surface-variant text-sm mt-1">Latest updates, farming techniques, and government policies</p>
                </div>
            </header>

            {/* Navigation & Search Bar */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex bg-surface border border-white/10 rounded-2xl p-1 overflow-x-auto custom-scrollbar flex-1">
                    {['General', 'Market Trends', 'Fertilizers', 'Subsidies'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 min-w-[120px] py-2.5 px-4 rounded-xl text-sm font-bold transition-all ${
                                activeTab === tab 
                                ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_rgba(96,165,250,0.15)]' 
                                : 'text-on-surface-variant hover:text-on-surface hover:bg-white/5'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                <form onSubmit={handleSearch} className="flex gap-2 relative flex-1">
                    <input
                        type="text"
                        placeholder="Search local news (e.g. Pune market)..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full bg-surface border border-white/10 rounded-2xl px-5 py-3 text-sm focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 text-on-surface placeholder:text-on-surface-variant/50"
                    />
                    <button type="submit" className="absolute right-2 top-2 bottom-2 bg-blue-500 text-white rounded-xl px-4 flex items-center justify-center hover:bg-blue-400 transition-colors shadow-lg shadow-blue-500/20">
                        <Search size={16} />
                    </button>
                </form>
            </div>

            {error && (
                <div className="glass-panel p-6 bg-red-500/10 border-red-500/30 mb-8 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="text-red-400" size={24} />
                    <p className="text-red-200">{error}</p>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <Loader2 size={40} className="animate-spin text-blue-400" />
                    <p className="text-on-surface-variant font-medium">Curating top agricultural news...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <AnimatePresence>
                        {news.map((item, idx) => (
                            <motion.a
                                href={item.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                layout
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.05 }}
                                key={idx}
                                className="glass-card p-6 flex flex-col group hover:border-blue-500/40 relative overflow-hidden h-full cursor-pointer"
                            >
                                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                                
                                <div className="flex justify-between items-start mb-4">
                                    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold tracking-wider uppercase text-blue-400">
                                        <Calendar size={12} />
                                        {formatDate(item.pubDate)}
                                    </span>
                                </div>
                                
                                <h3 className="text-lg font-bold text-on-surface mb-3 line-clamp-3 leading-snug group-hover:text-blue-300 transition-colors">
                                    {item.title}
                                </h3>
                                
                                <p className="text-sm text-on-surface-variant mb-6 flex-1 line-clamp-3 leading-relaxed" dangerouslySetInnerHTML={{ __html: item.description?.replace(/<[^>]*>?/gm, '') }} />
                                
                                <div className="mt-auto pt-4 border-t border-white/5 flex items-center justify-between">
                                    <span className="text-xs font-bold text-on-surface-variant uppercase truncate max-w-[60%]">
                                        {item.author || "News Source"}
                                    </span>
                                    <span className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                                        <ExternalLink size={14} />
                                    </span>
                                </div>
                            </motion.a>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}
