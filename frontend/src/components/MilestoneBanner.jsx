import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMilestones } from '../hooks/useMilestones'

const MilestoneBanner = () => {
  const { milestones, loading } = useMilestones()

  if (loading || milestones.length === 0) return null

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className="relative overflow-hidden bg-gradient-to-r from-amber-50 to-orange-50 rounded-[2rem] border border-amber-200 shadow-sm"
      >
        <div className="p-6 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-shrink-0 w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-4xl shadow-sm border border-amber-100 animate-bounce">
            🎉
          </div>
          <div className="flex-1 text-center md:text-left">
            <h3 className="text-lg font-bold text-amber-900 leading-tight">
              {milestones.length === 1 
                ? "Today's Celebration!" 
                : `${milestones.length} Celebrations Today!`}
            </h3>
            <div className="mt-1 flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-1">
              {milestones.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-amber-800 text-sm font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                  <span>
                    {m.type === 'BIRTHDAY' 
                      ? `Happy Birthday, ${m.full_name}! 🎂` 
                      : `Happy ${m.years}y Anniversary, ${m.full_name}! 🎈`}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div className="flex-shrink-0">
            <button className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-all shadow-lg hover:shadow-amber-500/20 active:scale-95">
              Congratulate All
            </button>
          </div>
        </div>
        
        {/* Background confetti patterns */}
        <div className="absolute top-0 right-0 p-4 opacity-10 select-none pointer-events-none text-2xl">
          ✨ 🎊 🎈
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default MilestoneBanner
