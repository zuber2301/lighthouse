import React from 'react'

const SubscriptionEngine = () => {
  const plans = [
    { name: 'Triton Industries', plan: 'Enterprise', status: 'Active', renewal: 'Jan 2026' },
    { name: 'Acme Corp', plan: 'Pro', status: 'Past Due', renewal: 'Dec 2025' },
  ]

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-8">Subscription Engine</h1>
      <div className="bg-card border border-indigo-500/10 dark:bg-card border border-indigo-500/10 rounded-lg border dark:border-border-soft overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface dark:bg-card border border-indigo-500/10/50">
            <tr className="text-text-main/60 text-sm">
              <th className="p-4">Tenant</th>
              <th className="p-4">Plan</th>
              <th className="p-4">Status</th>
              <th className="p-4">Next Renewal</th>
            </tr>
          </thead>
          <tbody>
            {plans.map(p => (
              <tr key={p.name} className="border-t dark:border-border-soft">
                <td className="p-4 font-bold">{p.name}</td>
                <td className="p-4"><span className="bg-indigo-100 text-indigo-700 px-2 py-1 rounded text-xs font-bold uppercase">{p.plan}</span></td>
                <td className="p-4">
                   <span className={p.status === 'Active' ? 'text-teal-500' : 'text-rose-500'}>● {p.status}</span>
                </td>
                <td className="p-4 text-text-main/60">{p.renewal}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default SubscriptionEngine
