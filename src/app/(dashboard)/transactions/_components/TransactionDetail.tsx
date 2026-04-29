'use client';

import { useState } from 'react';
import { Badge, Button, Checkbox, Group, Modal, Stack, Text } from '@mantine/core';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { createRule } from '@/service/database/categorization';
import { TransactionData, updateTransactionCategory } from '@/service/database/transactions';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import CategorySegmentAssigner from './CategorySegmentAssigner';

interface TransactionDetailProps {
  transaction: TransactionData;
  onClose: () => void;
}

export default function TransactionDetail({ transaction, onClose }: TransactionDetailProps) {
  const [categoryId, setCategoryId] = useState(transaction.categoryId);
  const [segmentId, setSegmentId] = useState(transaction.segmentId);
  const [isSaving, setIsSaving] = useState(false);
  const [isSavingRule, setIsSavingRule] = useState(false);
  const updateTx = useTransactionsStore((state) => state.actions.update);

  const formatDate = (date: string) => new Date(date).toLocaleDateString('da-DK');
  const formatAmount = (amount: number) => `${amount.toFixed(2)} kr`;

  const hasChanges = categoryId !== transaction.categoryId || segmentId !== transaction.segmentId;

  const handleSave = async () => {
    if (!categoryId || !segmentId) {
      showErrorNotification({
        title: 'Validering fejlede',
        message: 'Vælg både kategori og segment',
      });
      return;
    }

    setIsSaving(true);
    const result = await updateTransactionCategory(transaction.id, categoryId, segmentId);

    if (result.success) {
      updateTx(transaction.id, { categoryId, segmentId, isManualOverride: true });
      showSuccessNotification({
        title: 'Erfolg',
        message: 'Transaktion opdateret',
      });
      onClose();
    } else {
      showErrorNotification({
        title: 'Fejl',
        message: result.error || 'Fejl ved opdatering',
      });
    }
    setIsSaving(false);
  };

  const handleSaveRule = async () => {
    if (!categoryId || !segmentId) {
      showErrorNotification({
        title: 'Validering fejlede',
        message: 'Vælg både kategori og segment',
      });
      return;
    }

    setIsSavingRule(true);
    const result = await createRule(transaction.merchantName, categoryId, segmentId, 0);

    if (result.success) {
      showSuccessNotification({
        title: 'Regel gemt',
        message: `Fremtidige transaktioner fra "${transaction.merchantName}" vil blive kategoriseret automatisk`,
      });
    } else {
      showErrorNotification({
        title: 'Fejl',
        message: result.error || 'Fejl ved gemning af regel',
      });
    }
    setIsSavingRule(false);
  };

  return (
    <Modal opened={true} onClose={onClose} title="Transaktion - Detaljer" size="sm">
      <Stack gap="lg">
        <div>
          <Text size="sm" c="dimmed">
            Dato
          </Text>
          <Text fw={500}>{formatDate(transaction.transactionDate)}</Text>
        </div>

        <div>
          <Text size="sm" c="dimmed">
            Handlende
          </Text>
          <Text fw={500}>{transaction.merchantName}</Text>
        </div>

        <div>
          <Text size="sm" c="dimmed">
            Beløb
          </Text>
          <Text fw={500}>{formatAmount(transaction.amount)}</Text>
        </div>

        {transaction.description && (
          <div>
            <Text size="sm" c="dimmed">
              Beskrivelse
            </Text>
            <Text size="sm">{transaction.description}</Text>
          </div>
        )}

        <CategorySegmentAssigner
          categoryId={categoryId}
          segmentId={segmentId}
          onCategoryChange={setCategoryId}
          onSegmentChange={setSegmentId}
        />

        {transaction.isManualOverride && (
          <Badge variant="dot" color="blue">
            Manuelt kategoriseret
          </Badge>
        )}

        <Group justify="space-between">
          <Button variant="default" onClick={onClose}>
            Annuller
          </Button>
          <Group gap="xs">
            <Button
              variant="light"
              onClick={handleSaveRule}
              loading={isSavingRule}
              disabled={!hasChanges || !categoryId || !segmentId}
              size="sm"
            >
              Gem regel
            </Button>
            <Button onClick={handleSave} loading={isSaving} disabled={!hasChanges}>
              Gem
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
