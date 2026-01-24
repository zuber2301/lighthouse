import React from 'react';
import { Cake, PartyPopper, Award, Send, ChevronRight } from 'lucide-react';

const CelebrationWidget = ({ celebrations = [] }) => {
  // Empty State
  if (celebrations.length === 0) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
          <PartyPopper className="text-slate-300" size={32} />
        </div>
        <p className="text-slate-500 font-bold">No milestones today</p>
        <p className="text-xs text-slate-400 mt-1">Check back tomorrow for more celebrations!</p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <PartyPopper size={16} className="text-indigo-500" />
          Today's Milestones
        </h3>
        <span className="bg-indigo-50 text-indigo-600 text-[10px] font-black px-2 py-1 rounded-md">
          {celebrations.length} EVENTS
        </span>
      </div>

      <div className="divide-y divide-slate-50 dark:divide-slate-800">
        {celebrations.map((person, idx) => (
          <div key={idx} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Avatar with Celebration Badge */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-md bg-slate-200 flex items-center justify-center font-bold text-slate-500 overflow-hidden">
                    {person.imageUrl ? (
                      <img src={person.imageUrl} alt={person.full_name} className="w-full h-full object-cover" />
                    ) : (
                      person.full_name?.charAt(0) || '?'
                    )}
                  </div>
                  <div className={`absolute -right-2 -bottom-2 w-6 h-6 rounded-full border-2 border-white dark:border-slate-900 flex items-center justify-center ${
                    person.type === 'BIRTHDAY' ? 'bg-amber-400' : 'bg-indigo-500'
                  }`}>
                    {person.type === 'BIRTHDAY' ? (
                      <Cake size={12} className="text-white" />
                    ) : (
                      <Award size={12} className="text-white" />
                    )}
                  </div>
                </div>

                <div>
                  <p className="font-bold text-slate-800 dark:text-slate-100">{person.full_name}</p>
                  <p className="text-xs text-slate-500 font-medium">
                    {person.type === 'BIRTHDAY' 
                      ? 'Celebrating a Birthday!' 
                      : `${person.years} Year Anniversary`}
                  </p>
                </div>
              </div>

              {/* Action Button: Prefills the recognition flow */}
              <button 
                onClick={() => {
                  window.location.href = `/recognition?userId=${person.user_id || person.id}&note=Happy ${person.type === 'BIRTHDAY' ? 'Birthday' : `${person.years}y Anniversary`}!`;
                }}
                className="p-3 bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-indigo-600 group-hover:text-white rounded-md transition-all shadow-sm"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        ))}
      </div>

      <button className="w-full py-4 text-xs font-bold text-slate-400 hover:text-indigo-600 transition flex items-center justify-center gap-2 bg-slate-50/30 dark:bg-slate-800/20 uppercase tracking-tighter">
        View Celebration Calendar <ChevronRight size={14} />
      </button>
    </div>
  );
};

export default CelebrationWidget;
