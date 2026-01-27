/**
 * Step 1: Budget Loading
 * Admin defines the Event Wallet
 */

import React from 'react';

export default function BudgetStep({ data = {}, onChange }) {
  const handleChange = (e) => {
    const { name, value } = e.target;
    onChange({
      ...data,
      [name]: name === 'event_budget_amount' ? parseFloat(value) : value
    });
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h3 className="font-bold text-blue-900 mb-2">💰 Event Budget Loading</h3>
        <p className="text-sm text-blue-800">
          Define the budget for this event. This is separate from your Recognition Master Budget
          and represents the total funds available for this specific event.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Event Budget Amount <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <span className="absolute left-3 top-3 text-gray-500 text-lg">₹</span>
          <input
            type="number"
            name="event_budget_amount"
            min="0"
            step="100"
            value={data.event_budget_amount || ''}
            onChange={handleChange}
            placeholder="Enter budget amount"
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Total budget available for this event
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cost Type
        </label>
        <select
          name="cost_type"
          value={data.cost_type || 'CURRENCY'}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="CURRENCY">Currency (Rupees)</option>
          <option value="POINTS">Points</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Budget Description (Optional)
        </label>
        <textarea
          name="budget_description"
          value={data.budget_description || ''}
          onChange={handleChange}
          placeholder="What is this budget for? (e.g., 'Annual Day celebrations for all employees')"
          rows="3"
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Budget Summary */}
      {data.event_budget_amount && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-bold text-green-900 mb-2">Budget Summary</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Budget</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{parseFloat(data.event_budget_amount).toLocaleString()}
              </p>
            </div>
            <div>
              <p className="text-gray-600">Status</p>
              <p className="text-lg font-bold text-green-700">Ready to Load</p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <p className="text-sm text-gray-700">
          <strong>Note:</strong> This budget is separate from your department and individual budgets.
          It represents the total funds allocated for this specific event only.
        </p>
      </div>
    </div>
  );
}
