import React, { useEffect, useState } from 'react'
import api from '../api/axiosClient'
import Card from './Card'

export default function BudgetLoadLogs({ tenantId }) {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [limit, setLimit] = useState(10)
  const [page, setPage] = useState(0)
  const [total, setTotal] = useState(0)
  const [selectedLog, setSelectedLog] = useState(null)
  const [transactionType, setTransactionType] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      try {
        const params = { limit, offset: page * limit }
        if (transactionType) params.transaction_type = transactionType
        if (startDate) params.start_date = startDate
        if (endDate) params.end_date = endDate
        const cfg = { params }
        if (tenantId) cfg.headers = { 'X-Tenant-ID': tenantId }
        const resp = await api.get('/tenant/budget/logs', cfg)
        if (mounted) {
          const payload = resp.data || { items: [], total: 0 }
          setLogs(payload.items || [])
          setTotal(payload.total || 0)
        }
      } catch (e) {
        console.error('failed to fetch budget logs', e)
        if (mounted) setLogs([])
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [tenantId, limit, page, transactionType, startDate, endDate])

  if (loading) return <Card><div className="p-4">Loading logs...</div></Card>

  return (
    <Card>
      <h3 className="font-bold text-lg mb-3">Budget Activity</h3>

      <div className="flex gap-2 items-center mb-3">
        <label className="text-sm">Type:</label>
        <input className="px-2 py-1 border rounded" placeholder="transaction type" value={transactionType} onChange={(e)=>setTransactionType(e.target.value)} />
        <label className="text-sm">From:</label>
        <input type="date" className="px-2 py-1 border rounded" value={startDate} onChange={(e)=>setStartDate(e.target.value)} />
        <label className="text-sm">To:</label>
        <input type="date" className="px-2 py-1 border rounded" value={endDate} onChange={(e)=>setEndDate(e.target.value)} />
        <label className="text-sm">Per page:</label>
        <select className="px-2 py-1 border rounded" value={limit} onChange={(e)=>{ setLimit(Number(e.target.value)); setPage(0); }}>
          <option value={10}>10</option>
          <option value={25}>25</option>
          <option value={50}>50</option>
          <option value={100}>100</option>
        </select>
      </div>

      {logs.length === 0 ? (
        <p className="text-slate-400">No recent budget activity.</p>
      ) : (
        <ul className="space-y-3">
          {logs.map(l => (
            <li key={l.id} className="flex justify-between items-start hover:bg-slate-50 p-3 rounded cursor-pointer" onClick={() => setSelectedLog(l)}>
              <div>
                <div className="text-sm text-slate-600">{l.created_at ? new Date(l.created_at).toLocaleString() : ''}</div>
                <div className="font-medium">{l.transaction_type}</div>
                <div className="text-sm text-slate-500">By: {l.platform_owner?.full_name || l.platform_owner?.email || 'system'}</div>
              </div>
              <div className="font-bold">₹{(l.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between items-center mt-4">
        <div className="text-sm text-slate-500">Page {page+1} of {Math.max(1, Math.ceil(total / limit))} — {total} total</div>
        <div className="flex gap-2">
          <button disabled={page<=0} onClick={()=>setPage(p=>Math.max(0,p-1))} className="px-3 py-1 rounded bg-slate-200">Prev</button>
          <button disabled={(page+1) >= Math.ceil(total/limit)} onClick={()=>setPage(p=>p+1)} className="px-3 py-1 rounded bg-slate-200">Next</button>
        </div>
      </div>

      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <h3 className="text-xl font-bold mb-2">Budget Log Detail</h3>
            <div className="text-sm text-slate-600 mb-2">{selectedLog.created_at ? new Date(selectedLog.created_at).toLocaleString() : ''}</div>
            <div className="mb-2"><strong>Type:</strong> {selectedLog.transaction_type}</div>
            <div className="mb-2"><strong>Amount:</strong> ₹{(selectedLog.amount||0).toLocaleString(undefined,{minimumFractionDigits:2})}</div>
            <div className="mb-2"><strong>By:</strong> {selectedLog.platform_owner?.full_name || selectedLog.platform_owner?.email || 'system'}</div>
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setSelectedLog(null)} className="px-4 py-2 rounded bg-slate-200">Close</button>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}
