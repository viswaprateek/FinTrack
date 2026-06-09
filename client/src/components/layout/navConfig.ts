import type { ComponentType } from 'react'
import {
  IconBarChart,
  IconCreditCard,
  IconLayoutDashboard,
  IconReceipt,
  IconRepeat,
  IconSettings,
  IconTags,
  IconTarget,
  IconUsers,
  IconWallet,
} from '../ui/icons'

export interface NavItem {
  to: string
  label: string
  icon: ComponentType<{ className?: string }>
  description?: string
}

export interface NavSection {
  label: string
  items: NavItem[]
}

/** Desktop sidebar — grouped by how often people use each area. */
export const sidebarSections: NavSection[] = [
  {
    label: 'Overview',
    items: [{ to: '/dashboard', label: 'Dashboard', icon: IconLayoutDashboard }],
  },
  {
    label: 'Budget',
    items: [
      { to: '/budgets', label: 'Budgets', icon: IconWallet },
      { to: '/transactions', label: 'Transactions', icon: IconReceipt },
      { to: '/categories', label: 'Categories', icon: IconTags },
    ],
  },
  {
    label: 'Planning',
    items: [
      { to: '/recurring', label: 'Recurring Bills', icon: IconRepeat },
      { to: '/goals', label: 'Goals', icon: IconTarget },
    ],
  },
  {
    label: 'Insights',
    items: [
      { to: '/reports', label: 'Reports', icon: IconBarChart },
      { to: '/shared-expenses', label: 'Shared Expenses', icon: IconUsers },
    ],
  },
  {
    label: 'Tools',
    items: [{ to: '/cards', label: 'Cards', icon: IconCreditCard }],
  },
]

export const settingsNavItem: NavItem = {
  to: '/settings',
  label: 'Settings',
  icon: IconSettings,
  description: 'Account & preferences',
}

/** Mobile bottom bar — daily drivers only. */
export const mobilePrimaryNav: NavItem[] = [
  { to: '/dashboard', label: 'Home', icon: IconLayoutDashboard },
  { to: '/budgets', label: 'Budgets', icon: IconWallet },
  { to: '/transactions', label: 'Ledger', icon: IconReceipt },
  { to: '/categories', label: 'Categories', icon: IconTags },
]

/** Mobile “More” sheet — everything else. */
export const mobileMoreNav: NavItem[] = [
  {
    to: '/shared-expenses',
    label: 'Shared Expenses',
    icon: IconUsers,
    description: 'Split expenses with friends',
  },
  {
    to: '/cards',
    label: 'Cards',
    icon: IconCreditCard,
    description: 'Mock credit cards',
  },
  {
    to: '/goals',
    label: 'Goals',
    icon: IconTarget,
    description: 'Savings targets',
  },
  {
    to: '/reports',
    label: 'Reports & Forecasts',
    icon: IconBarChart,
    description: 'Cashflow and trends',
  },
  {
    to: '/recurring',
    label: 'Recurring Bills',
    icon: IconRepeat,
    description: 'Automated payments',
  },
  settingsNavItem,
]

export const mobileMoreRoutes = mobileMoreNav.map((item) => item.to)

export const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/budgets': 'Budgets',
  '/categories': 'Categories',
  '/transactions': 'Transactions',
  '/shared-expenses': 'Shared Expenses',
  '/recurring': 'Recurring Bills',
  '/goals': 'Goals',
  '/cards': 'Cards',
  '/reports': 'Reports & Forecasts',
  '/settings': 'Settings',
}
