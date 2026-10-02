import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, 
  ExternalLink, Clock, Sparkles, Leaf, Beaker, FileText, X,
  Printer, ArrowRight
} from 'lucide-react';

/**
 * RecommendationCard — Displays essential diagnosis details adjacent to the image,
 * with a modal trigger for the full, detailed agronomic report.
 *
 * @param {{
 *   recommendation: object | null,
 *   confidence: number | null,
 *   status: string,
 *   cropLabel?: string,
 *   diseaseLabel?: string,
 * }} props
 */
export default function RecommendationCard({ 
  recommendation, 
  confidence, 
  status = 'ok', 
  cropLabel, 
  diseaseLabel 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Close modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsModalOpen(false);
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isModalOpen]);

  if (!recommendation) {
    return null;
  }

  const isHealthy = Boolean(recommendation.is_healthy);
  const isPossible = status === 'possible';
  const isFallback = recommendation.source === 'fallback';

  const crop = recommendation.crop || cropLabel || 'Crop';
  const disease = recommendation.disease || diseaseLabel || 'Diagnosis';

  return (
    <>
      {/* ──────────────────────────────────────────────────────────────────
          ADJACENT SUMMARY CARD (COMPACT ESSENTIAL DETAILS ONLY)
      ────────────────────────────────────────────────────────────────── */}
      <div className="w-full flex flex-col gap-5 text-left">
        {/* Header Badges & Confidence */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2">
            {isHealthy ? (
              <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 text-xs font-bold uppercase tracking-wider border border-green-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(74,222,128,0.2)]">
                <CheckCircle2 size={14} className="text-green-400" />
                Healthy Plant
              </span>
            ) : isPossible ? (
              <span className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold uppercase tracking-wider border border-yellow-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(250,204,21,0.2)]">
                <HelpCircle size={14} className="text-yellow-400" />
                Possible Match
              </span>
            ) : (
              <span className="px-3 py-1 rounded-full bg-red-500/20 text-red-300 text-xs font-bold uppercase tracking-wider border border-red-500/30 flex items-center gap-1.5 shadow-[0_0_15px_rgba(248,113,113,0.2)]">
                <AlertTriangle size={14} className="text-red-400" />
                Active Pathogen
              </span>
            )}

            {recommendation.reviewed === false && (
              <span className="px-2.5 py-1 rounded-full bg-white/10 text-white/70 text-[11px] font-medium tracking-wide flex items-center gap-1 border border-white/10">
                <Clock size={12} className="text-amber-400" />
                Awaiting review
              </span>
            )}
          </div>

          {confidence !== null && confidence !== undefined && (
            <span className="px-3 py-1 rounded-xl bg-white/5 border border-white/10 text-white/80 font-mono text-xs">
              Match: <strong className="text-white">{confidence.toFixed(1)}%</strong>
            </span>
          )}
        </div>

        {/* Diagnosis Titles */}
        <div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest mb-1">
            {crop}
          </p>
          <h3 className={`text-2xl sm:text-3xl font-extrabold capitalize tracking-tight ${
            isHealthy ? 'text-green-400 text-glow' : isPossible ? 'text-yellow-400' : 'text-red-400'
          }`}>
            {isHealthy ? 'Your plant looks healthy' : disease}
          </h3>
        </div>

        {/* Plain Language Summary */}
        <p className="text-white/80 text-sm leading-relaxed">
          {recommendation.summary || recommendation.message}
        </p>

        {/* Essential Immediate Action (if diseased) */}
        {!isHealthy && recommendation.immediate_actions?.length > 0 && (
          <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 relative overflow-hidden shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Priority Action:
              </h4>
            </div>
            <p className="text-white/95 text-xs sm:text-sm font-medium leading-relaxed">
              {recommendation.immediate_actions[0]}
            </p>
          </div>
        )}

        {/* For Healthy Plants: Key care highlight */}
        {isHealthy && recommendation.prevention?.length > 0 && (
          <div className="p-4 rounded-2xl bg-green-500/10 border border-green-500/20">
            <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Sparkles size={14} /> Care Tip
            </h4>
            <p className="text-white/80 text-xs sm:text-sm leading-relaxed">
              {recommendation.prevention[0]}
            </p>
          </div>
        )}

        {/* Trigger Button: Open Full Report */}
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 border border-green-400/40 text-green-300 hover:text-white font-semibold text-sm flex items-center justify-center gap-2.5 transition-all shadow-[0_0_20px_rgba(74,222,128,0.15)] active:scale-[0.98] cursor-pointer"
        >
          <FileText size={18} className="text-green-400" />
          <span>View Detailed Agronomic Report</span>
          <ArrowRight size={16} className="text-green-400/70" />
        </button>
      </div>

      {/* ──────────────────────────────────────────────────────────────────
          FULL AGRONOMIC REPORT MODAL
      ────────────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md"
            />

            {/* Modal Dialog Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="relative w-full max-w-3xl max-h-[90vh] flex flex-col bg-neutral-950/95 border border-white/15 rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] z-10 overflow-hidden text-left"
            >
              {/* Modal Top Header */}
              <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl border ${
                    isHealthy ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}>
                    {isHealthy ? <CheckCircle2 size={24} /> : <AlertTriangle size={24} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs uppercase font-bold text-white/50 tracking-wider">
                        {crop}
                      </span>
                      {confidence !== null && (
                        <span className="text-xs font-mono text-green-400/90 bg-green-500/10 px-2 py-0.5 rounded-md">
                          {confidence.toFixed(1)}% match
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                      {isHealthy ? 'Healthy Plant Report' : `${disease} — Agronomic Guide`}
                    </h3>
                  </div>
                </div>

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 border border-white/15 text-white/70 hover:text-white flex items-center justify-center transition-all cursor-pointer"
                  aria-label="Close report"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Modal Scrollable Body */}
              <div className="p-6 sm:p-8 overflow-y-auto space-y-6 text-sm text-white/80">
                {/* 1. What It Is & Symptoms */}
                <div>
                  <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                    <Leaf size={15} /> 1. Overview & Diagnosis
                  </h4>
                  <p className="text-white/90 text-sm leading-relaxed mb-3">
                    {recommendation.summary || recommendation.message}
                  </p>

                  {!isHealthy && recommendation.symptoms?.length > 0 && (
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <p className="text-xs font-semibold text-white/70 uppercase tracking-wider mb-2">
                        Observed Symptoms:
                      </p>
                      <ul className="space-y-1.5">
                        {recommendation.symptoms.map((symptom, i) => (
                          <li key={i} className="flex items-start gap-2 text-white/80 text-xs sm:text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 shrink-0" />
                            <span>{symptom}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* 2. Do This Now (Immediate Action) */}
                {!isHealthy && recommendation.immediate_actions?.length > 0 && (
                  <div className="p-5 rounded-2xl bg-red-500/10 border border-red-500/30">
                    <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                      2. Immediate Action Steps
                    </h4>
                    <ol className="space-y-2.5">
                      {recommendation.immediate_actions.map((action, i) => (
                        <li key={i} className="flex items-start gap-3 text-white/90 text-sm leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-red-500/30 text-red-200 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span>{action}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                )}

                {/* 3. Treatment Protocols */}
                {!isHealthy && (
                  <div className="space-y-4">
                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <Beaker size={15} /> 3. Treatment Protocols
                    </h4>

                    {/* Organic & Cultural Controls */}
                    {recommendation.treatment?.organic_cultural?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h5 className="text-xs font-bold text-green-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                          <Leaf size={14} /> Organic & Cultural Management
                        </h5>
                        <ul className="space-y-2">
                          {recommendation.treatment.organic_cultural.map((item, i) => (
                            <li key={i} className="flex items-start gap-2 text-white/80 text-xs sm:text-sm">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-2 shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Chemical Controls */}
                    {recommendation.treatment?.chemical?.length > 0 && (
                      <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                        <h5 className="text-xs font-bold text-blue-400 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                          <Beaker size={14} /> Chemical Options & Dosages
                        </h5>
                        <div className="space-y-3">
                          {recommendation.treatment.chemical.map((chem, i) => (
                            <div key={i} className="p-3.5 rounded-xl bg-black/40 border border-white/10">
                              <div className="flex flex-wrap items-center justify-between gap-1 mb-1.5">
                                <span className="font-bold text-white text-sm">
                                  {chem.active_ingredient}
                                </span>
                                {chem.dosage_verified ? (
                                  <span className="text-[11px] text-green-400 font-semibold px-2 py-0.5 rounded-md bg-green-500/10 border border-green-500/20">
                                    Verified Dosage
                                  </span>
                                ) : (
                                  <span className="text-[11px] text-amber-300 font-medium px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                                    Label Advisory
                                  </span>
                                )}
                              </div>
                              <p className="text-white/80 font-mono text-xs mb-1">
                                Dosage: <span className="text-white/95 font-sans font-medium">{chem.dosage}</span>
                              </p>
                              {chem.note && (
                                <p className="text-white/50 text-xs italic">
                                  Note: {chem.note}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Prevention */}
                {recommendation.prevention?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                      <ShieldCheck size={15} /> 4. Long-Term Prevention Strategy
                    </h4>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <ul className="space-y-2 mb-3">
                        {recommendation.prevention.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-white/80 text-xs sm:text-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                      {recommendation.when_to_seek_help && (
                        <p className="text-white/60 text-xs italic pt-2 border-t border-white/5">
                          <strong>When to seek help:</strong> {recommendation.when_to_seek_help}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* 5. Highlighted Safety Notice */}
                <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/15 border-2 border-amber-400/40 shadow-[0_0_20px_rgba(245,158,11,0.15)]">
                  <div className="flex items-start gap-3">
                    <ShieldCheck size={22} className="text-amber-400 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-xs sm:text-sm font-bold text-amber-300 uppercase tracking-wider mb-1">
                        Important Safety Notice
                      </h5>
                      <p className="text-amber-100 text-xs sm:text-sm font-medium leading-relaxed">
                        {recommendation.safety_notice || 
                          "General guidance only. Follow the product label, wear protective gear, and confirm with your local Krishi Vigyan Kendra or agronomist before spraying."
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* 6. Sources & Review Tag */}
                {recommendation.sources?.length > 0 && (
                  <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs text-white/60">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-white/50">Sources:</span>
                      {recommendation.sources.map((src, i) => (
                        <a
                          key={i}
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-green-400 hover:text-green-300 hover:underline bg-white/5 px-2.5 py-1 rounded-lg border border-white/10"
                        >
                          <span>{src.name}</span>
                          <ExternalLink size={11} />
                        </a>
                      ))}
                    </div>

                    {recommendation.reviewed === false && (
                      <span className="text-[11px] text-amber-400/80 italic">
                        • Awaiting expert review
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Modal Bottom Actions */}
              <div className="p-4 sm:p-5 border-t border-white/10 flex items-center justify-between bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white/80 hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Printer size={15} /> Print / Save
                </button>

                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="py-2.5 px-6 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 hover:brightness-110 active:scale-95 text-black font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(74,222,128,0.3)] cursor-pointer"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
