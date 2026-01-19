import React, { useEffect, useState } from 'react'
import Card from '../../components/Card'
import api from '../../lib/api'

export default function PlatformCatalog() {
  const [providers, setProviders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProviders()
  }, [])

  const fetchProviders = async () => {
    setLoading(true)
    try {
      const res = await api.get('/platform/catalog')
      setProviders(res.data || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const toggleEnabled = async (p) => {
    try {
      await api.patch(`/platform/catalog/${p.id}`, { enabled: !p.enabled })
      fetchProviders()
    } catch (e) { console.error(e) }
  }

  const updateMargin = async (p, val) => {
    try {
      await api.patch(`/platform/catalog/${p.id}`, { margin_paise: Math.round(Number(val) * 100) })
      fetchProviders()
    } catch (e) { console.error(e) }
  }

  return (
    <div className="space-y-6">
      <Card>
        <h2 className="text-xl font-bold">Global Reward Catalog</h2>
        <p className="text-slate-400">Manage providers, enable/disable globally, and set platform margin.</p>
      </Card>

      <Card>
        {loading ? <div>Loading...</div> : (
          <table className="w-full text-left">
            <thead className="text-slate-400 text-sm">
              <tr>
                <th className="p-3">Provider</th>
                <th className="p-3">Enabled</th>
                <th className="p-3">Min Plan</th>
                <th className="p-3">Platform Margin (₹)</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {providers.map(p => (
                <tr key={p.id} className="border-t border-slate-800">
                  <td className="p-3 font-medium">{p.name}</td>
                  <td className="p-3">
                    <button onClick={() => toggleEnabled(p)} className={`px-3 py-1 rounded ${p.enabled ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'}`}>
                      {p.enabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </td>
                  <td className="p-3 text-slate-400">{p.min_plan || 'All'}</td>
                  <td className="p-3">
                    <input type="number" defaultValue={(p.margin_paise || 0) / 100} step="0.01" min="0" onBlur={(e) => updateMargin(p, e.target.value)} className="w-28 px-2 py-1 bg-slate-800 rounded" />
                  </td>
                  <td className="p-3 text-right text-slate-400">ID: {p.id.slice(0,8)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </div>
  )
}
