'use client';

import { useMemo, useState } from 'react';
import { IconArrowLeft, IconCheck } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  Alert,
  Badge,
  Button,
  Checkbox,
  Divider,
  Group,
  Modal,
  NumberInput,
  ScrollArea,
  Select,
  Stack,
  Text,
  TextInput,
} from '@mantine/core';
import { showSuccessNotification } from '@/notifications/feedback';
import type { TSubscriptionMatcher } from '@/service/database/subscriptions/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { formatDate } from '@/utilities';

function longestCommonPrefix(strs: string[]): string {
  if (strs.length === 0) return '';
  let prefix = strs[0];
  for (let i = 1; i < strs.length; i++) {
    while (!strs[i].toLowerCase().startsWith(prefix.toLowerCase())) {
      prefix = prefix.slice(0, -1);
      if (!prefix) return '';
    }
  }
  return prefix.trim();
}

function detectPattern(selected: TTransaction[]): {
  matcherType: TSubscriptionMatcher['matcher_type'];
  matcherValue: string;
  name: string;
  avgAmount: number;
  tolerance: number;
} {
  const amounts = selected.map((t) => Math.abs(t.amount));
  const avg = amounts.reduce((s, v) => s + v, 0) / amounts.length;
  const stdDev =
    amounts.length > 1
      ? Math.sqrt(amounts.reduce((s, v) => s + (v - avg) ** 2, 0) / amounts.length)
      : 0;
  // Initial tolerance: whichever is larger — 15% or 2×stdDev expressed as %
  const tolerance = Math.round(Math.max(15, avg > 0 ? ((stdDev * 2) / avg) * 100 : 15));

  const companies = [...new Set(selected.map((t) => t.company_name).filter(Boolean))];
  if (companies.length === 1) {
    return {
      matcherType: 'company',
      matcherValue: companies[0]!,
      name: companies[0]!,
      avgAmount: avg,
      tolerance,
    };
  }
  const descriptions = selected.map((t) => t.description ?? '');
  const prefix = longestCommonPrefix(descriptions);
  const name = selected[0].company_name ?? (prefix ? prefix : (selected[0].description ?? ''));
  return {
    matcherType: 'description_prefix',
    matcherValue: prefix,
    name,
    avgAmount: avg,
    tolerance,
  };
}

function textMatchesTxn(
  t: TTransaction,
  matcherType: TSubscriptionMatcher['matcher_type'],
  matcherValue: string
): boolean {
  if (!matcherValue) return false;
  const val = matcherValue.toLowerCase();
  const desc = (t.description ?? '').toLowerCase();
  const raw = (t.raw_description ?? '').toLowerCase();
  switch (matcherType) {
    case 'company':
      return (t.company_name ?? '').toLowerCase() === val;
    case 'description_prefix':
      return desc.startsWith(val) || raw.startsWith(val);
    case 'description_contains':
      return desc.includes(val) || raw.includes(val);
  }
}

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

type TProps = { opened: boolean; onClose: () => void };

const MATCHER_TYPE_OPTIONS = [
  { value: 'company', label: 'Virksomhedsnavn' },
  { value: 'description_prefix', label: 'Beskrivelse starter med' },
  { value: 'description_contains', label: 'Beskrivelse indeholder' },
];

