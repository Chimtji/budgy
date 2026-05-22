import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { deleteGoal } from '@/service/database/goals/delete';
import { getAllGoals, type TGoal } from '@/service/database/goals/getAll';
import { upsertGoal } from '@/service/database/goals/upsert';

type TState = {
  goals: TGoal[];
};

type TActions = {
  init: () => Promise<void>;
  upsertGoal: (input: {
    name: string;
    category_key: string;
    segment_key: string;
    amount_limit: number;
    effective_from: string;
  }) => Promise<void>;
  /** Remove a single goal entry by its id. */
  removeGoal: (id: string) => Promise<void>;
};

export const useGoalsStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        goals: [],

        init: async () => {
          const result = await getAllGoals();
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke hente mål' });
            return;
          }
          set((state) => {
            state.goals = result.data;
          });
        },

        upsertGoal: async (input) => {
          const result = await upsertGoal(input);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke gemme mål' });
            return;
          }
          set((state) => {
            const idx = state.goals.findIndex(
              (g) =>
                g.category_key === input.category_key &&
                g.segment_key === input.segment_key &&
                g.effective_from === input.effective_from
            );
            if (idx !== -1) state.goals[idx] = result.data;
            else state.goals.push(result.data);
          });
          showSuccessNotification({ title: 'Gemt', message: 'Budgetmål opdateret' });
        },

        removeGoal: async (id) => {
          const result = await deleteGoal(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette mål' });
            return;
          }
          set((state) => {
            state.goals = state.goals.filter((g) => g.id !== id);
          });
        },
      }))
    ),
    { name: 'goals-store' }
  )
);

/**
 * Resolve the active goal for a (category, segment) slot in a given month.
 * Returns the most recent entry where effective_from <= first of the given month.
 */
export function resolveGoalForMonth(
  goals: TGoal[],
  category_key: string,
  segment_key: string,
  yearMonth: string // "YYYY-MM"
): TGoal | null {
  const monthStart = `${yearMonth}-01`;
  const candidates = goals
    .filter(
      (g) =>
        g.category_key === category_key &&
        g.segment_key === segment_key &&
        g.effective_from <= monthStart
    )
    .sort((a, b) => b.effective_from.localeCompare(a.effective_from));
  return candidates[0] ?? null;
}
