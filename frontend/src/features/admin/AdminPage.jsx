import React from 'react'
import { Link } from 'react-router-dom'
import Card from '../../components/Card'
import PageHeader from '../../components/PageHeader'

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-br from-tm-bg-dark to-surface p-6 rounded-xl">
        <PageHeader title="Admin" subtitle="Tenant configuration and management" />

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Link to="/platform-admin" className="block">
            <Card className="hover:bg-surface transition-colors cursor-pointer border-indigo-500/20 bg-gradient-to-br from-indigo-900/20 to-slate-800">
              <h3 className="text-lg font-semibold mb-2 text-indigo-400">Platform Owner</h3>
              <p className="opacity-70 text-text-main">Global SaaS control plane - manage all tenants</p>
            </Card>
          </Link>
          <Link to="/tenant-admin" className="block">
            <Card className="hover:bg-surface transition-colors cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Budgets</h3>
              <p className="opacity-70 text-text-main">Manage budget pools and department allocations</p>
            </Card>
          </Link>
          <Card>
            <h3 className="text-lg font-semibold mb-2">Department Leads</h3>
            <p className="opacity-70 text-text-main">Assign and manage department leads</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-2">Users & Roles</h3>
            <p className="opacity-70 text-text-main">Manage user roles and permissions</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-2">Branding</h3>
            <p className="opacity-70 text-text-main">Customize platform branding</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
