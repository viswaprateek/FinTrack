import { useEffect } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useBudgetPeriod } from '../../contexts/BudgetPeriodContext'

/** Legacy route: /budgets/:id/categories → /categories with shared month synced. */
export function BudgetCategoriesRedirect() {
  const { id } = useParams()
  const { selectBudget } = useBudgetPeriod()

  useEffect(() => {
    if (id) selectBudget(id)
  }, [id, selectBudget])

  return <Navigate to="/categories" replace />
}
