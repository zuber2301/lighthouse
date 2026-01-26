import React, { useState, useEffect } from 'react'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'
import NominateModal from './NominateModal'
import RecognitionList from './RecognitionList'
import { useRecognitions } from '../../hooks/useRecognitions'
import { useAuth } from '../../lib/AuthContext'
import { useSearchParams } from 'react-router-dom'
import CelebrationWidget from '../../components/CelebrationWidget'
import { useMilestones } from '../../hooks/useMilestones'

export default function RecognitionPage() {
  const { user } = useAuth()
  const { items = [], isLoading, createAsync } = useRecognitions()
  const { milestones } = useMilestones()
  const [open, setOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  const [searchParams] = useSearchParams()

  const allowedRoles = ['PLATFORM_OWNER', 'TENANT_ADMIN', 'TENANT_LEAD', 'CORPORATE_USER']
  const isAllowedPersona = allowedRoles.includes(user?.role)

  const filteredItems = (items || []).filter(it => {
    if (activeTab === 'All') return true
    const tag = it.badge_name || it.value_tag || it.tag
    return tag === activeTab
  })

  // If a tab is provided via query params (e.g. ?tab=E-Card), use it and open modal
  useEffect(() => {
    const tab = searchParams.get('tab')
    const userId = searchParams.get('userId')
    if (tab || userId) {
      if (tab) setActiveTab(tab === 'ecard' ? 'E-Card' : tab)
      if (isAllowedPersona) setOpen(true)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams])

  function handleSubmit(payload) {
    return createAsync(payload)
  }

  const tabs = ['All', 'Individual Award', 'Group Award', 'E-Card']

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader
          title="Recognition"
          subtitle="Nominate peers and view recognitions"
          actions={
            isAllowedPersona && activeTab !== 'All' && (
              <button 
                onClick={() => setOpen(true)} 
                className={`px-6 py-2 rounded-full btn-recognition text-sm font-bold transition-all shadow-lg active:scale-95 ${activeTab === 'Individual Award' ? 'text-white' : ''}`}
              >
                Give {activeTab}
              </button>
            )
          }
        />

        <div className="flex space-x-4 mb-6 mt-4 border-b border-white/10 pb-2">
          {tabs.map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`pb-2 px-1 text-sm font-medium transition-colors relative ${
                activeTab === t ? 'text-tm-accent-light' : 'text-text-main/50 hover:text-text-main'
              }`}
            >
              {t}
              {activeTab === t && (
                <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-tm-accent-light" />
              )}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-4">
          <div className="lg:col-span-3">
            <Card>
              <RecognitionList items={filteredItems} />
            </Card>
          </div>
          
          <div className="space-y-6">
            <CelebrationWidget celebrations={milestones} />
          </div>
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
