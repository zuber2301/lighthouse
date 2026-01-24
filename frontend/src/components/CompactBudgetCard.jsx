import React from 'react';

const CompactBudgetCard = ({ master = 0, allocated = 0, spent = 0 }) => {
  const allocatedPercent = master > 0 ? (allocated / master) * 100 : 0;
  const spentPercent = allocated > 0 ? (spent / allocated) * 100 : 0;

  return (
    <div className="bg-card border border-indigo-500/5 rounded-lg p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold opacity-60 text-text-main uppercase tracking-tighter">Budget Utilization</h3>
        <span className="text-xs bg-indigo-500/10 text-indigo-500 px-3 py-1 rounded-full font-bold">Q1 2026</span>
      </div>

      <div className="space-y-6">
        {/* Master Pool to Allocation */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-normal opacity-70 text-text-main">Distribution to Leads</span>
            <span className="text-sm font-bold text-text-main">₹{allocated.toLocaleString()} / ₹{master.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full bg-indigo-500/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" 
              style={{ width: `${Math.min(allocatedPercent, 100)}%` }} 
            />
          </div>
        </div>

        {/* Allocation to Actual Spending */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-normal opacity-70 text-text-main">Employee Recognition Spending</span>
            <span className="text-sm font-bold text-teal-500">₹{spent.toLocaleString()} spent</span>
          </div>
          <div className="h-2 w-full bg-indigo-500/10 rounded-full overflow-hidden">
            <div 
              className="h-full bg-teal-500 rounded-full transition-all duration-500 shadow-[0_0_10px_rgba(20,184,166,0.4)]" 
              style={{ width: `${Math.min(spentPercent, 100)}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactBudgetCard;
