import { Link } from 'react-router-dom';
import { 
  Zap, ArrowRight, Sprout, TrendingUp, Cloud, 
  AlertTriangle, Landmark, Users 
} from 'lucide-react';

export default function QuickActions() {
  const actions = [
    {
      title: 'Crop Recommendation',
      to: '/crop-rec',
      icon: Sprout,
      iconBg: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      cardBg: 'bg-[#0f2316]/70 hover:bg-[#153421] border-emerald-500/20'
    },
    {
      title: 'Market Prices',
      to: '/market-prices',
      icon: TrendingUp,
      iconBg: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      cardBg: 'bg-[#241d0f]/70 hover:bg-[#382b13] border-amber-500/20'
    },
    {
      title: 'Weather Forecast',
      to: '/weather',
      icon: Cloud,
      iconBg: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      cardBg: 'bg-[#0e1d2c]/70 hover:bg-[#152e47] border-blue-500/20'
    },
    {
      title: 'Pest Prediction',
      to: '/pest-predict',
      icon: AlertTriangle,
      iconBg: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      cardBg: 'bg-[#291116]/70 hover:bg-[#3d1820] border-rose-500/20'
    },
    {
      title: 'Govt Schemes',
      to: '/schemes',
      icon: Landmark,
      iconBg: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
      cardBg: 'bg-[#210f2b]/70 hover:bg-[#351645] border-purple-500/20'
    },
    {
      title: 'Community',
      to: '/community',
      icon: Users,
      iconBg: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      cardBg: 'bg-[#0d2424]/70 hover:bg-[#143939] border-cyan-500/20'
    }
  ];

  return (
    <div className="bg-[#0c1b12]/85 backdrop-blur-xl border border-white/10 rounded-3xl p-4 sm:p-5 lg:p-5 xl:p-6 shadow-[0_12px_40px_rgba(0,0,0,0.6)] flex flex-col justify-between text-left h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-3.5">
        <h3 className="text-base sm:text-lg lg:text-xl font-bold text-white flex items-center gap-2">
          <Zap size={18} className="text-amber-400 fill-amber-400 shrink-0" />
          <span>Quick Actions</span>
        </h3>

        <Link
          to="/crop-rec"
          className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors group cursor-pointer"
        >
          <span>View All</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>

      {/* 2x3 Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-2.5">
        {actions.map((act) => {
          const Icon = act.icon;
          return (
            <Link
              key={act.title}
              to={act.to}
              className={`p-2.5 sm:p-3 rounded-2xl border transition-all duration-200 flex items-center gap-2 sm:gap-2.5 group shadow-md active:scale-97 cursor-pointer overflow-hidden ${act.cardBg}`}
            >
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform ${act.iconBg}`}>
                <Icon size={17} />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <span className="text-[11px] sm:text-xs xl:text-[12px] font-bold text-white/90 group-hover:text-white leading-[1.2] block break-words tracking-tight">
                  {act.title}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
