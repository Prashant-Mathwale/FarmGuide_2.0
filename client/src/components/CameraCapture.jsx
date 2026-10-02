import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Camera, RotateCcw, Zap, ZapOff, SwitchCamera, 
  AlertTriangle, Check, Image as ImageIcon, ShieldAlert, AlertCircle 
} from 'lucide-react';
import { CAMERA_CONFIG, analyzeCapturedFrame } from '../config/camera';

/**
 * CameraCapture — Full-screen mobile-optimized camera modal with live viewfinder,
 * guide-frame overlay, torch toggle, multi-camera switching, preview step,
 * and client-side blur/brightness quality checks.
 *
 * @param {{
 *   onCapture: (file: File) => void,
 *   onClose: () => void,
 *   onSelectFromGallery?: () => void,
 * }} props
 */
export default function CameraCapture({ onCapture, onClose, onSelectFromGallery }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const fileInputRef = useRef(null);

  const [facingMode, setFacingMode] = useState('environment'); // 'environment' | 'user'
  const [videoDevices, setVideoDevices] = useState([]);
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [cameraError, setCameraError] = useState(null);

  // Preview state once a photo is captured
  const [captured, setCaptured] = useState(null); // { dataUrl: string, file: File, quality: object }

  // ──────────────────────────────────────────────────────────────────────────
  // Track Cleanup Helper
  // ──────────────────────────────────────────────────────────────────────────
  const stopStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (e) {
          console.warn('Error stopping video track:', e);
        }
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setTorchOn(false);
    setHasTorch(false);
  }, []);

  // ──────────────────────────────────────────────────────────────────────────
  // Stream Initialization
  // ──────────────────────────────────────────────────────────────────────────
  const startCamera = useCallback(async (mode) => {
    setIsLoading(true);
    setCameraError(null);
    stopStream();

    // 1. Insecure Context / Unsupported check
    if (!navigator?.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setIsLoading(false);
      setCameraError({
        type: 'InsecureContext',
        message: 'Camera access requires a secure connection (HTTPS) or is not supported by your browser.',
      });
      return;
    }

    try {
      // Build constraints from centralized config
      const constraints = {
        video: {
          facingMode: { ideal: mode },
          width: { ideal: CAMERA_CONFIG.CONSTRAINTS.video.width.ideal },
          height: { ideal: CAMERA_CONFIG.CONSTRAINTS.video.height.ideal },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn('Video auto-play warning:', playErr);
        }
      }

      // Check capabilities (Torch support)
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === 'function') {
        const caps = track.getCapabilities() || {};
        setHasTorch(Boolean(caps.torch));
      }

      // Enumerate available video inputs to decide if switch camera button should show
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cams = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cams);
      } catch (enumErr) {
        console.warn('Device enumeration failed:', enumErr);
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Camera access error:', err);
      setIsLoading(false);
      stopStream();

      let errorInfo = {
        type: err.name || 'UnknownError',
        message: 'Could not access the camera. You can choose a photo from your gallery instead.',
      };

      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        errorInfo.message = 'Camera permission was denied. Please allow camera access in browser settings or upload from gallery.';
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        errorInfo.message = 'No camera hardware found on this device. Please select an image from your gallery.';
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        errorInfo.message = 'Camera is already in use by another app or tab. Please close other camera apps and retry.';
      }

      setCameraError(errorInfo);
    }
  }, [stopStream]);

  // Start camera when component mounts or facing mode switches (and not in preview mode)
  useEffect(() => {
    if (!captured) {
      startCamera(facingMode);
    }
    return () => {
      stopStream();
    };
  }, [facingMode, captured, startCamera, stopStream]);

  // ──────────────────────────────────────────────────────────────────────────
  // Switch Camera
  // ──────────────────────────────────────────────────────────────────────────
  const handleSwitchCamera = () => {
    setFacingMode((prev) => (prev === 'environment' ? 'user' : 'environment'));
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Toggle Torch
  // ──────────────────────────────────────────────────────────────────────────
  const handleToggleTorch = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      const nextTorch = !torchOn;
      await track.applyConstraints({
        advanced: [{ torch: nextTorch }],
      });
      setTorchOn(nextTorch);
    } catch (err) {
      console.warn('Failed to toggle torch:', err);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Capture Frame
  // ──────────────────────────────────────────────────────────────────────────
  const handleCapture = () => {
    const video = videoRef.current;
    if (!video || !video.videoWidth || !video.videoHeight) return;

    // Calculate dimensions scaled down to MAX_DIMENSION on the longest side
    const maxDim = CAMERA_CONFIG.MAX_DIMENSION;
    const naturalW = video.videoWidth;
    const naturalH = video.videoHeight;
    let targetW = naturalW;
    let targetH = naturalH;

    if (naturalW >= naturalH) {
      if (naturalW > maxDim) {
        targetW = maxDim;
        targetH = Math.round((naturalH * maxDim) / naturalW);
      }
    } else {
      if (naturalH > maxDim) {
        targetH = maxDim;
        targetW = Math.round((naturalW * maxDim) / naturalH);
      }
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // If front camera, mirror image for natural selfie preview
    if (facingMode === 'user') {
      ctx.translate(targetW, 0);
      ctx.scale(-1, 1);
    }

    ctx.drawImage(video, 0, 0, targetW, targetH);

    // Run client-side quality checks (blur + brightness)
    const quality = analyzeCapturedFrame(canvas, CAMERA_CONFIG);

    // Export JPEG blob
    canvas.toBlob(
      (blob) => {
        if (!blob) return;
        const file = new File([blob], `leaf-capture-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now(),
        });
        const dataUrl = canvas.toDataURL('image/jpeg', CAMERA_CONFIG.JPEG_QUALITY);

        // Turn camera off immediately after capture
        stopStream();

        setCaptured({
          dataUrl,
          file,
          quality,
        });
      },
      'image/jpeg',
      CAMERA_CONFIG.JPEG_QUALITY
    );
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Retake
  // ──────────────────────────────────────────────────────────────────────────
  const handleRetake = () => {
    setCaptured(null);
    startCamera(facingMode);
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Confirm and Use Photo
  // ──────────────────────────────────────────────────────────────────────────
  const handleUsePhoto = () => {
    if (captured?.file) {
      stopStream();
      onCapture(captured.file);
      onClose();
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Gallery Fallback via Hidden File Input
  // ──────────────────────────────────────────────────────────────────────────
  const handleGalleryClick = () => {
    if (onSelectFromGallery) {
      stopStream();
      onClose();
      onSelectFromGallery();
    } else if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleGalleryFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      stopStream();
      onCapture(file);
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black flex flex-col justify-between overflow-hidden select-none"
      style={{
        paddingTop: 'max(env(safe-area-inset-top), 0.75rem)',
        paddingBottom: 'max(env(safe-area-inset-bottom), 1.25rem)',
        paddingLeft: 'max(env(safe-area-inset-left), 0.75rem)',
        paddingRight: 'max(env(safe-area-inset-right), 0.75rem)',
      }}
    >
      {/* Hidden file input for gallery fallback */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleGalleryFileChange}
      />

      {/* ────────────────────────────────────────────────────────────────────
          TOP CONTROL BAR
      ──────────────────────────────────────────────────────────────────── */}
      <div className="relative z-20 flex items-center justify-between px-3 py-2 w-full max-w-2xl mx-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            stopStream();
            onClose();
          }}
          className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-lg"
          aria-label="Close camera"
        >
          <X size={22} />
        </button>

        {/* Center Title / Mode Indicator */}
        <div className="px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10 text-white/80 text-xs font-semibold tracking-wider uppercase flex items-center gap-1.5">
          <Camera size={14} className="text-green-400" />
          <span>{captured ? 'Review Photo' : 'Leaf Scanner'}</span>
        </div>

        {/* Right Tools (Torch & Camera Switch) */}
        <div className="flex items-center gap-2">
          {!captured && hasTorch && (
            <button
              onClick={handleToggleTorch}
              className={`w-11 h-11 rounded-full backdrop-blur-md border flex items-center justify-center transition-all active:scale-95 shadow-lg ${
                torchOn
                  ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.6)]'
                  : 'bg-black/60 text-white border-white/20 hover:bg-white/20'
              }`}
              aria-label="Toggle flash/torch"
            >
              {torchOn ? <Zap size={20} className="fill-black" /> : <ZapOff size={20} />}
            </button>
          )}

          {!captured && videoDevices.length > 1 && (
            <button
              onClick={handleSwitchCamera}
              className="w-11 h-11 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white flex items-center justify-center hover:bg-white/20 active:scale-95 transition-all shadow-lg"
              aria-label="Switch camera"
            >
              <SwitchCamera size={20} />
            </button>
          )}

          {captured && (
            <div className="w-11 h-11" /> /* Spacer to keep header balanced */
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          MAIN VIEWPORT (VIDEO / PREVIEW / ERROR)
      ──────────────────────────────────────────────────────────────────── */}
      <div className="relative flex-1 w-full max-w-2xl mx-auto flex items-center justify-center overflow-hidden rounded-3xl my-2 bg-neutral-950 border border-white/10 shadow-2xl">
        {/* CAMERA ERROR STATE */}
        {cameraError ? (
          <div className="p-6 text-center max-w-md mx-auto flex flex-col items-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
              {cameraError.type === 'NotAllowedError' ? (
                <ShieldAlert size={36} />
              ) : (
                <AlertCircle size={36} />
              )}
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Camera Unavailable</h3>
            <p className="text-white/70 text-sm mb-6 leading-relaxed">
              {cameraError.message}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <button
                onClick={handleGalleryClick}
                className="flex-1 py-3.5 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-black font-semibold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(74,222,128,0.3)] hover:brightness-110 active:scale-95 transition-all"
              >
                <ImageIcon size={18} /> Choose from Gallery
              </button>
              <button
                onClick={() => startCamera(facingMode)}
                className="py-3.5 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white font-medium text-sm flex items-center justify-center gap-2 active:scale-95 transition-all"
              >
                <RotateCcw size={16} /> Retry
              </button>
            </div>
          </div>
        ) : captured ? (
          /* PREVIEW STATE */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-3">
            <div className="relative max-w-full max-h-full rounded-2xl overflow-hidden shadow-2xl border border-white/20 flex items-center justify-center bg-black">
              <img
                src={captured.dataUrl}
                alt="Captured leaf preview"
                className="max-h-[65vh] w-auto object-contain rounded-xl"
              />

              {/* Non-blocking Quality Warning Banner */}
              {captured.quality.warnings.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="absolute top-3 left-3 right-3 p-3 rounded-xl bg-amber-950/90 backdrop-blur-md border border-amber-500/40 text-amber-200 text-xs shadow-lg flex items-start gap-2.5 z-30"
                >
                  <AlertTriangle size={18} className="text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-semibold text-amber-300 mb-0.5">Quality advisory</p>
                    <p className="text-amber-200/90 leading-snug">
                      {captured.quality.warnings[0]} You can proceed or retake.
                    </p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        ) : (
          /* LIVE VIEWFINDER */
          <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-opacity duration-300 ${
                isLoading ? 'opacity-0' : 'opacity-100'
              } ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />

            {/* Spinner during camera start */}
            {isLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white/60 gap-3">
                <div className="w-10 h-10 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs font-medium tracking-wider uppercase text-white/70">
                  Starting Camera...
                </span>
              </div>
            )}

            {/* CENTERED GUIDE FRAME OVERLAY */}
            {!isLoading && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center p-6">
                {/* Visual Leaf Target Box */}
                <div className="relative w-64 h-64 sm:w-72 sm:h-72 border border-white/20 rounded-3xl flex items-center justify-center">
                  {/* Corner Reticles */}
                  <div className="absolute -top-1 -left-1 w-7 h-7 border-t-4 border-l-4 border-green-400 rounded-tl-xl shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                  <div className="absolute -top-1 -right-1 w-7 h-7 border-t-4 border-r-4 border-green-400 rounded-tr-xl shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                  <div className="absolute -bottom-1 -left-1 w-7 h-7 border-b-4 border-l-4 border-green-400 rounded-bl-xl shadow-[0_0_10px_rgba(74,222,128,0.5)]" />
                  <div className="absolute -bottom-1 -right-1 w-7 h-7 border-b-4 border-r-4 border-green-400 rounded-br-xl shadow-[0_0_10px_rgba(74,222,128,0.5)]" />

                  {/* Subtle Center Target Crosshair */}
                  <div className="w-3 h-3 border border-white/30 rounded-full" />
                </div>

                {/* Instruction Pill */}
                <div className="mt-4 px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white/90 text-xs font-medium tracking-wide shadow-lg text-center">
                  Fit one leaf inside the frame
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────
          BOTTOM ACTION BAR
      ──────────────────────────────────────────────────────────────────── */}
      <div className="relative z-20 w-full max-w-2xl mx-auto px-4 py-3 flex items-center justify-around min-h-[90px]">
        {captured ? (
          /* PREVIEW ACTIONS */
          <div className="flex items-center justify-center gap-6 w-full">
            <button
              onClick={handleRetake}
              className="flex-1 max-w-[160px] py-3.5 px-4 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 border border-white/20 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg"
            >
              <RotateCcw size={18} /> Retake
            </button>
            <button
              onClick={handleUsePhoto}
              className="flex-1 max-w-[160px] py-3.5 px-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 active:scale-95 text-black font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-[0_0_25px_rgba(74,222,128,0.4)]"
            >
              <Check size={18} className="stroke-[3]" /> Use Photo
            </button>
          </div>
        ) : !cameraError ? (
          /* LIVE VIEW ACTIONS */
          <div className="flex items-center justify-between w-full max-w-md px-6">
            {/* Gallery fallback shortcut */}
            <button
              onClick={handleGalleryClick}
              className="w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 border border-white/15 text-white/90 flex flex-col items-center justify-center transition-all shadow-md"
              aria-label="Upload from gallery"
              title="Upload from gallery"
            >
              <ImageIcon size={20} />
            </button>

            {/* Shutter Capture Button */}
            <button
              onClick={handleCapture}
              disabled={isLoading}
              className="relative w-20 h-20 rounded-full border-4 border-white/80 p-1 flex items-center justify-center active:scale-90 transition-transform shadow-[0_0_25px_rgba(255,255,255,0.3)] disabled:opacity-50"
              aria-label="Capture leaf photo"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-tr from-green-400 to-emerald-500 shadow-[0_0_15px_rgba(74,222,128,0.6)]" />
            </button>

            {/* Placeholder / Empty balancing button */}
            <div className="w-12 h-12" />
          </div>
        ) : null}
      </div>
    </div>
  );
}
