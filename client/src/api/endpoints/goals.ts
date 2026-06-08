import type { AxiosInstance } from 'axios'
import type { Goal, GoalContribution } from '../../types'

export interface GoalCreateInput {
  name: string
  target_amount: number
  current_amount?: number
  icon?: string | null
  target_date?: string | null
  notes?: string | null
}

export interface GoalUpdateInput {
  name?: string
  target_amount?: number
  icon?: string | null
  target_date?: string | null
  notes?: string | null
  is_archived?: boolean
}

export interface GoalContributionInput {
  amount: number
  note?: string | null
  contributed_at?: string | null
}

/** FastAPI serializes Decimal fields as strings — coerce before arithmetic. */
function parseGoal(goal: Goal): Goal {
  return {
    ...goal,
    targetAmount: Number(goal.targetAmount),
    currentAmount: Number(goal.currentAmount),
    remainingAmount: Number(goal.remainingAmount),
    percentComplete: Number(goal.percentComplete),
  }
}

function parseContribution(contribution: GoalContribution): GoalContribution {
  return {
    ...contribution,
    amount: Number(contribution.amount),
  }
}

export const goalsApi = {
  list: (client: AxiosInstance, includeArchived?: boolean) =>
    client
      .get<Goal[]>('/api/goals', { params: includeArchived ? { include_archived: true } : undefined })
      .then((res) => res.data.map(parseGoal)),
  get: (client: AxiosInstance, id: string) =>
    client.get<Goal>(`/api/goals/${id}`).then((res) => parseGoal(res.data)),
  create: (client: AxiosInstance, payload: GoalCreateInput) =>
    client.post<Goal>('/api/goals', payload).then((res) => parseGoal(res.data)),
  update: (client: AxiosInstance, id: string, payload: GoalUpdateInput) =>
    client.patch<Goal>(`/api/goals/${id}`, payload).then((res) => parseGoal(res.data)),
  remove: (client: AxiosInstance, id: string) =>
    client.delete(`/api/goals/${id}`).then(() => undefined),
  listContributions: (client: AxiosInstance, goalId: string) =>
    client.get<GoalContribution[]>(`/api/goals/${goalId}/contributions`).then((res) => res.data.map(parseContribution)),
  addContribution: (client: AxiosInstance, goalId: string, payload: GoalContributionInput) =>
    client.post<Goal>(`/api/goals/${goalId}/contributions`, payload).then((res) => parseGoal(res.data)),
  removeContribution: (client: AxiosInstance, goalId: string, contributionId: string) =>
    client.delete<Goal>(`/api/goals/${goalId}/contributions/${contributionId}`).then((res) => parseGoal(res.data)),
}
