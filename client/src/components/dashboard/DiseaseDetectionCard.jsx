import { Link } from 'react-router-dom';
import { Camera, Bug, ArrowRight, Sparkles } from 'lucide-react';

export default function DiseaseDetectionCard({ recentScan }) {
  // Check if a recent scan was saved or use the reference image default
  const cropLabel = recentScan?.crop || 'Tomato';
  const diseaseLabel = recentScan?.disease || recentScan?.label || 'Early Blight';
  const confidence = recentScan?.confidence ? Math.round(recentScan.confidence) : 91;
  const leafImage = recentScan?.imageUrl || '/leaf-early-blight.jpg';

  return (
    <div id="tour-disease-detect" className="relative overflow-hidden bg-[#0c1b12]/85 backdrop-blur-xl border border-emerald-500/20 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] group text-left">
      {/* Subtle green ambient background glow */}
      <div className="absolute -left-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* ── Left Content ── */}
      <div className="flex-1 space-y-4 z-10 w-full">
        {/* Header Icon & Title */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-[#3d1822] border border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.25)] flex-shrink-0">
            <Bug size={24} className="stroke-[2.2]" />
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <h2 className="text-2xl sm:text-[1.65rem] font-extrabold text-white tracking-tight">
              Disease Detection
            </h2>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider border border-emerald-500/30 shadow-[0_0_10px_rgba(74,222,128,0.2)]">
              Popular
            </span>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm sm:text-base text-white/75 leading-relaxed max-w-md">
          Upload a photo of an affected leaf and get instant AI diagnosis.
        </p>

        {/* Primary Action Button */}
        <div className="pt-2">
          <Link
            to="/disease-detect"
            className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-400 hover:to-green-500 text-black font-extrabold text-sm sm:text-base shadow-[0_4px_25px_rgba(16,185,129,0.45)] hover:shadow-[0_6px_30px_rgba(16,185,129,0.6)] transition-all active:scale-98 cursor-pointer"
          >
            <Camera size={19} className="stroke-[2.5]" />
            <span>Detect Disease Now</span>
            <ArrowRight size={18} className="stroke-[2.5]" />
          </Link>
        </div>
      </div>

      {/* ── Right Content: Leaf Visual Card with Diagnosis Badge ── */}
      <div className="relative w-full md:w-72 lg:w-80 aspect-[4/3] rounded-2xl overflow-hidden border border-white/15 shadow-2xl flex-shrink-0 group-hover:border-emerald-500/40 transition-colors">
        <img
          src={leafImage}
          alt="Affected crop leaf showing early blight spots"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Dark subtle gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/20" />

        {/* Overlaid Diagnosis Badge matching reference image */}
        <div className="absolute bottom-3 left-3 right-3 p-2.5 rounded-xl bg-neutral-950/85 backdrop-blur-md border border-white/15 flex items-center gap-3 shadow-xl">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/20 flex-shrink-0">
            <img src={leafImage} alt="Thumbnail" className="w-full h-full object-cover" />
          </div>
          <div className="overflow-hidden text-xs leading-tight">
            <p className="text-white/60 font-semibold">{cropLabel}</p>
            <p className="text-rose-400 font-extrabold text-sm tracking-tight truncate">
              {diseaseLabel}
            </p>
            <p className="text-white/50 text-[10px] font-mono mt-0.5">
              Confidence: <strong className="text-emerald-400 font-bold">{confidence}%</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
