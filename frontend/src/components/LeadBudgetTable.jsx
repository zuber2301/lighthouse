import React from 'react'

const formatCurrency = (paise) => {
  if (paise == null) return '—'
  const rupees = paise / 100
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(rupees)
}

export default function LeadBudgetTable({ budget, loading }) {
  if (loading) {
    return <div className="text-sm text-text-muted">Loading lead budgets…</div>
  }

  if (!budget) {
    return <div className="text-sm text-text-muted">Budget data not available yet.</div>
  }

  return (
    <table className="w-full text-left text-sm text-text-main">
      <thead>
        <tr>
          <th className="pb-2 font-semibold">Lead</th>
          <th className="pb-2 font-semibold">Budget</th>
        </tr>
      </thead>
      <tbody>
        <tr className="border-b border-border-soft"> 
          <td className="py-2 text-xs text-text-muted">Tenant master balance</td>
          <td className="py-2 font-semibold">{formatCurrency(budget.master_balance_paise)}</td>
        </tr>
        {budget.leads?.map((lead) => (
          <tr key={lead.id} className="border-b border-border-soft even:bg-surface-muted">
            <td className="py-2">{lead.name || '—'}</td>
            <td className="py-2 font-semibold">{formatCurrency(lead.amount_paise)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
