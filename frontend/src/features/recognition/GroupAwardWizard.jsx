import React, { useState } from 'react'
import { Users, Sparkles, Send, ArrowRight, X, Search } from 'lucide-react'

export default function GroupAwardWizard({ open = true, onClose = () => {}, onSubmit = async () => {} }) {
  const [step, setStep] = useState(1)
  const [recipients, setRecipients] = useState([
    { id: 1, name: 'Alex Developer', role: 'Engineering' },
    { id: 2, name: 'Sarah Admin', role: 'Operations' }
  ])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6">
      <div className="w-full max-w-4xl bg-[#0f172a] border border-slate-800 rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-500/10">
        <div className="p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Group Excellence Award</h1>
              <p className="text-slate-400 mt-1">Recognizing collective impact across the team.</p>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {[1,2,3].map(s => (
                  <div key={s} className={`h-2.5 w-12 rounded-full ${step >= s ? 'bg-indigo-500 shadow-[0_0_10px_#6366f1]' : 'bg-slate-800'}`} />
                ))}
              </div>
              <button onClick={() => { onClose() }} className="text-slate-400 hover:text-white p-2 rounded-full">
                <X />
              </button>
            </div>
          </div>

          {/* Step content */}
          {step === 1 && (
            <div className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-3 text-white"><Users className="text-indigo-400" /> Select Team Members</h2>

              <div className="relative mb-8">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" />
                <input type="text" placeholder="Search by name, department, or team..." className="w-full pl-14 pr-6 py-5 bg-[#1e293b] border-none rounded-[2rem] text-lg focus:ring-2 focus:ring-indigo-500 outline-none transition-all placeholder:text-slate-600" />
              </div>

              <div className="flex flex-wrap gap-3 mb-10">
                {recipients.map(r => (
                  <div key={r.id} className="flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 px-4 py-2 rounded-full text-indigo-300 text-sm font-bold">
                    {r.name}
                    <button className="hover:text-white" onClick={() => setRecipients(rs => rs.filter(x => x.id !== r.id))}><X size={14} /></button>
                  </div>
                ))}
                <button className="px-4 py-2 rounded-full bg-slate-800 text-slate-400 text-sm font-bold hover:bg-slate-700 transition">+ Add All Engineering</button>
              </div>

              <button onClick={() => setStep(2)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-[2rem] font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-500/20">Set Award Details <ArrowRight /></button>
            </div>
          )}

          {step === 2 && (
            <div className="p-6">
              <div className="grid grid-cols-2 gap-8 mb-10">
                <div className="space-y-4">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Points Per Person</label>
                  <input type="number" defaultValue="500" className="w-full p-6 bg-[#1e293b] rounded-3xl text-3xl font-black text-indigo-400 focus:ring-2 focus:ring-indigo-500 outline-none" />
                </div>
                <div className="bg-indigo-600/10 border border-indigo-500/20 rounded-3xl p-6 flex flex-col justify-center">
                  <p className="text-slate-400 text-xs font-bold uppercase">Total Budget Impact</p>
                  <p className="text-3xl font-black text-white mt-1">₹{recipients.length * 500}</p>
                  <p className="text-[10px] text-indigo-300 mt-1 uppercase font-black tracking-tighter">Available: ₹2,00,000</p>
                </div>
              </div>

              <div className="space-y-4 mb-10">
                <label className="text-xs font-black text-slate-500 uppercase tracking-widest">Select Collective Badge</label>
                <div className="grid grid-cols-3 gap-4">
                  {['Innovation','Team Spirit','Hard Work'].map(b => (
                    <button key={b} className="p-6 rounded-3xl bg-[#1e293b] border-2 border-transparent hover:border-indigo-500 transition-all text-center">
                      <span className="block text-2xl mb-2">🚀</span>
                      <span className="text-sm font-bold">{b}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-4">
                <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-800 rounded-3xl font-bold">Back</button>
                <button onClick={() => setStep(3)} className="flex-[2] py-5 bg-indigo-600 rounded-3xl font-black shadow-lg shadow-indigo-500/20">Write Message</button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="p-6">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <h2 className="text-xl font-bold">The Celebration Message</h2>
                  <p className="text-slate-400 text-sm">Tell the team why they are being recognized.</p>
                </div>
                <button className="flex items-center gap-2 text-indigo-400 font-black text-xs uppercase tracking-widest hover:text-indigo-300"><Sparkles size={16} /> Use AI Coach</button>
              </div>

              <textarea className="w-full h-48 bg-[#1e293b] rounded-[2.5rem] p-8 text-lg focus:ring-2 focus:ring-indigo-500 outline-none border-none resize-none mb-10" placeholder="What did the team achieve together?" />

              <div className="flex gap-3">
                <button onClick={() => setStep(2)} className="flex-1 py-4 bg-slate-800 rounded-[2rem] font-bold">Back</button>
                <button onClick={async () => { await onSubmit({ type: 'group', recipients, award_level: 'Custom', message: 'Team win' }); }} className="flex-[2] py-4 bg-indigo-600 rounded-[2rem] font-black text-xl flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:scale-[1.02] transition-transform"><Send size={20} /> Blast Award to Team</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
