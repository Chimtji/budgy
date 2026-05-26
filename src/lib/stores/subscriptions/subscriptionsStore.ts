import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';
import { showErrorNotification } from '@/notifications/feedback';
import { createSubscriptionMatcher } from '@/service/database/subscriptions/create';
import { deleteSubscriptionMatcher } from '@/service/database/subscriptions/delete';
import {
  getAllSubscriptionMatchers,
  type TSubscriptionMatcher,
} from '@/service/database/subscriptions/getAll';
import { updateSubscriptionAmountRange } from '@/service/database/subscriptions/updateAmountRange';
import {
  updateSubscriptionCadence,
  type TSubscriptionCadence,
} from '@/service/database/subscriptions/updateCadence';
import { updateSubscriptionCancelledAt } from '@/service/database/subscriptions/updateCancelledAt';
import { updateSubscriptionNote } from '@/service/database/subscriptions/updateNote';

type TState = {
  matchers: TSubscriptionMatcher[];
  ignoredDetectionKeys: string[];
};

type TActions = {
  init: () => Promise<void>;
  ignoreDetection: (key: string) => void;
  unignoreDetection: (key: string) => void;
  addMatcher: (
    name: string,
    matcherType: TSubscriptionMatcher['matcher_type'],
    matcherValue: string,
    amountMin?: number | null,
    amountMax?: number | null
  ) => Promise<TSubscriptionMatcher | null>;
  confirmDetection: (
    name: string,
    matcherType: TSubscriptionMatcher['matcher_type'],
    matcherValue: string,
    cadence: TSubscriptionCadence | null,
    amountMin?: number | null,
    amountMax?: number | null
  ) => Promise<TSubscriptionMatcher | null>;
  removeMatcher: (id: string) => Promise<void>;
  setCadence: (id: string, cadence: TSubscriptionCadence | null) => Promise<void>;
  setNote: (id: string, note: string | null) => Promise<void>;
  setAmountRange: (id: string, amountMin: number | null, amountMax: number | null) => Promise<void>;
  setCancelledAt: (id: string, cancelledAt: string | null) => Promise<void>;
};

export const useSubscriptionsStore = create<TState & TActions>()(
  persist(
    subscribeWithSelector(
      immer((set) => ({
        matchers: [],
        ignoredDetectionKeys: [],

        ignoreDetection: (key) => {
          set((state) => {
            if (!state.ignoredDetectionKeys.includes(key)) {
              state.ignoredDetectionKeys.push(key);
            }
          });
        },

        unignoreDetection: (key) => {
          set((state) => {
            state.ignoredDetectionKeys = state.ignoredDetectionKeys.filter((k) => k !== key);
          });
        },

        init: async () => {
          const result = await getAllSubscriptionMatchers();
          if (!result.success) {
            showErrorNotification({
              title: 'Fejl',
              message: 'Kunne ikke hente abonnementsregler',
            });
            return;
          }
          set((state) => {
            state.matchers = result.data;
          });
        },

        addMatcher: async (name, matcherType, matcherValue, amountMin, amountMax) => {
          const result = await createSubscriptionMatcher({
            name,
            matcher_type: matcherType,
            matcher_value: matcherValue,
            amount_min: amountMin ?? null,
            amount_max: amountMax ?? null,
          });
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke tilføje abonnement' });
            return null;
          }
          set((state) => {
            state.matchers.push(result.data);
          });
          return result.data;
        },

        confirmDetection: async (
          name,
          matcherType,
          matcherValue,
          cadence,
          amountMin,
          amountMax
        ) => {
          const result = await createSubscriptionMatcher({
            name,
            matcher_type: matcherType,
            matcher_value: matcherValue,
            cadence: cadence ?? undefined,
            amount_min: amountMin ?? null,
            amount_max: amountMax ?? null,
          });
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke bekræfte abonnement' });
            return null;
          }
          set((state) => {
            state.matchers.push(result.data);
          });
          return result.data;
        },

        removeMatcher: async (id) => {
          const result = await deleteSubscriptionMatcher(id);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke slette abonnement' });
            return;
          }
          set((state) => {
            state.matchers = state.matchers.filter((m) => m.id !== id);
          });
        },

        setCadence: async (id, cadence) => {
          const result = await updateSubscriptionCadence(id, cadence);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere kadence' });
            return;
          }
          set((state) => {
            const m = state.matchers.find((m) => m.id === id);
            if (m) m.cadence = cadence;
          });
        },

        setNote: async (id, note) => {
          const result = await updateSubscriptionNote(id, note);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere note' });
            return;
          }
          set((state) => {
            const m = state.matchers.find((m) => m.id === id);
            if (m) m.note = note;
          });
        },

        setAmountRange: async (id, amountMin, amountMax) => {
          const result = await updateSubscriptionAmountRange(id, amountMin, amountMax);
          if (!result.success) {
            showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere beløbsinterval' });
            return;
          }
          set((state) => {
            const m = state.matchers.find((m) => m.id === id);
            if (m) {
              m.amount_min = amountMin;
              m.amount_max = amountMax;
            }
          });
        },

        setCancelledAt: async (id, cancelledAt) => {
          const result = await updateSubscriptionCancelledAt(id, cancelledAt);
          if (!result.success) {
            showErrorNotification({
              title: 'Fejl',
              message: 'Kunne ikke opdatere abonnementstatus',
            });
            return;
          }
          set((state) => {
            const m = state.matchers.find((m) => m.id === id);
            if (m) m.cancelled_at = cancelledAt;
          });
        },
      }))
    ),
    { name: 'subscriptions-store' }
  )
);
