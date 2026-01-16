import api from '../../lib/api'

export async function createBudgetPool(period, totalAmount) {
  const res = await api.post('/admin/budgets', { period, total_amount: totalAmount })
  return res.data
}

export async function allocateBudget(budgetId, allocations) {
  const res = await api.post(`/admin/budgets/${budgetId}/allocate`, { allocations })
  return res.data
}

export async function getBudgetPools() {
  const res = await api.get('/admin/budgets')
  return res.data
}