'use client';

import { useEffect, useState } from 'react';
import { Button, Group, Select, Stack, Text } from '@mantine/core';
import { useAppStore } from '@/stores/app/appStore';
import { useBudgetsStore } from '@/stores/budgets/budgetsStore';
import BudgetGrid from './_components/BudgetGrid';

export default function BudgetsPage() {
  const year = useAppStore((state) => state.year);
  const userId = useAppStore((state) => state.userId);
  const getAll = useBudgetsStore((state) => state.getAll);
  const saveAll = useBudgetsStore((state) => state.saveAll);
  const loading = useBudgetsStore((state) => state.loading);
  const dirty = useBudgetsStore((state) => state.dirty);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (userId) {
      getAll(year);
    }
  }, [userId, year, getAll]);

  const handleSave = async () => {
    setIsSaving(true);
    await saveAll();
    setIsSaving(false);
  };

  const yearOptions = Array.from({ length: 10 }, (_, i) => ({
    value: String(new Date().getFullYear() - i),
    label: String(new Date().getFullYear() - i),
  }));

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="center">
        <Text size="lg" fw={700}>
          Budgetter
        </Text>
        <Group gap="xs">
          <Select
            placeholder="Vælg år"
            data={yearOptions}
            value={String(year)}
            onChange={(val) => {
              if (val) {
                const appStore = useAppStore.getState();
                appStore.setYear(parseInt(val));
              }
            }}
            style={{ width: '150px' }}
          />
        </Group>
      </Group>

      <BudgetGrid />

      <Group justify="flex-end" gap="xs">
        <Button variant="default" disabled={dirty.size === 0 || isSaving}>
          Annuller
        </Button>
        <Button onClick={handleSave} loading={isSaving} disabled={dirty.size === 0}>
          Gem ({dirty.size})
        </Button>
      </Group>
    </Stack>
  );
}
