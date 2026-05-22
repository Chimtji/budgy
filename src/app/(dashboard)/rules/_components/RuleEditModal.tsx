'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  ScrollArea,
  Select,
  Stack,
  TagsInput,
  Text,
} from '@mantine/core';
import { matchesPattern, parsePatternGroups } from '@/service/categorization/engine';
import type { TRuleRow } from '@/service/database/rules/getAll';
import { formatDate } from '@/utilities';
import CompanyLogo from '../../companies/_components/CompanyLogo';

type TCategory = { key: string; label: string; color: string };
type TSegment = { key: string; category_key: string; label: string };
type TCompany = { id: string; name: string; domain: string | null };
type TTransaction = {
  id: string;
  date: string;
  amount: number;
  description: string;
  raw_description: string;
  recipient: string;
};

type TProps = {
  rule?: TRuleRow;
  categories: TCategory[];
  segments: TSegment[];
  companies: TCompany[];
  transactions: TTransaction[];
  onSave: (
    id: string,
    pattern: string,
    category_key: string,
    segment_key: string,
    company_id: string | null
  ) => Promise<void>;
  onClose: () => void;
};

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(n);

const RuleEditModal: React.FC<TProps> = ({
  rule,
  categories,
  segments,
  companies,
  transactions,
  onSave,
  onClose,
}) => {
  const [groups, setGroups] = useState<string[][]>(() => parsePatternGroups(rule?.pattern ?? ''));
  const [categoryKey, setCategoryKey] = useState(rule?.category_key ?? '');
  const [segmentKey, setSegmentKey] = useState(rule?.segment_key ?? '');
  const [companyId, setCompanyId] = useState<string | null>(rule?.company_id ?? null);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    setGroups(parsePatternGroups(rule?.pattern ?? ''));
    setCategoryKey(rule?.category_key ?? '');
    setSegmentKey(rule?.segment_key ?? '');
    setCompanyId(rule?.company_id ?? null);
  }, [rule]);

  const serializedPattern = groups
    .filter((g) => g.length > 0)
    .map((g) => g.join(','))
    .join('|');

  const addGroup = () => setGroups((prev) => [...prev, []]);
  const removeGroup = (i: number) =>
    setGroups((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : [[]]));
  const updateGroup = (i: number, tags: string[]) =>
    setGroups((prev) => prev.map((g, idx) => (idx === i ? tags.map((t) => t.toLowerCase()) : g)));

  const matching = useMemo(() => {
    setSelectedId(null);
    if (!serializedPattern.trim()) return transactions.slice(0, 50);
    return transactions.filter((t) =>
      matchesPattern(serializedPattern, `${t.description} ${t.recipient}`)
    );
  }, [transactions, serializedPattern]);

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.label }));
  const segmentOptions = segments
    .filter((s) => s.category_key === categoryKey)
    .map((s) => ({ value: s.key, label: s.label }));
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const handleSave = async () => {
    if (!serializedPattern) return;
    setSaving(true);
    await onSave(rule?.id ?? '', serializedPattern, categoryKey, segmentKey, companyId);
    setSaving(false);
  };

  const canSave = !!serializedPattern && !!categoryKey && categoryKey !== 'uncategorized';

  return (
    <Modal opened onClose={onClose} title={rule ? 'Rediger regel' : 'Ny regel'} size="xl">
      <Group align="flex-start" gap="xl" wrap="nowrap">
        <Stack gap="md" style={{ flex: '0 0 300px' }}>
          <Stack gap={0}>
            <Text size="sm" fw={500} mb={4}>
              Mønstre
            </Text>
            <Text size="xs" c="dimmed" mb="xs">
              Grupper er ELLER-betingelser. Ord inden for en gruppe skal alle matche (OG).
            </Text>
            {groups.map((group, gi) => (
              <Stack key={gi} gap={4}>
                {gi > 0 && (
                  <Group gap={6} my={4}>
                    <Divider style={{ flex: 1 }} />
                    <Badge variant="outline" color="blue" size="xs" radius="sm">
                      ELLER
                    </Badge>
                    <Divider style={{ flex: 1 }} />
                  </Group>
                )}
                <Group gap="xs" align="flex-end" wrap="nowrap">
                  <TagsInput
                    placeholder="Tilføj ord og tryk Enter"
                    value={group}
                    onChange={(v) => updateGroup(gi, v)}
                    splitChars={[',']}
                    description={gi === 0 ? 'Alle ord skal matche (OG)' : undefined}
                    style={{ flex: 1 }}
                  />
                  <Button
                    variant="subtle"
                    color="red"
                    size="xs"
                    px={6}
                    mb={1}
                    onClick={() => removeGroup(gi)}
                  >
                    <IconMinus size={14} />
                  </Button>
                </Group>
              </Stack>
            ))}
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconPlus size={12} />}
              mt="xs"
              onClick={addGroup}
            >
              Tilføj ELLER-gruppe
            </Button>
          </Stack>
          <Select
            label="Kategori"
            data={categoryOptions}
            value={categoryKey === 'uncategorized' ? null : categoryKey}
            onChange={(v) => {
              setCategoryKey(v ?? 'uncategorized');
              setSegmentKey('uncategorized');
            }}
            searchable
            clearable
          />
          <Select
            label="Segment"
            data={segmentOptions}
            value={segmentKey === 'uncategorized' ? null : segmentKey}
            onChange={(v) => setSegmentKey(v ?? 'uncategorized')}
            searchable
            clearable
            disabled={!categoryKey || categoryKey === 'uncategorized'}
          />
          <Select
            label="Virksomhed"
            data={companyOptions}
            value={companyId}
            onChange={setCompanyId}
            searchable
            clearable
            placeholder="Ingen (valgfrit)"
            renderOption={({ option }) => {
              const co = companies.find((c) => c.id === option.value);
              return (
                <Group gap="sm">
                  <CompanyLogo domain={co?.domain ?? null} name={option.label} size={18} />
                  <Text size="sm">{option.label}</Text>
                </Group>
              );
            }}
          />
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Annuller
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!canSave}>
              Gem
            </Button>
          </Group>
        </Stack>

        <Divider orientation="vertical" />

        <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
          <Text size="sm" fw={500}>
            {serializedPattern
              ? `${matching.length} matchende transaktioner`
              : 'Seneste transaktioner'}
          </Text>
          <ScrollArea h={360}>
            <Stack gap={4}>
              {matching.length === 0 && (
                <Text size="sm" c="dimmed">
                  Ingen transaktioner matcher de angivne mønstre.
                </Text>
              )}
              {matching.map((t) => {
                const isSelected = selectedId === t.id;
                return (
                  <Stack
                    key={t.id}
                    gap={2}
                    p="xs"
                    onClick={() => setSelectedId(isSelected ? null : t.id)}
                    style={{
                      borderRadius: 6,
                      background: isSelected
                        ? 'var(--mantine-color-blue-light)'
                        : 'var(--mantine-color-default-hover)',
                      cursor: 'pointer',
                    }}
                  >
                    <Group justify="space-between" wrap="nowrap">
                      <Text size="xs" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                        {formatDate(t.date)}
                      </Text>
                      <Text
                        size="xs"
                        fw={600}
                        c={t.amount < 0 ? 'red.6' : 'teal.6'}
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {formatDKK(t.amount)}
                      </Text>
                    </Group>
                    {t.recipient && (
                      <Text size="xs" fw={500}>
                        {t.recipient}
                      </Text>
                    )}
                    <Text size="xs" c="dimmed" style={{ wordBreak: 'break-word' }}>
                      {t.description}
                    </Text>
                    {isSelected && t.raw_description !== t.description && (
                      <>
                        <Divider my={4} />
                        <Stack gap={2}>
                          <Text size="xs" c="dimmed">
                            Rå beskrivelse
                          </Text>
                          <Text size="xs" style={{ wordBreak: 'break-word' }}>
                            {t.raw_description}
                          </Text>
                        </Stack>
                      </>
                    )}
                  </Stack>
                );
              })}
            </Stack>
          </ScrollArea>
        </Stack>
      </Group>
    </Modal>
  );
};

export default RuleEditModal;
