import React, { useState } from 'react'
import { useCreateRecognition } from '../hooks'

const awardCategories = [
  { id: 'GOLD', name: 'Gold (500 pts)', color: 'border-yellow-500 text-yellow-500' },
  { id: 'SILVER', name: 'Silver (250 pts)', color: 'border-gray-400 text-gray-500' },
  { id: 'BRONZE', name: 'Bronze (100 pts)', color: 'border-orange-500 text-orange-600' },
  { id: 'ECARD', name: 'E-Card (0 pts)', color: 'border-slate-400 text-slate-500' },
]

export default function CreateRecognitionForm() {
  const [nomineeId, setNomineeId] = useState('')
  const [category, setCategory] = useState('ECARD')
  const [message, setMessage] = useState('')

  const mutation = useCreateRecognition()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!nomineeId) return
    mutation.mutate({ 
      nominee_id: nomineeId, 
      award_category: category, 
      message 
    })
    setMessage('')
    setNomineeId('')
    setCategory('ECARD')
  }

  return (
    <form onSubmit={onSubmit} className="p-6 bg-card border border-indigo-500/10 rounded-xl shadow-tm-neon mb-6">
      <h3 className="text-sm font-bold uppercase tracking-wider text-tm-indigo mb-4">Send a Recognition</h3>
      <div className="flex flex-col gap-4">
        <div className="flex gap-3">
          <input
            placeholder="Recipient ID (e.g. user-uuid)"
            value={nomineeId}
            onChange={(e) => setNomineeId(e.target.value)}
            className="flex-1 p-2.5 bg-surface border border-indigo-500/10 rounded text-sm focus:outline-none focus:border-tm-indigo transition-colors"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {awardCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setCategory(cat.id)}
              className={`px-3 py-2 text-xs font-bold border-2 rounded transition-all ${
                category === cat.id 
                  ? `${cat.color} bg-white dark:bg-slate-800 scale-105 shadow-sm` 
                  : 'border-transparent bg-surface opacity-60 hover:opacity-100'
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>

        <div>
          <textarea
            placeholder="Tell us what they achieved..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="w-full p-2.5 bg-surface border border-indigo-500/10 rounded text-sm focus:outline-none focus:border-tm-indigo transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <button 
            type="submit" 
            disabled={mutation.isLoading || !nomineeId || !message}
            className="px-6 py-2 bg-tm-indigo text-white font-bold rounded-lg hover:scale-105 transition-transform disabled:opacity-50 disabled:scale-100"
          >
            {mutation.isLoading ? 'Sending...' : 'Send Recognition'}
          </button>
        </div>
      </div>
    </form>
  )
}
