import React from 'react';
import { Trophy, Medal, Star, Send } from 'lucide-react';

const AwardBadge = ({ category }) => {
  // Config mapping for styles and icons
  const config = {
    GOLD: {
      label: 'Gold',
      icon: Trophy,
      // Custom Lighthouse Gold: Amber to Yellow with a golden glow
      styles: 'bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 text-amber-950 shadow-[0_0_15px_rgba(245,158,11,0.4)]',
      border: 'border-amber-400/50'
    },
    SILVER: {
      label: 'Silver',
      icon: Medal,
      // Metallic Silver: Slate-200 to Slate-400
      styles: 'bg-gradient-to-br from-slate-100 via-slate-300 to-slate-500 text-slate-900 shadow-[0_0_15px_rgba(203,213,225,0.3)]',
      border: 'border-slate-200/50'
    },
    BRONZE: {
      label: 'Bronze',
      icon: Medal,
      // Warm Bronze: Orange-600 to Amber-900
      styles: 'bg-gradient-to-br from-orange-400 via-orange-600 to-amber-900 text-orange-50 shadow-[0_0_15px_rgba(194,65,12,0.3)]',
      border: 'border-orange-500/50'
    },
    ECARD: {
      label: 'E-Card',
      icon: Send,
      // Signature Lighthouse Indigo/Purple
      styles: 'bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]',
      border: 'border-indigo-400/50'
    }
  };

  const badge = config[(category || 'ECARD').toUpperCase()] || config.ECARD;
  const Icon = badge.icon;

  return (
    <div className={`
      relative flex items-center gap-2 px-3 py-1 rounded-full border 
      text-[10px] font-black uppercase tracking-widest transition-transform 
      hover:scale-110 cursor-default group overflow-hidden
      ${badge.styles} ${badge.border}
    `}>
      {/* Animated Sheen Sweep */}
      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full group-hover:animate-sheen" />
      
      <Icon size={12} className="relative z-10" />
      <span className="relative z-10">{badge.label}</span>
    </div>
  );
};

export default AwardBadge;
