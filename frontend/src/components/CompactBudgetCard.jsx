import React from 'react';

const CompactBudgetCard = ({ master = 0, allocated = 0, spent = 0 }) => {
  const allocatedPercent = master > 0 ? (allocated / master) * 100 : 0;
  const spentPercent = allocated > 0 ? (spent / allocated) * 100 : 0;

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-tighter">Budget Utilization</h3>
        <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full font-bold">Q1 2026</span>
      </div>

      <div className="space-y-6">
        {/* Master Pool to Allocation */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Distribution to Leads</span>
            <span className="text-sm font-bold text-slate-900">₹{allocated.toLocaleString()} / ₹{master.toLocaleString()}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(allocatedPercent, 100)}%` }} 
            />
          </div>
        </div>

        {/* Allocation to Actual Spending */}
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Employee Recognition Spending</span>
            <span className="text-sm font-bold text-emerald-600">₹{spent.toLocaleString()} spent</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
              style={{ width: `${Math.min(spentPercent, 100)}%` }} 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompactBudgetCard;