export default function AddMatcherModal({ opened, onClose }: TProps) {
  const addMatcher = useSubscriptionsStore((s) => s.addMatcher);
  const transactions = useTransactionsStore(useShallow((s) => s.transactions));

  const [step, setStep] = useState<'pick' | 'review'>('pick');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [name, setName] = useState('');
  const [matcherType, setMatcherType] = useState<TSubscriptionMatcher['matcher_type']>('company');
  const [matcherValue, setMatcherValue] = useState('');
  const [avgAmount, setAvgAmount] = useState<number>(0);
  const [tolerance, setTolerance] = useState<number>(15);

  // Derive absolute range from avg + tolerance %
  const computedMin =
    avgAmount > 0 ? Math.max(0, Math.round(avgAmount * (1 - tolerance / 100))) : null;
  const computedMax = avgAmount > 0 ? Math.round(avgAmount * (1 + tolerance / 100)) : null;
  const [saving, setSaving] = useState(false);

  const candidates = useMemo(
    () =>
      transactions.filter(
        (t) =>
          !t.is_archived &&
          t.amount < 0 &&
          (search === '' ||
            (t.description ?? '').toLowerCase().includes(search.toLowerCase()) ||
            (t.company_name ?? '').toLowerCase().includes(search.toLowerCase()))
      ),
    [transactions, search]
  );

  const selectedTxns = useMemo(
    () => transactions.filter((t) => selectedIds.has(t.id)),
    [transactions, selectedIds]
  );

  // All non-archived transactions matching the text pattern
  const textMatchedTxns = useMemo(
    () =>
      transactions.filter(
        (t) => !t.is_archived && t.amount < 0 && textMatchesTxn(t, matcherType, matcherValue)
      ),
    [transactions, matcherType, matcherValue]
  );

  // Split into included (within amount range) vs excluded (outside)
  const { included, excluded } = useMemo(() => {
    const inc: TTransaction[] = [];
    const exc: TTransaction[] = [];
    for (const t of textMatchedTxns) {
      const abs = Math.abs(t.amount);
      const inRange =
        (computedMin == null || abs >= computedMin) && (computedMax == null || abs <= computedMax);
      if (inRange) inc.push(t);
      else exc.push(t);
    }
    return { included: inc, excluded: exc };
  }, [textMatchedTxns, computedMin, computedMax]);

  const toggleId = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const handleAnalyse = () => {
    const pattern = detectPattern(selectedTxns);
    setMatcherType(pattern.matcherType);
    setMatcherValue(pattern.matcherValue);
    setName(pattern.name);
    setAvgAmount(pattern.avgAmount);
    setTolerance(pattern.tolerance);
    setStep('review');
  };

  const handleSave = async () => {
    if (!name.trim() || !matcherValue.trim()) return;
    setSaving(true);
    const result = await addMatcher(
      name.trim(),
      matcherType,
      matcherValue.trim(),
      computedMin,
      computedMax
    );
    setSaving(false);
    if (result) {
      showSuccessNotification({ title: 'Tilføjet', message: `${name} er tilføjet som abonnement` });
      handleClose();
    }
  };

  const handleClose = () => {
    setStep('pick');
    setSearch('');
    setSelectedIds(new Set());
    setName('');
    setMatcherValue('');
    setMatcherType('company');
    setAvgAmount(0);
    setTolerance(15);
    onClose();
  };

  return (
    <Modal
      opened={opened}
      onClose={handleClose}
      title={step === 'pick' ? 'Vælg transaktioner' : 'Gennemse abonnement'}
      size="lg"
    >
      {step === 'pick' ? (
        <Stack gap="sm">
          <TextInput
            placeholder="Søg på beskrivelse eller virksomhed..."
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            autoFocus
          />
          <ScrollArea h={360}>
            <Stack gap={4}>
              {candidates.slice(0, 100).map((t) => (
                <Group
                  key={t.id}
                  px="sm"
                  py={8}
                  gap="sm"
                  wrap="nowrap"
                  style={{
                    borderRadius: 6,
                    cursor: 'pointer',
                    background: selectedIds.has(t.id)
                      ? 'var(--mantine-color-violet-0)'
                      : 'var(--mantine-color-default-hover)',
                    border: selectedIds.has(t.id)
                      ? '1px solid var(--mantine-color-violet-3)'
                      : '1px solid transparent',
                  }}
                  onClick={() => toggleId(t.id)}
                >
                  <Checkbox
                    checked={selectedIds.has(t.id)}
                    onChange={() => toggleId(t.id)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <Stack gap={1} style={{ flex: 1, minWidth: 0 }}>
                    <Text size="sm" fw={500} truncate>
                      {t.company_name ?? t.description}
                    </Text>
                    <Text size="xs" c="dimmed" truncate>
                      {formatDate(t.date)} · {t.description}
                    </Text>
                  </Stack>
                  <Text size="sm" fw={600} c="red.6" style={{ flexShrink: 0 }}>
                    {formatDKK(t.amount)}
                  </Text>
                </Group>
              ))}
              {candidates.length === 0 && (
                <Text size="sm" c="dimmed" ta="center" py="xl">
                  Ingen transaktioner fundet
                </Text>
              )}
            </Stack>
          </ScrollArea>
          <Group justify="space-between" align="center">
            <Text size="xs" c="dimmed">
              {selectedIds.size > 0
                ? `${selectedIds.size} valgt`
                : 'Vælg én eller flere transaktioner'}
            </Text>
            <Button
              leftSection={<IconCheck size={16} />}
              disabled={selectedIds.size === 0}
              onClick={handleAnalyse}
            >
              Analyser
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="sm">
          <TextInput label="Navn" value={name} onChange={(e) => setName(e.currentTarget.value)} />
          <Group grow>
            <Select
              label="Matchtype"
              data={MATCHER_TYPE_OPTIONS}
              value={matcherType}
              onChange={(v) =>
                setMatcherType((v as TSubscriptionMatcher['matcher_type']) ?? 'company')
              }
            />
            <TextInput
              label="Matchværdi"
              value={matcherValue}
              onChange={(e) => setMatcherValue(e.currentTarget.value)}
            />
          </Group>

          {/* Amount tolerance filter */}
          <Group align="flex-end">
            <NumberInput
              label="Beløbstolerance"
              description="Tilladt afvigelse fra gennemsnit"
              value={tolerance}
              onChange={(v) =>
                setTolerance(typeof v === 'number' ? Math.max(1, Math.min(v, 200)) : 15)
              }
              min={1}
              max={200}
              suffix=" %"
              style={{ width: 180 }}
            />
            {avgAmount > 0 && (
              <Text size="xs" c="dimmed" pb={6}>
                {formatDKK(computedMin ?? 0)} – {formatDKK(computedMax ?? 0)}
              </Text>
            )}
          </Group>

          {excluded.length > 0 && (
            <Alert color="orange" variant="light" p="xs">
              <Text size="xs" fw={500}>
                {excluded.length} transaktion{excluded.length > 1 ? 'er' : ''} fra samme kilde
                udelukkes af beløbsgrænsen — f.eks. engangskøb eller andre betalinger.
              </Text>
            </Alert>
          )}

          {/* Included transactions */}
          <Divider
            label={
              <Group gap={6}>
                <Text size="xs" fw={600}>
                  Inkluderet
                </Text>
                <Badge variant="light" color="teal" size="xs" radius="sm">
                  {included.length}
                </Badge>
              </Group>
            }
            labelPosition="left"
          />
          <ScrollArea h={160}>
            <Stack gap={4}>
              {included.map((t) => (
                <Group
                  key={t.id}
                  px="sm"
                  py={6}
                  justify="space-between"
                  wrap="nowrap"
                  style={{
                    borderRadius: 6,
                    background: 'var(--mantine-color-teal-0)',
                    border: '1px solid var(--mantine-color-teal-2)',
                  }}
                >
                  <Stack gap={0} style={{ minWidth: 0 }}>
                    <Text size="xs" fw={500} truncate>
                      {t.company_name ?? t.description}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {formatDate(t.date)} · {t.description}
                    </Text>
                  </Stack>
                  <Text size="xs" fw={600} c="teal.7" style={{ flexShrink: 0 }}>
                    {formatDKK(t.amount)}
                  </Text>
                </Group>
              ))}
              {included.length === 0 && (
                <Text size="xs" c="dimmed" ta="center" py="sm">
                  Ingen matchende transaktioner
                </Text>
              )}
            </Stack>
          </ScrollArea>

          {/* Excluded transactions */}
          {excluded.length > 0 && (
            <>
              <Divider
                label={
                  <Group gap={6}>
                    <Text size="xs" fw={600}>
                      Udelukket
                    </Text>
                    <Badge variant="light" color="orange" size="xs" radius="sm">
                      {excluded.length}
                    </Badge>
                  </Group>
                }
                labelPosition="left"
              />
              <ScrollArea h={100}>
                <Stack gap={4}>
                  {excluded.map((t) => (
                    <Group
                      key={t.id}
                      px="sm"
                      py={6}
                      justify="space-between"
                      wrap="nowrap"
                      style={{
                        borderRadius: 6,
                        background: 'var(--mantine-color-orange-0)',
                        border: '1px solid var(--mantine-color-orange-2)',
                      }}
                    >
                      <Stack gap={0} style={{ minWidth: 0 }}>
                        <Text size="xs" fw={500} truncate>
                          {t.company_name ?? t.description}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {formatDate(t.date)} · {t.description}
                        </Text>
                      </Stack>
                      <Text size="xs" fw={600} c="orange.7" style={{ flexShrink: 0 }}>
                        {formatDKK(t.amount)}
                      </Text>
                    </Group>
                  ))}
                </Stack>
              </ScrollArea>
            </>
          )}

          <Group justify="space-between">
            <Button
              variant="subtle"
              leftSection={<IconArrowLeft size={16} />}
              onClick={() => setStep('pick')}
            >
              Tilbage
            </Button>
            <Button
              onClick={handleSave}
              loading={saving}
              disabled={!name.trim() || !matcherValue.trim() || included.length === 0}
            >
              Tilføj abonnement
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}
