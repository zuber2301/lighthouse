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
          <Link to="/admin/budgets" className="block">
            <Card className="hover:bg-slate-700 transition-colors cursor-pointer">
              <h3 className="text-lg font-semibold mb-2">Budgets</h3>
              <p className="text-slate-400">Manage budget pools and department allocations</p>
            </Card>
          </Link>
          <Card>
            <h3 className="text-lg font-semibold mb-2">Department Leads</h3>
            <p className="text-slate-400">Assign and manage department leads</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-2">Users & Roles</h3>
            <p className="text-slate-400">Manage user roles and permissions</p>
          </Card>
          <Card>
            <h3 className="text-lg font-semibold mb-2">Branding</h3>
            <p className="text-slate-400">Customize platform branding</p>
          </Card>
        </div>
      </div>
    </div>
  )
}
