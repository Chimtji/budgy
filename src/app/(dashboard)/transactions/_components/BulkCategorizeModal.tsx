'use client';

import { useMemo, useState } from 'react';
import { Button, Group, Modal, Select, Stack, Text } from '@mantine/core';
import categories from '@/data/categories.json';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { bulkUpdateTransactionsCategory } from '@/service/database/transactions';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';

interface BulkCategorizeModalProps {
  opened: boolean;
  onClose: () => void;
  selectedTransactionIds: string[];
  onSuccess: () => void;
}

export default function BulkCategorizeModal({
  opened,
  onClose,
  selectedTransactionIds,
  onSuccess,
}: BulkCategorizeModalProps) {
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [segmentId, setSegmentId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const updateTx = useTransactionsStore((state) => state.actions.update);

  const segmentOptions = useMemo(() => {
    if (!categoryId) return [];
    const category = Object.values(categories).find((c) => c.id === categoryId);
    if (!category) return [];
    return Object.entries(category.segments).map(([_key, segment]) => ({
      value: segment.id,
      label: segment.label,
    }));
  }, [categoryId]);

  const handleApply = async () => {
    if (!categoryId || !segmentId) {
      showErrorNotification({
        title: 'Validering fejlede',
        message: 'Vælg både kategori og segment',
      });
      return;
    }

    setIsLoading(true);
    const result = await bulkUpdateTransactionsCategory(
      selectedTransactionIds,
      categoryId,
      segmentId
    );

    if (result.success) {
      selectedTransactionIds.forEach((id) => {
        updateTx(id, { categoryId, segmentId, isManualOverride: true });
      });
      showSuccessNotification({
        title: 'Succes',
        message: `${selectedTransactionIds.length} transaktioner opdateret`,
      });
      onSuccess();
      setCategoryId(null);
      setSegmentId(null);
      onClose();
    } else {
      showErrorNotification({
        title: 'Fejl',
        message: result.error || 'Fejl ved opdatering',
      });
    }
    setIsLoading(false);
  };

  const categoryOptions = Object.values(categories).map((cat) => ({
    value: cat.id,
    label: cat.label,
  }));

  return (
    <Modal opened={opened} onClose={onClose} title="Kategoriser transaktioner">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Kategoriserer {selectedTransactionIds.length} transaktioner
        </Text>

        <Select
          label="Kategori"
          placeholder="Vælg kategori"
          data={categoryOptions}
          value={categoryId}
          onChange={(value) => {
            setCategoryId(value);
            setSegmentId(null);
          }}
          required
        />

        <Select
          label="Segment"
          placeholder="Vælg segment"
          data={segmentOptions}
          value={segmentId}
          onChange={setSegmentId}
          disabled={!categoryId}
          required
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annuller
          </Button>
          <Button onClick={handleApply} loading={isLoading} disabled={!categoryId || !segmentId}>
            Anvend
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
