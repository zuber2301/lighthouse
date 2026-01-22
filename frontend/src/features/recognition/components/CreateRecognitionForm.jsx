import React, { useState } from 'react'
import { useCreateRecognition } from '../hooks'

export default function CreateRecognitionForm() {
  const [nomineeId, setNomineeId] = useState('')
  const [points, setPoints] = useState(10)
  const [message, setMessage] = useState('')

  const mutation = useCreateRecognition()

  const onSubmit = async (e) => {
    e.preventDefault()
    if (!nomineeId) return
    mutation.mutate({ nominee_id: nomineeId, points, message })
    setMessage('')
    setNomineeId('')
  }

  return (
    <form onSubmit={onSubmit} className="p-4 bg-card rounded shadow-sm mb-4">
      <div className="flex gap-3">
        <input
          placeholder="Nominee ID"
          value={nomineeId}
          onChange={(e) => setNomineeId(e.target.value)}
          className="flex-1 p-2 border rounded focus:outline-none focus-visible:ring-3 focus-visible:ring-primary"
        />
        <input
          type="number"
          value={points}
          onChange={(e) => setPoints(Number(e.target.value))}
          className="w-28 p-2 border rounded focus:outline-none focus-visible:ring-3 focus-visible:ring-primary"
        />
        <button type="submit" className="px-4 py-2 btn-success rounded focus:outline-none focus-visible:ring-3 focus-visible:ring-primary">Give</button>
      </div>
      <div className="mt-3">
        <textarea
          placeholder="Optional message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="w-full p-2 border rounded focus:outline-none focus-visible:ring-3 focus-visible:ring-primary"
        />
      </div>
    </form>
  )
}
