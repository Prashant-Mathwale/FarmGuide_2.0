import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  UploadCloud, CheckCircle2, AlertTriangle, ScanLine, X, Sparkles, 
  Camera, HelpCircle, ImageOff, ShieldAlert, RefreshCw, Image as ImageIcon 
} from 'lucide-react';
import api from '../services/api';
import CameraCapture from '../components/CameraCapture';

function DiseaseDetect() {
    const [selectedImage, setSelectedImage] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isCameraOpen, setIsCameraOpen] = useState(false);

    const fileInputRef = useRef(null);
    const cameraFallbackInputRef = useRef(null);

    const handleOpenPhotoCapture = (e) => {
        e?.stopPropagation?.();
        const canUseCustomCamera = typeof navigator !== 'undefined' &&
            Boolean(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
        if (canUseCustomCamera) {
            setIsCameraOpen(true);
        } else if (cameraFallbackInputRef.current) {
            cameraFallbackInputRef.current.click();
        } else if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    };

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

    const handleReset = () => {
        setPreviewUrl(null);
        setResult(null);
        setSelectedImage(null);
    };

    // Determine guard status from result (default to 'ok' for backward compat)
    const guardStatus = result?.status || 'ok';

    // Retake tips shown for poor_quality and uncertain statuses
    const retakeTips = [
        "Use a single leaf filling most of the frame",
        "Ensure good, natural daylight",
        "Hold the camera steady and close to the leaf",
        "Avoid shadows and harsh glare on the surface",
        "Place the leaf on a plain, contrasting background",
    ];

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
                        className={`w-full min-h-[22rem] dash-drop-zone flex flex-col items-center justify-center p-6 text-center ${isDragging ? "border-green-400 bg-green-500/10 shadow-[0_0_30px_rgba(76,175,80,0.2)]" : ""}`}
                    >
                        <div className={`p-5 rounded-full mb-4 transition-all duration-300 ${isDragging ? 'bg-green-500/20 text-green-400 scale-110 shadow-[0_0_20px_rgba(76,175,80,0.4)]' : 'text-white/50 border border-white/5 bg-white/5'}`}>
                            <UploadCloud size={44} />
                        </div>
                        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Upload or capture leaf image</h3>
                        <p className="text-white/50 text-sm sm:text-base max-w-md mb-8">
                            Take a live photo of the affected plant leaf or choose an existing image from your device.
                        </p>

                        {/* Dual Action Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full max-w-md z-10">
                            <button
                                type="button"
                                onClick={handleOpenPhotoCapture}
                                className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 active:scale-95 text-black font-bold text-base flex items-center justify-center gap-3 shadow-[0_0_25px_rgba(74,222,128,0.35)] transition-all cursor-pointer"
                            >
                                <Camera size={22} className="stroke-[2.5]" />
                                <span>Take photo</span>
                            </button>

                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    fileInputRef.current?.click();
                                }}
                                className="w-full sm:w-auto flex-1 py-4 px-6 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-white font-semibold text-base flex items-center justify-center gap-3 transition-all shadow-lg cursor-pointer"
                            >
                                <ImageIcon size={22} />
                                <span>Choose from gallery</span>
                            </button>
                        </div>

                        {/* Hidden file input for gallery picker */}
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    handleImageChange(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />

                        {/* Native camera fallback input when getUserMedia is not supported */}
                        <input
                            type="file"
                            ref={cameraFallbackInputRef}
                            accept="image/*"
                            capture="environment"
                            onChange={(e) => {
                                if (e.target.files?.[0]) {
                                    handleImageChange(e.target.files[0]);
                                }
                            }}
                            className="hidden"
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        {/* Left panel: Image / Heatmap */}
                        <div className={`relative rounded-3xl overflow-hidden glass-card ${result?.heatmap ? 'p-6' : 'aspect-square p-2'} border-2 border-green-500/20 shadow-[0_0_40px_rgba(0,0,0,0.5)] group flex flex-col justify-center`}>
                            {result && result.heatmap ? (
                                <div className="flex flex-col gap-4">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col gap-2">
                                            <div className="relative rounded-2xl overflow-hidden glass-card aspect-square border border-white/10 p-1">
                                                <img src={previewUrl} alt="Original Leaf" className="w-full h-full object-cover rounded-xl" />
                                            </div>
                                            <span className="text-white/70 text-xs font-semibold text-center tracking-wide">Original</span>
                                        </div>
                                        <div className="flex flex-col gap-2">
                                            <div className="relative rounded-2xl overflow-hidden glass-card aspect-square border border-green-500/30 p-1 shadow-[0_0_20px_rgba(76,175,80,0.2)]">
                                                <img 
                                                    src={result.heatmap.startsWith('data:') ? result.heatmap : `data:image/jpeg;base64,${result.heatmap}`} 
                                                    alt="Grad-CAM Heatmap Overlay" 
                                                    className="w-full h-full object-cover rounded-xl" 
                                                />
                                            </div>
                                            <span className="text-green-400 text-xs font-semibold text-center tracking-wide">Model Focus (Grad-CAM)</span>
                                        </div>
                                    </div>
                                    <p className="text-white/60 text-xs text-center italic tracking-wide px-2 mt-1">
                                        Highlighted areas show where the model focused. This is a guide, not a diagnosis.
                                    </p>
                                </div>
                            ) : (
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
                            )}
                        </div>

                        {/* Right panel: Results */}
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
                                        {/* ── STATUS: OK ── */}
                                        {guardStatus === 'ok' && result.detectedDisease && (() => {
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

                                                    <button onClick={handleReset} className="w-full btn-secondary py-4 text-lg border-white/20 hover:bg-white/10 hover:border-white/40">
                                                        Scan Another Image
                                                    </button>
                                                </>
                                            );
                                        })()}

                                        {/* ── STATUS: POSSIBLE ── */}
                                        {guardStatus === 'possible' && result.detectedDisease && (
                                            <>
                                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none bg-yellow-500/10" />

                                                <div className="mb-6 pb-6 border-b border-white/10 relative z-10">
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-400 text-xs font-bold uppercase tracking-wider border border-yellow-500/30">
                                                            Possible Match — Please Verify
                                                        </span>
                                                    </div>
                                                    <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-2">Most Likely Pathogen</p>
                                                    <h4 className="text-2xl font-bold text-yellow-400 flex items-center drop-shadow-[0_0_10px_rgba(250,204,21,0.3)]">
                                                        <HelpCircle className="mr-3 text-yellow-500" size={28} />
                                                        <span className="capitalize">{result.detectedDisease}</span>
                                                    </h4>
                                                </div>

                                                {/* Top-3 alternatives */}
                                                {result.topPredictions?.length > 0 && (
                                                    <div className="mb-6 relative z-10">
                                                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">Top Possibilities</p>
                                                        <div className="space-y-2">
                                                            {result.topPredictions.map((pred, i) => (
                                                                <div key={i} className="flex items-center justify-between glass-panel px-4 py-2.5 rounded-xl">
                                                                    <span className="text-white/80 text-sm capitalize">{pred.label}</span>
                                                                    <span className="text-yellow-400/80 text-xs font-mono">{pred.confidence?.toFixed(1)}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {result.suggestedAction && (
                                                    <div className="mb-8 relative z-10">
                                                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-3">Recommended Protocol</p>
                                                        <p className="text-white/90 text-[1.1rem] leading-relaxed">{result.suggestedAction}</p>
                                                    </div>
                                                )}

                                                <button onClick={handleReset} className="w-full btn-secondary py-4 text-lg border-white/20 hover:bg-white/10 hover:border-white/40 flex items-center justify-center gap-2">
                                                    <RefreshCw size={18} /> Retake / Upload Another
                                                </button>
                                            </>
                                        )}

                                        {/* ── STATUS: UNCERTAIN ── */}
                                        {guardStatus === 'uncertain' && (
                                            <>
                                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none bg-orange-500/10" />

                                                <div className="mb-6 relative z-10 text-center">
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30">
                                                        <HelpCircle size={32} className="text-orange-400" />
                                                    </div>
                                                    <h4 className="text-2xl font-bold text-orange-400 mb-2">We're Not Sure</h4>
                                                    <p className="text-white/70 text-base">
                                                        {result.guardMessage || "We could not identify this reliably. Please retake the photo."}
                                                    </p>
                                                </div>

                                                {/* Tips for better photo */}
                                                <div className="mb-6 relative z-10 glass-panel p-5 rounded-2xl">
                                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <Camera size={14} /> Tips for a Better Photo
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {retakeTips.map((tip, i) => (
                                                            <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                                                                <span className="text-green-400 mt-0.5">•</span> {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Top-3 as closest guesses (low confidence) */}
                                                {result.topPredictions?.length > 0 && (
                                                    <div className="mb-6 relative z-10">
                                                        <p className="text-orange-400/70 text-xs font-bold uppercase tracking-widest mb-3">Closest Guesses (Low Confidence)</p>
                                                        <div className="space-y-2">
                                                            {result.topPredictions.map((pred, i) => (
                                                                <div key={i} className="flex items-center justify-between glass-panel px-4 py-2.5 rounded-xl opacity-70">
                                                                    <span className="text-white/60 text-sm capitalize">{pred.label}</span>
                                                                    <span className="text-orange-400/60 text-xs font-mono">{pred.confidence?.toFixed(1)}%</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                <button onClick={handleReset} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(76,175,80,0.3)]">
                                                    <RefreshCw size={18} /> Retake Photo
                                                </button>
                                            </>
                                        )}

                                        {/* ── STATUS: NOT_A_LEAF ── */}
                                        {guardStatus === 'not_a_leaf' && (
                                            <>
                                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none bg-red-500/10" />

                                                <div className="mb-8 relative z-10 text-center">
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                                        <ImageOff size={32} className="text-red-400" />
                                                    </div>
                                                    <h4 className="text-2xl font-bold text-red-400 mb-2">Not a Plant Leaf</h4>
                                                    <p className="text-white/70 text-base">
                                                        {result.guardMessage || "This doesn't look like a plant leaf. Please upload a clear photo of a single leaf."}
                                                    </p>
                                                </div>

                                                <button onClick={handleReset} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(76,175,80,0.3)]">
                                                    <RefreshCw size={18} /> Upload Another Image
                                                </button>
                                            </>
                                        )}

                                        {/* ── STATUS: POOR_QUALITY ── */}
                                        {guardStatus === 'poor_quality' && (
                                            <>
                                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none bg-yellow-500/10" />

                                                <div className="mb-6 relative z-10 text-center">
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/20 flex items-center justify-center border border-yellow-500/30">
                                                        <ShieldAlert size={32} className="text-yellow-400" />
                                                    </div>
                                                    <h4 className="text-2xl font-bold text-yellow-400 mb-2">Image Quality Too Low</h4>
                                                    <p className="text-white/70 text-base mb-4">
                                                        {result.guardMessage || "The photo quality is too low for reliable analysis."}
                                                    </p>
                                                </div>

                                                {/* Show specific reasons */}
                                                {result.reasons?.length > 0 && (
                                                    <div className="mb-6 relative z-10 glass-panel p-5 rounded-2xl">
                                                        <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-3">Issues Detected</p>
                                                        <ul className="space-y-2">
                                                            {result.reasons.map((reason, i) => (
                                                                <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                                                                    <AlertTriangle size={14} className="text-yellow-400 mt-0.5 flex-shrink-0" /> {reason}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                )}

                                                {/* Tips */}
                                                <div className="mb-6 relative z-10 glass-panel p-5 rounded-2xl">
                                                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
                                                        <Camera size={14} /> Tips for a Better Photo
                                                    </p>
                                                    <ul className="space-y-2">
                                                        {retakeTips.map((tip, i) => (
                                                            <li key={i} className="text-white/70 text-sm flex items-start gap-2">
                                                                <span className="text-green-400 mt-0.5">•</span> {tip}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <button onClick={handleReset} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(76,175,80,0.3)]">
                                                    <RefreshCw size={18} /> Retake Photo
                                                </button>
                                            </>
                                        )}

                                        {/* ── STATUS: INVALID_IMAGE ── */}
                                        {guardStatus === 'invalid_image' && (
                                            <>
                                                <div className="absolute top-0 right-0 w-32 h-32 rounded-full blur-[50px] pointer-events-none bg-red-500/10" />

                                                <div className="mb-8 relative z-10 text-center">
                                                    <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-red-500/20 flex items-center justify-center border border-red-500/30">
                                                        <X size={32} className="text-red-400" />
                                                    </div>
                                                    <h4 className="text-2xl font-bold text-red-400 mb-2">Unreadable File</h4>
                                                    <p className="text-white/70 text-base">
                                                        {result.guardMessage || "We couldn't read this file. Please try another image."}
                                                    </p>
                                                </div>

                                                <button onClick={handleReset} className="w-full btn-primary py-4 text-lg flex items-center justify-center gap-2 shadow-[0_10px_30px_rgba(76,175,80,0.3)]">
                                                    <RefreshCw size={18} /> Try Another Image
                                                </button>
                                            </>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                )}
            </div>

            {/* Full-screen Camera Capture Overlay */}
            <AnimatePresence>
                {isCameraOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                    >
                        <CameraCapture
                            onCapture={(file) => {
                                setIsCameraOpen(false);
                                handleImageChange(file);
                            }}
                            onClose={() => setIsCameraOpen(false)}
                            onSelectFromGallery={() => {
                                setIsCameraOpen(false);
                                fileInputRef.current?.click();
                            }}
                        />
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default DiseaseDetect;
