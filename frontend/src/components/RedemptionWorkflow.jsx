import React, { useState } from 'react';
import { CheckCircle2, AlertCircle, ArrowRight, Mail, Zap } from 'lucide-react';

const RedemptionWorkflow = ({ reward, userBalance, onClose, onSuccess }) => {
  const [step, setStep] = useState(1); // 1: Select Denom, 2: Confirmation, 3: Success
  const [denom, setDenom] = useState(500);
  
  const denoms = [500, 1000, 2000, 5000];
  const shortFall = Math.max(0, denom - userBalance);

  const handleConfirm = () => {
    // Logic for co-pay or direct redemption
    setStep(3);
    setTimeout(() => {
        onSuccess();
        onClose();
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#0f172a] border border-slate-800 w-full max-w-lg rounded-[3.5rem] overflow-hidden shadow-2xl">
        
        {step === 1 && (
          <div className="p-10 space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Configure Reward</h3>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Select your voucher denomination</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {denoms.map(d => (
                <button
                  key={d}
                  onClick={() => setDenom(d)}
                  className={`p-6 rounded-[2rem] border-2 transition-all ${
                    denom === d ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-800 bg-slate-900/30 hover:border-slate-600'
                  }`}
                >
                  <p className={`font-black text-xl ${denom === d ? 'text-white' : 'text-slate-400'}`}>₹{d.toLocaleString()}</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase mt-1">{d} Points</p>
                </button>
              ))}
            </div>

            {shortFall > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-2xl flex items-start gap-3">
                <AlertCircle className="text-amber-500 shrink-0" size={18} />
                <p className="text-[10px] text-amber-200/80 font-medium leading-relaxed uppercase tracking-tight">
                  You are short of <strong>{shortFall} points</strong>. Use the <strong>"Co-pay"</strong> feature to pay the difference via UPI/Card.
                </p>
              </div>
            )}

            <button 
              onClick={() => setStep(2)}
              className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/20"
            >
              Continue to Confirmation <ArrowRight size={16} />
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="p-10 space-y-8 animate-in slide-in-from-right-4 duration-500 text-center">
            <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto">
                <Zap className="text-indigo-400" size={32} fill="currentColor" />
            </div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Instant Delivery</h3>
              <p className="text-slate-500 font-bold text-[10px] uppercase tracking-widest">Confirmation Summary</p>
            </div>
            
            <div className="bg-slate-900/50 rounded-3xl p-6 border border-slate-800 space-y-3">
               <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] font-black uppercase">Voucher</span>
                  <span className="text-white font-bold">{reward.name} - ₹{denom}</span>
               </div>
               <div className="flex justify-between items-center">
                  <span className="text-slate-500 text-[10px] font-black uppercase">Points Deducted</span>
                  <span className="text-emerald-400 font-bold">-{Math.min(denom, userBalance)} Pts</span>
               </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(1)} className="flex-1 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Back</button>
              <button onClick={handleConfirm} className="flex-[2] py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all">
                Confirm Redemption
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
            <div className="p-16 text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
                    <CheckCircle2 className="text-emerald-400" size={48} />
                </div>
                <div>
                    <h3 className="text-3xl font-black text-white uppercase tracking-tighter italic">Voucher Sent!</h3>
                    <p className="text-slate-400 text-sm font-medium mt-2">Check your email for the claim code.</p>
                </div>
                <div className="flex items-center justify-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                    <Mail size={12} /> Stored in "My Wallet"
                </div>
            </div>
        )}

      </div>
    </div>
  );
};

export default RedemptionWorkflow;
