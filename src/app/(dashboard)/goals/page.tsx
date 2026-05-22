'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconPlus, IconTarget } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  Button,
  Center,
  Group,
  Loader,
  Select,
  SimpleGrid,
  Stack,
  Text,
  Title,
} from '@mantine/core';
import { getAllTransactions } from '@/service/database/transactions/getAll';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { resolveGoalForMonth, useGoalsStore } from '@/stores/goals/goalsStore';
import GoalCard from './_components/GoalCard';
import GoalModal from './_components/GoalModal';

const MONTH_LABELS: Record<string, string> = {
  '01': 'Januar', '02': 'Februar', '03': 'Marts', '04': 'April',
  '05': 'Maj', '06': 'Juni', '07': 'Juli', '08': 'August',
  '09': 'September', '10': 'Oktober', '11': 'November', '12': 'December',
};

function buildMonthOptions() {
  const options = [];
  const now = new Date();
  for (let i = 0; i < 24; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = ym.split('-');
    options.push({ value: ym, label: `${MONTH_LABELS[m]} ${y}` });
  }
  return options;
}

const nowYM = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

/** Unique key for a (category, segment) slot */
const slotKey = (category_key: string, segment_key: string) => `${category_key}:${segment_key}`;

export default function GoalsPage() {
  const { categories, segments } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );
  const { goals, init, upsertGoal, removeGoal } = useGoalsStore(
    useShallow((s) => ({ goals: s.goals, init: s.init, upsertGoal: s.upsertGoal, removeGoal: s.removeGoal }))
  );

  const [month, setMonth] = useState<string>(nowYM());
  // spending map keyed by slotKey(category_key, segment_key)
  const [spendingMap, setSpendingMap] = useState<Record<string, number>>({});
  const [txLoading, setTxLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  // id of the goal being edited (null = adding new)
  const [editGoalId, setEditGoalId] = useState<string | null>(null);

  const monthOptions = useMemo(() => buildMonthOptions(), []);

  useEffect(() => { init(); }, [init]);

  useEffect(() => {
    if (!month) return;
    setTxLoading(true);
    const year = Number(month.split('-')[0]);
    getAllTransactions({ year }).then((result) => {
      if (!result.success) { setTxLoading(false); return; }
      // Build two spending buckets per category:
      // - one per segment_key (for goals scoped to a segment)
      // - one with '' (total, for goals scoped to all segments)
      const map: Record<string, number> = {};
      for (const tx of result.data) {
        if (tx.is_archived) continue;
        if (!tx.date.startsWith(month)) continue;
        if (tx.amount >= 0) continue;
        const catKey = tx.category_key ?? '';
        const segKey = tx.segment_key ?? '';
        const amt = Math.abs(tx.amount);
        // Specific segment bucket
        if (segKey) {
          const k = slotKey(catKey, segKey);
          map[k] = (map[k] ?? 0) + amt;
        }
        // All-segments bucket (segment_key = '')
        const allK = slotKey(catKey, '');
        map[allK] = (map[allK] ?? 0) + amt;
      }
      setSpendingMap(map);
      setTxLoading(false);
    });
  }, [month]);

  // Unique (category_key, segment_key) slots that have ever had a goal
  const trackedSlots = useMemo(() => {
    const seen = new Set<string>();
    const slots: { category_key: string; segment_key: string }[] = [];
    for (const g of goals) {
      const k = slotKey(g.category_key, g.segment_key);
      if (!seen.has(k)) {
        seen.add(k);
        slots.push({ category_key: g.category_key, segment_key: g.segment_key });
      }
    }
    return slots;
  }, [goals]);

  // Resolve the active goal for each slot in the selected month (may be null = no limit yet)
  const activeGoals = useMemo(
    () =>
      trackedSlots.map((slot) => ({
        slot,
        goal: resolveGoalForMonth(goals, slot.category_key, slot.segment_key, month),
      })),
    [trackedSlots, goals, month]
  );

  // History per slot
  const historyBySlot = useMemo(() => {
    const map: Record<string, typeof goals> = {};
    for (const g of goals) {
      const k = slotKey(g.category_key, g.segment_key);
      if (!map[k]) map[k] = [];
      map[k].push(g);
    }
    return map;
  }, [goals]);

  // For the edit modal: find a representative goal entry for the slot
  const editSlotGoal = editGoalId ? goals.find((g) => g.id === editGoalId) : null;
  const editValues = editSlotGoal
    ? {
        categoryKey: editSlotGoal.category_key,
        segmentKey: editSlotGoal.segment_key,
        name: editSlotGoal.name,
      }
    : null;

  // All history entries for the slot being edited
  const editHistory = editSlotGoal
    ? (historyBySlot[slotKey(editSlotGoal.category_key, editSlotGoal.segment_key)] ?? [])
    : [];

  const handleSave = async (values: {
    name: string;
    category_key: string;
    segment_key: string;
    amount_limit: number;
    effective_from: string;
  }) => {
    await upsertGoal(values);
  };

  return (
    <Stack gap="xl">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>Budgetmål</Title>
          <Text size="sm" c="dimmed">Sæt forbrugsgrænser per kategori og segment, og følg dit forbrug måned for måned</Text>
        </Stack>
        <Group gap="sm">
          <Select data={monthOptions} value={month} onChange={(v) => v && setMonth(v)} w={170} />
          <Button leftSection={<IconPlus size={16} />} variant="light" onClick={() => { setEditGoalId(null); setModalOpen(true); }}>
            Tilføj mål
          </Button>
        </Group>
      </Group>

      {txLoading ? (
        <Center h={200}><Loader size="sm" /></Center>
      ) : activeGoals.length === 0 ? (
        <Center h={200}>
          <Stack align="center" gap="xs">
            <IconTarget size={40} stroke={1} color="var(--mantine-color-gray-5)" />
            <Text c="dimmed" size="sm">Ingen budgetmål endnu. Tilføj dit første mål.</Text>
          </Stack>
        </Center>
      ) : (
        <SimpleGrid cols={{ base: 1, sm: 2, md: 3 }} spacing="md">
          {activeGoals.map(({ slot, goal }) => {
            const cat = categories.find((c) => c.key === slot.category_key);
            if (!cat) return null;
            const seg = slot.segment_key
              ? segments.find((s) => s.key === slot.segment_key && s.category_key === slot.category_key)
              : null;
            const k = slotKey(slot.category_key, slot.segment_key);
            const slotHistory = historyBySlot[k] ?? [];
            // Use the most recent entry id for edit targeting
            const repId = slotHistory.length > 0
              ? slotHistory.reduce((a, b) => a.effective_from > b.effective_from ? a : b).id
              : null;

            return (
              <GoalCard
                key={k}
                name={goal?.name ?? slotHistory[0]?.name ?? ''}
                categoryLabel={cat.label}
                categoryColor={cat.color}
                categoryIcon={cat.icon}
                segmentLabel={seg?.label ?? null}
                amountLimit={goal?.amount_limit ?? null}
                effectiveFrom={goal?.effective_from ?? null}
                spent={spendingMap[k] ?? 0}
                onEdit={() => { if (repId) setEditGoalId(repId); setModalOpen(true); }}
                onDelete={() => slotHistory.forEach((e) => removeGoal(e.id))}
              />
            );
          })}
        </SimpleGrid>
      )}

      <GoalModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        categories={categories}
        segments={segments}
        editValues={editValues}
        history={editHistory}
        currentMonth={month}
        onSave={handleSave}
      />
    </Stack>
  );
}
