import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
import { AppLayout } from '../layouts/AppLayout'
import { ProtectedRoute } from '../components/guards/ProtectedRoute'
import { OnboardingGate } from '../components/guards/OnboardingGate'

import { LandingPage } from '../pages/public/LandingPage'
import { SignInPage } from '../pages/public/SignInPage'
import { SignUpPage } from '../pages/public/SignUpPage'

import { DashboardPage } from '../pages/app/DashboardPage'
import { BudgetListPage } from '../pages/app/BudgetListPage'
import { BudgetDetailPage } from '../pages/app/BudgetDetailPage'
import { BudgetCategoriesRedirect } from '../pages/app/BudgetCategoriesRedirect'
import { CategoryLibraryPage } from '../pages/app/CategoryLibraryPage'
import { TransactionsPage } from '../pages/app/TransactionsPage'
import { RecurringPage } from '../pages/app/RecurringPage'
import { ReportsPage } from '../pages/app/ReportsPage'
import { SettingsPage } from '../pages/app/SettingsPage'
import { GoalsPage } from '../pages/app/GoalsPage'
import { CardsPage } from '../pages/app/CardsPage'
import { OnboardingPage } from '../pages/app/OnboardingPage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/sign-in/*', element: <SignInPage /> },
      { path: '/sign-up/*', element: <SignUpPage /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/onboarding', element: <OnboardingPage /> },
      {
        element: <OnboardingGate />,
        children: [
          {
            element: <AppLayout />,
            children: [
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/budgets', element: <BudgetListPage /> },
          { path: '/budgets/:id', element: <BudgetDetailPage /> },
          { path: '/budgets/:id/categories', element: <BudgetCategoriesRedirect /> },
          { path: '/categories', element: <CategoryLibraryPage /> },
          { path: '/transactions', element: <TransactionsPage /> },
          { path: '/recurring', element: <RecurringPage /> },
          { path: '/reports', element: <ReportsPage /> },
          { path: '/goals', element: <GoalsPage /> },
          { path: '/cards', element: <CardsPage /> },
          { path: '/settings', element: <SettingsPage /> },
            ],
          },
        ],
      },
    ],
  },
])
