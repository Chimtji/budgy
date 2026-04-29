'use client';

import { useMemo, useState } from 'react';
import { Button, Group, Modal, NumberInput, Select, Stack, Text, TextInput } from '@mantine/core';
import categories from '@/data/categories.json';
import { SubscriptionData } from '@/service/database/subscriptions';

const CADENCE_OPTIONS = [
  { value: 'MONTHLY', label: 'Månedlig' },
  { value: 'QUARTERLY', label: 'Kvartalsvist' },
  { value: 'BIANNUAL', label: 'Halvårlig' },
  { value: 'ANNUAL', label: 'Årlig' },
  { value: 'IRREGULAR', label: 'Uregelmæssig' },
];

interface SubscriptionFormProps {
  opened: boolean;
  onClose: () => void;
  onSubmit: (data: {
    merchantName: string;
    categoryId: string;
    segmentId: string;
    expectedAmount: number;
    cadence: string;
    nextDueDate?: string;
  }) => void;
  initialData?: SubscriptionData;
  isLoading: boolean;
}

export default function SubscriptionForm({
  opened,
  onClose,
  onSubmit,
  initialData,
  isLoading,
}: SubscriptionFormProps) {
  const [merchantName, setMerchantName] = useState(initialData?.merchantName || '');
  const [categoryId, setCategoryId] = useState(initialData?.categoryId || '');
  const [segmentId, setSegmentId] = useState(initialData?.segmentId || '');
  const [expectedAmount, setExpectedAmount] = useState(initialData?.expectedAmount || 0);
  const [cadence, setCadence] = useState(initialData?.cadence || '');
  const [nextDueDate, setNextDueDate] = useState(initialData?.nextDueDate || '');

  const segmentOptions = useMemo(() => {
    if (!categoryId) return [];
    const category = Object.values(categories).find((c) => c.id === categoryId);
    if (!category) return [];
    return Object.entries(category.segments).map(([_key, segment]) => ({
      value: segment.id,
      label: segment.label,
    }));
  }, [categoryId]);

  const handleSubmit = () => {
    if (!merchantName || !categoryId || !segmentId || !cadence) {
      return;
    }

    onSubmit({
      merchantName,
      categoryId,
      segmentId,
      expectedAmount,
      cadence,
      nextDueDate: nextDueDate || undefined,
    });

    // Reset form
    setMerchantName('');
    setCategoryId('');
    setSegmentId('');
    setExpectedAmount(0);
    setCadence('');
    setNextDueDate('');
    onClose();
  };

  const categoryOptions = Object.values(categories).map((cat) => ({
    value: cat.id,
    label: cat.label,
  }));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={initialData ? 'Rediger abonnement' : 'Opret abonnement'}
    >
      <Stack gap="md">
        <TextInput
          label="Forhandler"
          placeholder="F.eks. Netflix"
          value={merchantName}
          onChange={(e) => setMerchantName(e.currentTarget.value)}
          required
        />

        <Select
          label="Kategori"
          placeholder="Vælg kategori"
          data={categoryOptions}
          value={categoryId}
          onChange={(value) => {
            setCategoryId(value || '');
            setSegmentId('');
          }}
          required
        />

        <Select
          label="Segment"
          placeholder="Vælg segment"
          data={segmentOptions}
          value={segmentId}
          onChange={(value) => setSegmentId(value || '')}
          disabled={!categoryId}
          required
        />

        <NumberInput
          label="Forventet beløb"
          placeholder="0,00"
          value={expectedAmount}
          onChange={(value) => setExpectedAmount(Number(value))}
          decimalScale={2}
          required
        />

        <Select
          label="Hyppighed"
          placeholder="Vælg hyppighed"
          data={CADENCE_OPTIONS}
          value={cadence}
          onChange={(value) => setCadence(value || '')}
          required
        />

        <TextInput
          label="Næste forfaldsdato (valgfrit)"
          type="date"
          value={nextDueDate}
          onChange={(e) => setNextDueDate(e.currentTarget.value)}
        />

        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>
            Annuller
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!merchantName || !categoryId || !segmentId || !cadence}
            loading={isLoading}
          >
            {initialData ? 'Gem' : 'Opret'}
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
