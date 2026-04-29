'use client';

import { produce } from 'immer';
import { create } from 'zustand';
import { persist, subscribeWithSelector } from 'zustand/middleware';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import {
  createSubscription,
  deleteSubscription,
  getSubscriptions,
  updateSubscription,
} from '@/service/database/subscriptions';
import { detectNewSubscriptions } from '@/service/database/subscriptions/detect';
import { DEFAULT_SUBSCRIPTIONS_STATE } from './subscriptionsStore.defaults';
import {
  SubscriptionsActions,
  SubscriptionsState,
  SubscriptionsStore,
} from './subscriptionsStore.types';

export const useSubscriptionsStore = create<SubscriptionsStore>()(
  subscribeWithSelector(
    persist(
      (set) => ({
        ...DEFAULT_SUBSCRIPTIONS_STATE,
        actions: {
          fetch: async () => {
            set(
              produce((state: SubscriptionsStore) => {
                state.isLoading = true;
              })
            );

            const result = await getSubscriptions();
            if (result.success) {
              set(
                produce((state: SubscriptionsStore) => {
                  state.subscriptions = result.data;
                  state.isLoading = false;
                })
              );
            } else {
              showErrorNotification({
                title: 'Fejl ved hentning',
                message: result.error,
              });
              set(
                produce((state: SubscriptionsStore) => {
                  state.isLoading = false;
                })
              );
            }
          },

          create: async (
            merchantName,
            categoryId,
            segmentId,
            expectedAmount,
            cadence,
            nextDueDate
          ) => {
            const result = await createSubscription(
              merchantName,
              categoryId,
              segmentId,
              expectedAmount,
              cadence,
              nextDueDate
            );

            if (result.success) {
              set(
                produce((state: SubscriptionsStore) => {
                  state.subscriptions.push(result.data);
                })
              );
              showSuccessNotification({
                title: 'Abonnement oprettet',
                message: `${merchantName} er tilføjet`,
              });
            } else {
              showErrorNotification({
                title: 'Fejl ved oprettelse',
                message: result.error,
              });
            }
          },

          update: async (id, categoryId, segmentId, expectedAmount, cadence, notes) => {
            const result = await updateSubscription(
              id,
              categoryId,
              segmentId,
              expectedAmount,
              cadence
            );

            if (result.success) {
              set(
                produce((state: SubscriptionsStore) => {
                  const sub = state.subscriptions.find((s) => s.id === id);
                  if (sub) {
                    sub.categoryId = categoryId;
                    sub.segmentId = segmentId;
                    if (expectedAmount !== undefined) sub.expectedAmount = expectedAmount;
                    if (cadence !== undefined) sub.cadence = cadence;
                    if (notes !== undefined) sub.notes = notes;
                  }
                })
              );
              showSuccessNotification({
                title: 'Abonnement opdateret',
                message: 'Ændringerne er gemt',
              });
            } else {
              showErrorNotification({
                title: 'Fejl ved opdatering',
                message: result.error,
              });
            }
          },

          delete: async (id) => {
            const result = await deleteSubscription(id);

            if (result.success) {
              set(
                produce((state: SubscriptionsStore) => {
                  state.subscriptions = state.subscriptions.filter((s) => s.id !== id);
                })
              );
              showSuccessNotification({
                title: 'Abonnement slettet',
                message: 'Abonnementet er fjernet',
              });
            } else {
              showErrorNotification({
                title: 'Fejl ved sletning',
                message: result.error,
              });
            }
          },

          detectNew: async () => {
            set(
              produce((state: SubscriptionsStore) => {
                state.isDetecting = true;
              })
            );

            const result = await detectNewSubscriptions();

            if (result.success) {
              set(
                produce((state: SubscriptionsStore) => {
                  state.detectedSubscriptions = result.data;
                  state.isDetecting = false;
                })
              );

              if (result.data.length > 0) {
                showSuccessNotification({
                  title: 'Detektering fuldført',
                  message: `${result.data.length} mulige abonnementer fundet`,
                });
              } else {
                showSuccessNotification({
                  title: 'Detektering fuldført',
                  message: 'Ingen nye abonnementer fundet',
                });
              }
            } else {
              showErrorNotification({
                title: 'Fejl ved detektering',
                message: result.error,
              });
              set(
                produce((state: SubscriptionsStore) => {
                  state.isDetecting = false;
                })
              );
            }
          },

          confirmDetected: async (merchantName, categoryId, segmentId) => {
            // Find detected subscription
            const detected = useSubscriptionsStore
              .getState()
              .detectedSubscriptions.find((d) => d.merchantName === merchantName);

            if (!detected) return;

            // Create subscription from detected data
            await useSubscriptionsStore
              .getState()
              .actions.create(
                merchantName,
                categoryId,
                segmentId,
                detected.expectedAmount,
                detected.cadence,
                detected.nextDueDate || undefined
              );

            // Remove from detected list
            set(
              produce((state: SubscriptionsStore) => {
                state.detectedSubscriptions = state.detectedSubscriptions.filter(
                  (d) => d.merchantName !== merchantName
                );
              })
            );
          },

          ignoreDetected: (merchantName) => {
            set(
              produce((state: SubscriptionsStore) => {
                state.detectedSubscriptions = state.detectedSubscriptions.filter(
                  (d) => d.merchantName !== merchantName
                );
              })
            );
          },

          setFilter: (filter) => {
            set(
              produce((state: SubscriptionsStore) => {
                state.filters = { ...state.filters, ...filter };
              })
            );
          },

          clearFilter: () => {
            set(
              produce((state: SubscriptionsStore) => {
                state.filters = {};
              })
            );
          },
        } as SubscriptionsActions,
      }),
      {
        name: 'subscriptions-store',
        version: 1,
        partialize: (state) => ({
          filters: state.filters,
        }),
      }
    )
  )
);
