import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';

const RedemptionModal = ({ isOpen, onClose, reward, currentBalance, onConfirm }) => {
  const [status, setStatus] = useState('idle'); // 'idle', 'processing', 'success'
  
  if (!isOpen || !reward) return null;

  const rewardPoints = reward.points_cost || reward.points || 0;
  const remainingBalance = currentBalance - rewardPoints;
  const isAffordable = currentBalance >= rewardPoints;

  const handleConfirm = async () => {
    setStatus('processing');
    
    try {
      await onConfirm(reward.id);
      setStatus('success');
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch (error) {
      console.error('Redemption failed:', error);
      setStatus('idle');
      alert('Redemption failed. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card dark:bg-card w-full max-w-md rounded-3xl overflow-hidden shadow-sm-2xl border dark:border-border-soft"
      >
        {status !== 'success' ? (
          <div className="p-8">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Confirm Redemption</h2>
            <p className="text-slate-500 text-sm mb-6">You are about to redeem your hard-earned points for this reward.</p>

            {/* Reward Summary Card */}
            <div className="flex items-center gap-4 bg-slate-50 dark:bg-card/50 p-4 rounded-2xl mb-6">
              <div className="h-16 w-16 bg-card dark:bg-card rounded-xl flex items-center justify-center text-3xl shadow-sm-sm">
                {reward.icon || '🎁'}
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-slate-200">{reward.title}</h4>
                <p className="text-indigo-600 font-semibold">{rewardPoints} Points</p>
              </div>
            </div>

            {/* Point Calculation Ledger */}
            <div className="space-y-3 border-t dark:border-border-soft pt-6 mb-8 text-sm">
              <div className="flex justify-between text-slate-500">
                <span>Current Balance</span>
                <span>{currentBalance} pts</span>
              </div>
              <div className="flex justify-between text-rose-500">
                <span>Reward Cost</span>
                <span>- {rewardPoints} pts</span>
              </div>
              <div className="flex justify-between font-bold text-lg text-slate-800 dark:text-white pt-2 border-t border-dashed dark:border-border-soft">
                <span>Remaining Balance</span>
                <span className={remainingBalance < 0 ? 'text-rose-500' : 'text-emerald-500'}>
                  {remainingBalance} pts
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button 
                onClick={onClose}
                className="flex-1 py-3 font-semibold text-slate-500 hover:bg-slate-100 dark:hover:bg-card rounded-xl transition"
              >
                Cancel
              </button>
              <button 
                disabled={!isAffordable || status === 'processing'}
                onClick={handleConfirm}
                className={`flex-1 py-3 rounded-xl font-bold text-white transition shadow-sm-lg 
                  ${isAffordable && status !== 'processing' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-sm-indigo-200' : 'bg-slate-300 cursor-not-allowed'}
                `}
              >
                {status === 'processing' ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        ) : (
          /* Success State */
          <div className="p-10 text-center space-y-4">
             <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto mb-4">
               ✓
             </div>
             <h2 className="text-3xl font-black text-slate-800 dark:text-white">Awesome Choice!</h2>
             <p className="text-slate-500">Your redemption was successful. Check your email for the voucher code!</p>
             <button 
              onClick={() => {
                onClose();
              }}
              className="w-full mt-6 py-3 bg-card text-white rounded-xl font-bold hover:bg-slate-950 transition"
             >
               Back to Store
             </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RedemptionModal;
