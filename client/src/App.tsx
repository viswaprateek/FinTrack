import './App.css'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

function App() {
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <header className="flex items-center justify-between border-b border-slate-800 px-8 py-5">
        <h1 className="text-2xl font-bold tracking-tight">FinTrack</h1>

        <div className="flex items-center gap-3">
          <Show when="signed-out">
            <SignInButton>
              <button className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium hover:bg-slate-800">
                Sign in
              </button>
            </SignInButton>

            <SignUpButton>
              <button className="rounded-lg bg-white px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-slate-200">
                Sign up
              </button>
            </SignUpButton>
          </Show>

          <Show when="signed-in">
            <UserButton />
          </Show>
        </div>
      </header>

      <section className="mx-auto flex max-w-5xl flex-col items-center px-6 py-24 text-center">
        <span className="rounded-full border border-slate-700 px-4 py-1 text-sm text-slate-300">
          Personal Finance Budgeting
        </span>

        <h2 className="mt-6 text-5xl font-bold tracking-tight">
          Plan budgets. Track spending. Stay on target.
        </h2>

        <p className="mt-5 max-w-2xl text-lg text-slate-400">
          Manage envelopes, transactions, recurring bills, rollovers, and cashflow forecasting in one place.
        </p>

        <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-3xl font-bold">$4,250</p>
            <p className="mt-2 text-sm text-slate-400">Monthly Income</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-3xl font-bold">$2,780</p>
            <p className="mt-2 text-sm text-slate-400">Planned Spending</p>
          </div>

          <div className="rounded-xl border border-slate-800 bg-slate-900 p-5">
            <p className="text-3xl font-bold">$1,470</p>
            <p className="mt-2 text-sm text-slate-400">Available</p>
          </div>
        </div>
      </section>
    </main>
  )
}

export default App