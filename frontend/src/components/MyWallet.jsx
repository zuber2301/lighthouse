import React, { useState } from 'react';
import { Wallet, Receipt, Copy, ExternalLink, Ticket, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

const MyWallet = ({ userBalance, redemptions = [], transactions = [] }) => {
  const [activeTab, setActiveTab] = useState('vouchers');
  const [copiedId, setCopiedId] = useState(null);

  const handleCopyClaimCode = (claimCode, id) => {
    navigator.clipboard.writeText(claimCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Wallet Header - Real-time Balance View */}
      <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-500/20 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
          <Wallet size={160} />
        </div>
        <div className="relative z-10 space-y-4">
          <p className="text-indigo-100 font-black text-xs uppercase tracking-[0.3em]">Available Balance</p>
          <h2 className="text-6xl font-black text-white tracking-tighter italic">
            {userBalance.toLocaleString()}<span className="text-2xl ml-2 uppercase text-indigo-200">Pts</span>
          </h2>
          <div className="flex gap-4 pt-4">
            <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-xl flex items-center gap-2 border border-white/10">
              <ArrowUpRight size={14} className="text-emerald-400" />
              <span className="text-[10px] font-bold text-white uppercase tracking-tight">+1,200 pts this month</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs: Vouchers vs Transaction History */}
      <div className="flex gap-8 border-b border-slate-800 pb-2">
        <button 
          onClick={() => setActiveTab('vouchers')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'vouchers' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
        >
          My Vouchers
          {activeTab === 'vouchers' && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`pb-4 text-xs font-black uppercase tracking-widest transition-all relative ${activeTab === 'history' ? 'text-white' : 'text-slate-500 hover:text-slate-400'}`}
        >
          Transaction History
          {activeTab === 'history' && <div className="absolute bottom-[-2px] left-0 right-0 h-1 bg-indigo-500 rounded-full" />}
        </button>
      </div>

      {activeTab === 'vouchers' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {redemptions.length > 0 ? (
            redemptions.map((item) => (
              <div key={item.id} className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] p-8 flex items-center gap-6 group hover:border-indigo-500/30 transition-all">
                <div className={`w-20 h-20 rounded-3xl ${item.color} flex items-center justify-center text-white font-black text-2xl shrink-0`}>
                  {item.logo}
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex justify-between items-start gap-4">
                    <h4 className="text-white font-bold text-lg">{item.name}</h4>
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest shrink-0">{item.date}</span>
                  </div>
                  <p className="text-2xl font-black text-indigo-400 tracking-tight">₹{item.value}</p>
                  
                  {/* Claim Code Section */}
                  <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Claim Code</p>
                      <p className="text-white font-mono font-bold tracking-widest uppercase text-sm break-all">{item.claimCode}</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button 
                        onClick={() => handleCopyClaimCode(item.claimCode, item.id)}
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                        title="Copy claim code"
                      >
                        <Copy size={16} />
                      </button>
                      <button 
                        className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all"
                        title="Open brand website"
                      >
                        <ExternalLink size={16} />
                      </button>
                    </div>
                  </div>
                  {copiedId === item.id && (
                    <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-tight mt-2">✓ Copied to clipboard</p>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-16">
              <Ticket className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-slate-400 font-bold text-lg">No vouchers yet</p>
              <p className="text-slate-500 text-sm">Redeem your points to see vouchers here</p>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden">
          {transactions.length > 0 ? (
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 bg-slate-900/30">
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Description</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Type</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest">Date</th>
                  <th className="p-6 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Points</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-800/20 transition-all group">
                    <td className="p-6">
                      <p className="text-white font-bold text-sm">{tx.description}</p>
                      <p className="text-slate-500 text-[10px] uppercase font-bold tracking-tight">Ref: #{tx.id}</p>
                    </td>
                    <td className="p-6">
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${
                        tx.type === 'EARNED' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'
                      }`}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="p-6 text-slate-400 text-xs font-medium">{tx.date}</td>
                    <td className={`p-6 text-right font-black ${
                      tx.type === 'EARNED' ? 'text-emerald-400' : 'text-rose-400'
                    }`}>
                      {tx.type === 'EARNED' ? '+' : '-'}{tx.points}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="text-center py-16">
              <Receipt className="text-slate-600 mx-auto mb-4" size={48} />
              <p className="text-slate-400 font-bold text-lg">No transactions yet</p>
              <p className="text-slate-500 text-sm">Earn and spend points to see them here</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyWallet;
