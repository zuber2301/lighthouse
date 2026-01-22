import React, { useState } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import NominateModal from './NominateModal'
import RecognitionList from './RecognitionList'
import { useRecognitions } from '../../hooks/useRecognitions'
export default function RecognitionPage() {
  const { items = [], isLoading, create } = useRecognitions()
  const [open, setOpen] = useState(false)

  function handleSubmit(payload) {
    create(payload)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader
          title="Recognition"
          subtitle="Nominate peers and view recognitions"
          actions={<button onClick={() => setOpen(true)} className="px-4 py-1.5 rounded-full btn-recognition text-xs font-bold transition-all shadow-lg">Nominate</button>}
        />

        <div className="mt-4">
          <Card>
            <RecognitionList items={items} />
          </Card>
        </div>
      </div>

      <NominateModal open={open} onClose={() => setOpen(false)} onSubmit={handleSubmit} />
    </div>
  )
}
