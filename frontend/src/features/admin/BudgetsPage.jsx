import React, { useState } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import Modal from '../../components/Modal'

export default function BudgetsPage() {
  const [showAllocate, setShowAllocate] = useState(false)
  const [allocations, setAllocations] = useState({
    eng: 300000,
    sales: 200000,
    marketing: 150000,
    hr: 100000,
  })

  const total = 1000000
  const allocated = Object.values(allocations).reduce((a, b) => a + b, 0)
  const remaining = total - allocated

  const handleAllocate = () => {
    // TODO: API call
    setShowAllocate(false)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Budgets" subtitle="Manage budget pools and allocations" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <h3 className="text-lg font-semibold mb-2">Total Budget (FY 2026)</h3>
          <p className="text-2xl font-bold">₹{total.toLocaleString()}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-2">Allocated</h3>
          <p className="text-2xl font-bold">₹{allocated.toLocaleString()}</p>
        </Card>
        <Card>
          <h3 className="text-lg font-semibold mb-2">Unallocated</h3>
          <p className="text-2xl font-bold">₹{remaining.toLocaleString()}</p>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-semibold mb-4">Department Allocations</h3>
        <div className="space-y-2">
          {Object.entries(allocations).map(([dept, amount]) => (
            <div key={dept} className="flex justify-between">
              <span className="capitalize">{dept}</span>
              <span>₹{amount.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="flex justify-end">
        <button
          onClick={() => setShowAllocate(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500"
        >
          Allocate Budget
        </button>
      </div>

      <Modal isOpen={showAllocate} onClose={() => setShowAllocate(false)} title="Allocate Budget">
        <div className="space-y-4">
          <div className="text-lg font-semibold">Total Available Budget: ₹{total.toLocaleString()}</div>
          <div className="space-y-2">
            {Object.entries(allocations).map(([dept, amount]) => (
              <div key={dept} className="flex items-center gap-4">
                <label className="w-24 capitalize">{dept}:</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAllocations(prev => ({ ...prev, [dept]: parseInt(e.target.value) || 0 }))}
                  className="flex-1 px-3 py-2 bg-card border border-border-soft rounded-md"
                />
              </div>
            ))}
          </div>
          <div className="text-right">Remaining: ₹{remaining.toLocaleString()}</div>
          <div className="flex justify-end gap-4">
            <button
              onClick={() => setShowAllocate(false)}
              className="px-4 py-2 bg-surface text-white rounded-md hover:bg-slate-500"
            >
              Cancel
            </button>
            <button
              onClick={handleAllocate}
              disabled={remaining !== 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 disabled:opacity-50"
            >
              Save Allocation
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}