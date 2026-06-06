import { useState } from 'react'
import { Button } from '../ui/Button'
import { formatCurrency, formatDate } from '../../lib/utils'
import type { Category } from '../../types'
import type { ParsedTransaction } from './assistant.types'

interface TransactionConfirmCardProps {
  transaction: ParsedTransaction
  categories: Category[]
  isSubmitting: boolean
  onChange: (patch: Partial<ParsedTransaction>) => void
  onConfirm: () => void
}

export function TransactionConfirmCard({
  transaction,
  categories,
  isSubmitting,
  onChange,
  onConfirm,
}: TransactionConfirmCardProps) {
  const [isEditing, setIsEditing] = useState(false)

  const selectedCategoryId = transaction.category_id != null ? String(transaction.category_id) : ''

  return (
    <div className="mt-2 rounded-xl border border-slate-700 bg-slate-900 p-4 text-sm text-slate-100">
      <div className="mb-3 flex items-center gap-2 font-semibold text-slate-100">
        <span aria-hidden>🧾</span>
        <span>Transaction Detected</span>
      </div>

      {transaction.confidence === 'medium' && (
        <div className="mb-3 rounded-lg border border-yellow-500/40 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-300">
          Please review — I'm not fully confident about these details
        </div>
      )}

      <div className="space-y-2.5">
        <Field label="Type">
          {isEditing ? (
            <select
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
              value={transaction.type}
              onChange={(e) => onChange({ type: e.target.value as ParsedTransaction['type'] })}
            >
              <option value="expense">Expense</option>
              <option value="income">Income</option>
              <option value="unknown">Unknown</option>
            </select>
          ) : (
            <span className="capitalize">{transaction.type}</span>
          )}
        </Field>

        <Field label="Amount">
          {isEditing ? (
            <input
              type="number"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
              value={transaction.amount ?? ''}
              onChange={(e) => onChange({ amount: e.target.value === '' ? null : Number(e.target.value) })}
            />
          ) : (
            <span>{transaction.amount != null ? formatCurrency(transaction.amount) : '—'}</span>
          )}
        </Field>

        <Field label="Date">
          {isEditing ? (
            <input
              type="date"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
              value={transaction.date}
              onChange={(e) => onChange({ date: e.target.value })}
            />
          ) : (
            <span>{formatDate(transaction.date)}</span>
          )}
        </Field>

        <Field label="Description">
          {isEditing ? (
            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
              value={transaction.description ?? ''}
              onChange={(e) => onChange({ description: e.target.value })}
            />
          ) : (
            <span>{transaction.description ?? '—'}</span>
          )}
        </Field>

        <Field label="Category">
          <select
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
            value={selectedCategoryId}
            onChange={(e) => onChange({ category_id: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">{transaction.category_suggestion ?? 'Uncategorized'}</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Account">
          {isEditing ? (
            <input
              type="text"
              className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100"
              value={transaction.account ?? ''}
              onChange={(e) => onChange({ account: e.target.value })}
            />
          ) : (
            <span>{transaction.account ?? '—'}</span>
          )}
        </Field>

        <Field label="Reimbursable">
          <button
            type="button"
            onClick={() => onChange({ is_reimbursable: !transaction.is_reimbursable })}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              transaction.is_reimbursable ? 'bg-emerald-500' : 'bg-slate-700'
            }`}
            aria-pressed={transaction.is_reimbursable}
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                transaction.is_reimbursable ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </Field>

        <Field label="Notes">
          <input
            type="text"
            placeholder="Add a note..."
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-2 py-1 text-slate-100 placeholder:text-slate-500"
            value={transaction.notes ?? ''}
            onChange={(e) => onChange({ notes: e.target.value })}
          />
        </Field>
      </div>

      <div className="mt-4 flex items-center justify-between gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => setIsEditing((prev) => !prev)}>
          ✏ Edit
        </Button>
        <Button type="button" variant="primary" size="sm" onClick={onConfirm} disabled={isSubmitting}>
          ✅ Add Transaction
        </Button>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[110px_1fr] items-center gap-2">
      <span className="text-xs text-slate-400">{label}</span>
      <div>{children}</div>
    </div>
  )
}
