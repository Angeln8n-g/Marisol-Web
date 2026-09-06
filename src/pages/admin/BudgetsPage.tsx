import React from 'react'
import { BudgetList } from '../../components/admin/budgets'

export const BudgetsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <BudgetList />
    </div>
  )
}
