import { Outlet } from 'react-router-dom'
import { AssistantWidget } from '../components/assistant/AssistantWidget'
import { QueryLoadingBar } from '../components/layout/QueryLoadingBar'
import { Sidebar } from '../components/layout/Sidebar'
import { Topbar } from '../components/layout/Topbar'
import { CurrencyProvider } from '../contexts/CurrencyContext'

export function AppLayout() {
  return (
    <CurrencyProvider>
      <QueryLoadingBar />
      <div className="flex min-h-screen bg-slate-950 text-slate-100">
        <Sidebar />
        <div className="flex min-h-screen flex-1 flex-col">
          <Topbar />
          <main className="flex-1 px-6 py-6 lg:px-8 lg:py-8">
            <Outlet />
          </main>
        </div>
        <AssistantWidget />
      </div>
    </CurrencyProvider>
  )
}
