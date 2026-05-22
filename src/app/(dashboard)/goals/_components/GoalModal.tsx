'use client';

import { useEffect, useMemo, useState } from 'react';
import { Badge, Box, Button, Divider, Group, Loader, Modal, NumberInput, Select, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import type { TCategory } from '@/service/database/categories/getAll';
import { getAllTransactions } from '@/service/database/transactions/getAll';
import type { TGoal } from '@/service/database/goals/getAll';
import type { TSegment } from '@/service/database/segments/getAll';

const MONTH_LABELS: Record<string, string> = {
  '01': 'januar', '02': 'februar', '03': 'marts', '04': 'april',
  '05': 'maj', '06': 'juni', '07': 'juli', '08': 'august',
  '09': 'september', '10': 'oktober', '11': 'november', '12': 'december',
};

function buildMonthOptions(count = 24) {
  const options = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const [y, m] = ym.split('-');
    options.push({ value: ym, label: `${MONTH_LABELS[m]} ${y}` });
  }
  return options;
}

function formatHistoryDate(dateStr: string) {
  const [y, m] = dateStr.split('-');
  return `${MONTH_LABELS[m]} ${y}`;
}

type TEditValues = {
  categoryKey: string;
  segmentKey: string;
  name: string;
  amountLimit?: number;
};

type TGoalModalProps = {
  opened: boolean;
  onClose: () => void;
  categories: TCategory[];
  segments: TSegment[];
  editValues?: TEditValues | null;
  /** All historical goal entries for the slot being edited */
  history?: TGoal[];
  currentMonth: string;
  onSave: (values: { name: string; category_key: string; segment_key: string; amount_limit: number; effective_from: string }) => void;
};

