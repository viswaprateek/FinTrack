import { Outlet } from 'react-router-dom'
import { AssistantWidget } from '../components/assistant/AssistantWidget'
import { QueryLoadingBar } from '../components/layout/QueryLoadingBar'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { Topbar } from '../components/layout/Topbar'
import { BudgetPeriodProvider } from '../contexts/BudgetPeriodContext'
import { CurrencyProvider } from '../contexts/CurrencyContext'

export function AppLayout() {
  return (
    <CurrencyProvider>
      <BudgetPeriodProvider>
        <QueryLoadingBar />
        <div className="flex min-h-screen bg-slate-950 text-slate-100">
          <Sidebar />
          <div className="flex min-h-screen flex-1 flex-col">
            <Topbar />
            <main className="flex-1 px-6 py-6 pb-24 lg:px-8 lg:py-8 lg:pb-8">
              <Outlet />
            </main>
          </div>
          <MobileNav />
          <AssistantWidget />
        </div>
      </BudgetPeriodProvider>
    </CurrencyProvider>
  )
}
