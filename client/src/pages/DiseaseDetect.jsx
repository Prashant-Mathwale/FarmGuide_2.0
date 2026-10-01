import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, CheckCircle2, AlertTriangle, ScanLine, X, Sparkles } from 'lucide-react';
import api from '../services/api';

function DiseaseDetect() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);

    const handleImageChange = (file) => {
        if (file && file.type.startsWith('image/')) {
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
            setResult(null);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === "dragenter" || e.type === "dragover") {
            setIsDragging(true);
        } else if (e.type === "dragleave") {
            setIsDragging(false);
        }
    };
    
    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleImageChange(e.dataTransfer.files[0]);
        }
    };

    const handleDetect = async () => {
        if (!selectedImage) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('image', selectedImage);

            const res = await api.post('/ml/disease-detect', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            // Simulate slight delay for the premium "scanning" animation feel
            setTimeout(() => {
                setResult(res.data);
                setLoading(false);
            }, 1200);
        } catch (err) {
            console.error('Detection Error:', err);
            const errorMsg = err.response?.data?.message || 'Detection failed. Please check your internet and make sure the server is running.';
            alert(errorMsg);
            setLoading(false);
        }
    };

    return (
        <div className="w-full max-w-5xl mx-auto">
            <header className="mb-12 text-center">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-gradient-to-br from-green-400/20 to-emerald-600/20 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-green-400/30 shadow-[0_0_30px_rgba(76,175,80,0.3)]"
                >
                    <ScanLine size={40} className="text-green-400 drop-shadow-[0_0_10px_rgba(76,175,80,0.8)]" />
                </motion.div>
                <motion.h2 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold tracking-tight text-white mb-3 text-glow-strong"
                >
                    Automated Diagnostic Tool
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="text-white/70 text-lg max-w-2xl mx-auto tracking-wide"
                >
                    Upload high-resolution multispectral imagery of the affected biomass to initiate CNN classification profiling.
                </motion.p>
            </header>

            <div className="glass-panel p-8 md:p-12 relative overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-green-500/10 rounded-full blur-[100px] -z-10" />

                {!previewUrl ? (
                    <div
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                        className={`w-full h-96 dash-drop-zone flex flex-col items-center justify-center cursor-pointer ${isDragging ? "border-green-400 bg-green-500/10 shadow-[0_0_30px_rgba(76,175,80,0.2)]" : ""}`}
                    >
                        <div className={`p-5 rounded-full mb-6 transition-all duration-300 ${isDragging ? 'bg-green-500/20 text-green-400 scale-110 shadow-[0_0_20px_rgba(76,175,80,0.4)]' : ' text-white/50 border border-white/5'}`}>
                            <UploadCloud size={48} />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Drag & drop image here</h3>
                        <p className="text-white/50 text-base">Or click to browse from your computer (JPEG, PNG)</p>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={(e) => handleImageChange(e.target.files[0])}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="relative rounded-3xl overflow-hidden glass-card aspect-square border-2 border-green-500/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] group p-2">
                            <div className="w-full h-full rounded-2xl overflow-hidden relative">
                                <img src={previewUrl} alt="Crop Leaf" className="w-full h-full object-cover" />
                                {!loading && !result && (
                                    <button
                                        onClick={() => setPreviewUrl(null)}
                                        className="absolute top-4 right-4 backdrop-blur-md text-white p-2.5 rounded-full hover:bg-red-500 hover:shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-all z-20"
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                                {loading && (
                                    <div className="absolute inset-0 glass-panel flex flex-col items-center justify-center border-4 border-green-500 shadow-[inset_0_0_80px_rgba(76,175,80,0.5)] z-20">
                                        <ScanLine size={64} className="text-green-400 animate-pulse mb-6 drop-shadow-[0_0_15px_rgba(76,175,80,0.8)]" />
                                        <div className="w-64 h-1.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-400" style={{ width: '50%', animation: 'sweep 2s infinite ease-in-out alternate', filter: 'drop-shadow(0 0 8px rgba(76,175,80,0.9))' }} />
                                        </div>
                                        <style>{`@keyframes sweep { 0% { transform: translateX(-100%) } 100% { transform: translateX(200%) } }`}</style>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex flex-col justify-center h-full">
                            {!result && !loading && (
                                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                    <h3 className="text-3xl font-bold text-white mb-3 flex items-center gap-3">
                                        <Sparkles className="text-green-400" size={28} />
                                        Image Ready
                                    </h3>
                                    <p className="text-white/60 text-lg mb-10">Initiate the analysis when you're ready.</p>
                                    <button onClick={handleDetect} className="btn-primary w-full text-xl py-5 flex items-center justify-center shadow-[0_10px_30px_rgba(76,175,80,0.3)]">
                                        <ScanLine className="mr-3" size={28} /> Run Diagnostics
                                    </button>
                                </motion.div>
                            )}

                            <AnimatePresence>
                                {result && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="glass-card p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-green-500/20 relative overflow-hidden"
                                    >
                                        {(() => {
                                            const isHealthy = result.detectedDisease.toLowerCase().includes('healthy');
                                            return (
                                                <>
                                                    <div className={`absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none ${isHealthy ? 'bg-green-500/10' : 'bg-red-500/10'}`} />

                                                    <div className="mb-8 pb-8 border-b border-white/10 relative z-10">
                                                        <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">
                                                            {isHealthy ? 'Plant Status' : 'Detected Pathogen'}
                                                        </p>
                                                        <h4 className={`text-3xl font-bold flex items-center ${isHealthy ? 'text-green-400 drop-shadow-[0_0_10px_rgba(74,222,128,0.3)]' : 'text-red-400 drop-shadow-[0_0_10px_rgba(248,113,113,0.3)]'}`}>
                                                            {isHealthy ? <CheckCircle2 className="mr-3 text-green-500" size={32} /> : <AlertTriangle className="mr-3 text-red-500" size={32} />}
                                                            <span className="capitalize">{result.detectedDisease}</span>
                                                        </h4>
                                                    </div>

                                                    <div className="mb-10 relative z-10">
                                                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">Recommended Protocol</p>
                                                        <p className="text-white/90 text-[1.1rem] leading-relaxed">{result.suggestedAction}</p>
                                                    </div>

                                                    <button onClick={() => { setPreviewUrl(null); setResult(null); }} className="w-full btn-secondary py-4 text-lg border-white/20 hover:bg-white/10 hover:border-white/40">
                                                        Scan Another Image
                                                    </button>
                                                </>
                                            );
                                        })()}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default DiseaseDetect;