export default function GoalModal({
  opened,
  onClose,
  categories,
  segments,
  editValues,
  history = [],
  currentMonth,
  onSave,
}: TGoalModalProps) {
  const monthOptions = useMemo(() => buildMonthOptions(), []);

  const [name, setName] = useState(editValues?.name ?? '');
  const [categoryKey, setCategoryKey] = useState<string | null>(editValues?.categoryKey ?? null);
  const [segmentKey, setSegmentKey] = useState<string>(editValues?.segmentKey ?? '');
  const [amountLimit, setAmountLimit] = useState<number | string>(editValues?.amountLimit ?? '');
  const [effectiveFrom, setEffectiveFrom] = useState<string>(currentMonth);
  const [avgLoading, setAvgLoading] = useState(false);
  const [monthlyAvgs, setMonthlyAvgs] = useState<{ month: string; total: number }[]>([]);

  useEffect(() => {
    if (opened) {
      setName(editValues?.name ?? '');
      setCategoryKey(editValues?.categoryKey ?? null);
      setSegmentKey(editValues?.segmentKey ?? '');
      setAmountLimit(editValues?.amountLimit ?? '');
      setEffectiveFrom(currentMonth);
    }
  }, [opened, editValues, currentMonth]);

  // Fetch average spending whenever category or segment changes, or modal reopens
  useEffect(() => {
    if (!opened || !categoryKey) { setMonthlyAvgs([]); return; }
    setAvgLoading(true);
    getAllTransactions({}).then((result) => {
      if (!result.success) { setAvgLoading(false); return; }
      const counts: Record<string, number> = {};
      for (const tx of result.data) {
        if (tx.is_archived || tx.amount >= 0) continue;
        if (tx.category_key !== categoryKey) continue;
        if (segmentKey && tx.segment_key !== segmentKey) continue;
        const ym = tx.date.slice(0, 7);
        counts[ym] = (counts[ym] ?? 0) + Math.abs(tx.amount);
      }
      // Only include months with at least some spending, last 6 months max
      const sorted = Object.entries(counts)
        .sort(([a], [b]) => b.localeCompare(a))
        .slice(0, 6)
        .map(([month, total]) => ({ month, total }));
      setMonthlyAvgs(sorted);
      setAvgLoading(false);
    });
  }, [opened, categoryKey, segmentKey]);

  const isEdit = !!editValues;

  const avg = useMemo(() => {
    if (monthlyAvgs.length === 0) return null;
    return monthlyAvgs.reduce((s, e) => s + e.total, 0) / monthlyAvgs.length;
  }, [monthlyAvgs]);

  const formatDKK = (n: number) =>
    new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(n);

  const MONTH_SHORT: Record<string, string> = {
    '01': 'jan', '02': 'feb', '03': 'mar', '04': 'apr', '05': 'maj', '06': 'jun',
    '07': 'jul', '08': 'aug', '09': 'sep', '10': 'okt', '11': 'nov', '12': 'dec',
  };

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.label }));

  // Segments for the selected category, plus "Alle segmenter" as first option
  const segmentOptions = [
    { value: '', label: 'Alle segmenter' },
    ...segments
      .filter((s) => s.category_key === categoryKey)
      .map((s) => ({ value: s.key, label: s.label })),
  ];

  // Reset segment when category changes (only when adding new)
  const handleCategoryChange = (val: string | null) => {
    setCategoryKey(val);
    if (!isEdit) setSegmentKey('');
  };

  const handleSave = () => {
    if (!categoryKey || !name.trim() || !amountLimit) return;
    onSave({
      name: name.trim(),
      category_key: categoryKey,
      segment_key: segmentKey,
      amount_limit: Number(amountLimit),
      effective_from: `${effectiveFrom}-01`,
    });
    onClose();
  };

  const historySorted = [...history].sort((a, b) => b.effective_from.localeCompare(a.effective_from));

  const formatDKKh = (n: number) =>
    new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK', maximumFractionDigits: 0 }).format(n);

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Text fw={700}>{isEdit ? 'Rediger budgetmål' : 'Tilføj budgetmål'}</Text>}
      size="sm"
    >
      <Stack gap="md">
        <TextInput
          label="Navn"
          placeholder="f.eks. Dagligvarer"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
        />
        <Select
          label="Kategori"
          placeholder="Vælg kategori"
          data={categoryOptions}
          value={categoryKey}
          onChange={handleCategoryChange}
          disabled={isEdit}
          searchable
        />
        <Select
          label="Segment"
          data={segmentOptions}
          value={segmentKey}
          onChange={(v) => setSegmentKey(v ?? '')}
          disabled={isEdit || !categoryKey}
        />
        <NumberInput
          label="Månedligt loft (DKK)"
          placeholder="f.eks. 3000"
          value={amountLimit}
          onChange={setAmountLimit}
          min={1}
          allowNegative={false}
          thousandSeparator="."
          decimalSeparator=","
        />
        <Select
          label="Gælder fra"
          data={monthOptions}
          value={effectiveFrom}
          onChange={(v) => v && setEffectiveFrom(v)}
        />
        {categoryKey && (
          <Box
            p="sm"
            style={{
              background: 'var(--mantine-color-gray-0)',
              border: '1px solid var(--mantine-color-gray-2)',
              borderRadius: 8,
            }}
          >
            <Group justify="space-between" mb="sm">
              <Text size="xs" c="dimmed">Gns. forbrug · seneste {monthlyAvgs.length || '…'} md.</Text>
              {avgLoading ? (
                <Loader size="xs" />
              ) : avg !== null ? (
                <Text size="sm" fw={700}>{formatDKK(avg)}</Text>
              ) : null}
            </Group>

            {avgLoading ? null : monthlyAvgs.length === 0 ? (
              <Text size="xs" c="dimmed">Ingen historik for dette valg</Text>
            ) : (
              (() => {
                const ordered = [...monthlyAvgs].reverse();
                const maxVal = Math.max(...ordered.map((e) => e.total));
                const MAX_BAR_PX = 36;
                return (
                  <Group gap={6} align="flex-end">
                    {ordered.map(({ month, total }) => {
                      const heightPx = maxVal > 0 ? Math.max(4, (total / maxVal) * MAX_BAR_PX) : 4;
                      const isMax = total === maxVal;
                      return (
                        <Tooltip
                          key={month}
                          label={formatDKK(total)}
                          withArrow
                          position="top"
                          fz="xs"
                        >
                          <Stack gap={4} align="center" style={{ flex: 1, cursor: 'default' }}>
                            <Box
                              style={{
                                width: '100%',
                                height: heightPx,
                                background: isMax
                                  ? 'var(--mantine-color-violet-5)'
                                  : 'var(--mantine-color-gray-3)',
                                borderRadius: 3,
                                transition: 'background 0.15s',
                              }}
                            />
                            <Text size="xs" c="dimmed" style={{ lineHeight: 1 }}>
                              {MONTH_SHORT[month.slice(5)]}
                            </Text>
                          </Stack>
                        </Tooltip>
                      );
                    })}
                  </Group>
                );
              })()
            )}
          </Box>
        )}

        {isEdit && historySorted.length > 0 && (
          <>
            <Divider label="Tidligere lofter" labelPosition="left" />
            <Stack gap={6}>
              {historySorted.map((entry) => (
                <Group key={entry.id} justify="space-between">
                  <Text size="xs" c="dimmed">{formatHistoryDate(entry.effective_from)}</Text>
                  <Badge variant="light" color="gray" radius="sm" size="sm">
                    {formatDKKh(entry.amount_limit)}
                  </Badge>
                </Group>
              ))}
            </Stack>
          </>
        )}

        <Group justify="flex-end" pt="xs">
          <Button variant="default" onClick={onClose}>Annuller</Button>
          <Button onClick={handleSave} disabled={!categoryKey || !name.trim() || !amountLimit}>
            Gem
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
