import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import NominateModal from './NominateModal'
import RecognitionList from './RecognitionList'
import { useRecognitions } from '../../hooks/useRecognitions'
import { useAuth } from '../../lib/AuthContext'
import { useSearchParams } from 'react-router-dom'

export default function RecognitionPage() {
  const { user } = useAuth()
  const { items = [], isLoading, createAsync } = useRecognitions()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('Individual Award')
  const [searchParams] = useSearchParams()

  const allowedRoles = ['PLATFORM_OWNER', 'TENANT_ADMIN', 'TENANT_LEAD', 'CORPORATE_USER']
  const isAllowedPersona = allowedRoles.includes(user?.role)

  const filteredItems = items.filter(it => 
    !activeTab || it.value_tag === activeTab || it.tag === activeTab
  )

  // If a tab is provided via query params (e.g. ?tab=E-Card), use it and open modal
  useEffect(() => {
    const tab = searchParams.get('tab')
    if (tab) {
      setActiveTab(tab)
      if (isAllowedPersona) setOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function handleSubmit(payload) {
    return createAsync(payload)
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader
          title="Recognition"
          subtitle="Nominate peers and view recognitions"
          actions={
            isAllowedPersona && (
              <button 
                onClick={() => setOpen(true)} 
                className="px-6 py-2 rounded-full btn-recognition text-sm font-bold transition-all shadow-lg active:scale-95"
              >
                Give {activeTab}
              </button>
            )
          }
        />

        {/* Tabs are now available in the main header; removed duplicate in-page tabs */}

        <div className="mt-4">
          <Card>
            <RecognitionList items={filteredItems} />
          </Card>
        </div>
      </div>

      <NominateModal 
        open={open} 
        onClose={() => setOpen(false)} 
        onSubmit={handleSubmit} 
        initialCategory={activeTab}
      />
    </div>
  )
}
