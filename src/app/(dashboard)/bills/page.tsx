'use client';

import { useEffect, useState } from 'react';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { Alert, Button, Container, Group, Stack, Text, Title } from '@mantine/core';
import { SubscriptionData } from '@/service/database/subscriptions';
import { DetectedSubscription } from '@/service/database/subscriptions/detect';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import DetectionPrompt from './_components/DetectionPrompt';
import SubscriptionForm from './_components/SubscriptionForm';
import SubscriptionsList from './_components/SubscriptionsList';

const SubscriptionsPage = () => {
  const { subscriptions, detectedSubscriptions, isLoading, isDetecting, actions } =
    useSubscriptionsStore(
      useShallow((state) => ({
        subscriptions: state.subscriptions,
        detectedSubscriptions: state.detectedSubscriptions,
        isLoading: state.isLoading,
        isDetecting: state.isDetecting,
        actions: state.actions,
      }))
    );

  const [formOpened, setFormOpened] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<SubscriptionData | undefined>();
  const [selectedDetected, setSelectedDetected] = useState<DetectedSubscription | undefined>();
  const [categorySegmentMap, setCategorySegmentMap] = useState<
    Record<string, { categoryId: string; segmentId: string }>
  >({});

  useEffect(() => {
    actions.fetch();
  }, []);

  const handleEditSubscription = (subscription: SubscriptionData) => {
    setEditingSubscription(subscription);
    setFormOpened(true);
  };

  const handleFormSubmit = async (data: {
    merchantName: string;
    categoryId: string;
    segmentId: string;
    expectedAmount: number;
    cadence: string;
    nextDueDate?: string;
  }) => {
    if (editingSubscription) {
      await actions.update(
        editingSubscription.id,
        data.categoryId,
        data.segmentId,
        data.expectedAmount,
        data.cadence
      );
    } else {
      await actions.create(
        data.merchantName,
        data.categoryId,
        data.segmentId,
        data.expectedAmount,
        data.cadence,
        data.nextDueDate
      );
    }
    setEditingSubscription(undefined);
  };

  const handleDetectionEdit = (detected: DetectedSubscription) => {
    setSelectedDetected(detected);
    setFormOpened(true);
  };

  const handleDetectionConfirm = async (
    merchantName: string,
    categoryId: string,
    segmentId: string,
    currentForm?: boolean
  ) => {
    if (currentForm && selectedDetected) {
      // If editing a detected item, create it with form values
      setCategorySegmentMap((prev) => ({
        ...prev,
        [merchantName]: { categoryId, segmentId },
      }));
    } else {
      // Direct confirmation from detection list
      await actions.confirmDetected(merchantName, categoryId, segmentId);
    }
  };

  const handleFormClose = () => {
    setFormOpened(false);
    setEditingSubscription(undefined);
    setSelectedDetected(undefined);
  };

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Abonnementer</Title>
          <Text c="dimmed" size="sm">
            Administrer dine tilbagevendende udgifter og automatisk detekterede abonnementer
          </Text>
        </div>

        {detectedSubscriptions.length > 0 && (
          <Alert icon={<IconAlertCircle />} color="blue" title="Nye abonnementer detekterede">
            Vi har fundet {detectedSubscriptions.length} mulige abonnementer. Gennemgå og bekræft
            dem herunder.
          </Alert>
        )}

        <Group justify="space-between">
          <Button
            onClick={() => actions.detectNew()}
            loading={isDetecting}
            leftSection={<IconRefresh size={16} />}
          >
            Søg efter nye abonnementer
          </Button>
        </Group>

        {detectedSubscriptions.length > 0 && (
          <div>
            <DetectionPrompt
              detected={detectedSubscriptions}
              onConfirm={(merchantName, categoryId, segmentId) => {
                handleDetectionConfirm(merchantName, categoryId, segmentId, false);
              }}
              onEdit={handleDetectionEdit}
              onIgnore={(merchantName) => actions.ignoreDetected(merchantName)}
              selectedCategorySegment={categorySegmentMap}
            />
          </div>
        )}

        <SubscriptionsList
          subscriptions={subscriptions}
          onEdit={handleEditSubscription}
          onDelete={(id) => actions.delete(id)}
          onCreateNew={() => {
            setEditingSubscription(undefined);
            setFormOpened(true);
          }}
          isLoading={isLoading}
        />

        <SubscriptionForm
          opened={formOpened}
          onClose={handleFormClose}
          onSubmit={handleFormSubmit}
          initialData={
            editingSubscription ||
            (selectedDetected
              ? {
                  id: '', // Placeholder
                  merchantName: selectedDetected.merchantName,
                  categoryId: categorySegmentMap[selectedDetected.merchantName]?.categoryId || '',
                  segmentId: categorySegmentMap[selectedDetected.merchantName]?.segmentId || '',
                  expectedAmount: selectedDetected.expectedAmount,
                  currency: 'EUR',
                  cadence: selectedDetected.cadence,
                  nextDueDate: selectedDetected.nextDueDate,
                  detectionConfidence: selectedDetected.confidence,
                  isActive: true,
                  notes: null,
                }
              : undefined)
          }
          isLoading={isLoading}
        />
      </Stack>
    </Container>
  );
};

export default SubscriptionsPage;
