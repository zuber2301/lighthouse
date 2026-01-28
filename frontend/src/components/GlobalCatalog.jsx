import React, { useState } from 'react';
import { ShoppingBag, Search, Wallet, ChevronRight, Zap } from 'lucide-react';

const GlobalCatalog = ({ userBalance, onRedeem }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  
  const categories = ['All', 'Electronics', 'Fashion', 'Travel', 'Dining', 'Retail'];
  
  const rewards = [
    { id: 1, name: 'Amazon Pay', brand: 'Amazon', minPoints: 500, category: 'Retail', color: 'bg-[#232f3e]', logo: 'a' },
    { id: 2, name: 'Flipkart Gift', brand: 'Flipkart', minPoints: 500, category: 'Retail', color: 'bg-[#2874f0]', logo: 'Flipkart' },
    { id: 3, name: 'Myntra Voucher', brand: 'Myntra', minPoints: 250, category: 'Fashion', color: 'bg-[#ff3f6c]', logo: 'M' },
    { id: 4, name: 'Zomato Credits', brand: 'Zomato', minPoints: 100, category: 'Dining', color: 'bg-[#cb202d]', logo: 'Z' },
    { id: 5, name: 'Starbucks Card', brand: 'Starbucks', minPoints: 200, category: 'Dining', color: 'bg-[#00704a]', logo: 'S' },
    { id: 6, name: 'Croma Gift', brand: 'Croma', minPoints: 500, category: 'Electronics', color: 'bg-[#00e5d1]', logo: 'C' },
  ];

  const filteredRewards = activeCategory === 'All' 
    ? rewards 
    : rewards.filter(r => r.category === activeCategory);

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-700">
      {/* Header & Balance Section */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-6 bg-[#0f172a] border border-slate-800 p-8 rounded-[3rem]">
        <div>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Rewards Store</h2>
          <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">
            Redeem points for global brand vouchers [cite: 236]
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-4 rounded-3xl flex items-center gap-4">
          <Wallet className="text-emerald-400" size={24} />
          <div>
            <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">My Balance</p>
            <p className="text-2xl font-black text-white">{userBalance.toLocaleString()} Pts</p>
          </div>
        </div>
      </div>

      {/* Categories & Search */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2 bg-slate-900/50 p-2 rounded-2xl border border-slate-800">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-xl text-xs font-black uppercase transition-all ${
                activeCategory === cat ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search brands or categories..." 
            className="w-full bg-[#0f172a] border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:border-indigo-500 outline-none transition-all"
          />
        </div>
      </div>

      {/* Rewards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredRewards.map(reward => (
          <div key={reward.id} className="group bg-[#0f172a] border border-slate-800 rounded-[2.5rem] overflow-hidden hover:border-indigo-500/50 transition-all duration-300">
            <div className={`h-32 ${reward.color} flex items-center justify-center relative`}>
               <span className="text-4xl font-black text-white/90 uppercase">{reward.logo}</span>
               <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full">
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest">{reward.category}</span>
               </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-white font-bold text-lg">{reward.name}</h4>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-tight">From {reward.minPoints} pts</p>
              </div>
              <button 
                onClick={() => onRedeem(reward)}
                className="w-full py-4 bg-slate-800 hover:bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group-hover:shadow-lg group-hover:shadow-indigo-500/20"
              >
                Redeem Now <ChevronRight size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default GlobalCatalog;
