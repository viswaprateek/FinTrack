import { createBrowserRouter } from 'react-router-dom'
import { PublicLayout } from '../layouts/PublicLayout'
import { AppLayout } from '../layouts/AppLayout'
import { AppProviders } from '../layouts/AppProviders'
import { ProtectedRoute } from '../components/guards/ProtectedRoute'
import { OnboardingGate } from '../components/guards/OnboardingGate'

import { LandingPage } from '../pages/public/LandingPage'
import { SignInPage } from '../pages/public/SignInPage'
import { SignUpPage } from '../pages/public/SignUpPage'
import { ClerkSsoCallbackPage } from '../pages/public/ClerkSsoCallbackPage'

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
import { SharedExpensesPage } from '../pages/app/SharedExpensesPage'
import { OwePage } from '../pages/public/OwePage'

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <LandingPage /> },
      { path: '/sign-in/sso-callback', element: <ClerkSsoCallbackPage /> },
      { path: '/sign-up/sso-callback', element: <ClerkSsoCallbackPage /> },
      { path: '/sign-in/*', element: <SignInPage /> },
      { path: '/sign-up/*', element: <SignUpPage /> },
      { path: '/owe/:token', element: <OwePage /> },
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
            element: <AppProviders />,
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
          { path: '/shared-expenses', element: <SharedExpensesPage /> },
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
    ],
  },
])
