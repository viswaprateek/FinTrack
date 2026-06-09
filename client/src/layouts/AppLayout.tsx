import { Outlet } from 'react-router-dom'
import { AssistantWidget } from '../components/assistant/AssistantWidget'
import { QueryLoadingBar } from '../components/layout/QueryLoadingBar'
import { Sidebar } from '../components/layout/Sidebar'
import { MobileNav } from '../components/layout/MobileNav'
import { Topbar } from '../components/layout/Topbar'

export function AppLayout() {
  return (
    <>
      <QueryLoadingBar />
      <div className="flex min-h-screen bg-background text-foreground">
        <Sidebar />
        <div className="flex min-h-screen min-w-0 flex-1 flex-col lg:pl-64">
          <Topbar />
          <main className="min-w-0 flex-1 overflow-x-hidden px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:px-10 lg:py-8 lg:pb-8">
            <Outlet />
          </main>
        </div>
        <MobileNav />
        <AssistantWidget />
      </div>
    </>
  )
}
