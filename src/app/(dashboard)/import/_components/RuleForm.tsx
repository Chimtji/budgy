'use client';

import { useState } from 'react';
import { IconMinus, IconPlus } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Divider,
  Group,
  Modal,
  Select,
  Stack,
  TagsInput,
  Text,
  TextInput,
} from '@mantine/core';
import { showErrorNotification } from '@/notifications/feedback';
import { parsePatternGroups } from '@/service/categorization/engine';
import { upsertRule } from '@/service/database/rules/upsert';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import CompanyLogo from '../../companies/_components/CompanyLogo';
import RuleTransactionList from './RuleTransactionList';

type TCategory = { key: string; label: string; color: string; icon: string; description: string };
type TSegment = { key: string; category_key: string; label: string; description: string };
type TCompany = { id: string; name: string; domain: string | null };
type TParsedRow = { date: string; amount: number; description: string; recipient: string };

type TResult = {
  category_key: string;
  segment_key: string;
  company_id: string | null;
  pattern: string;
};

type TProps = {
  initialPattern: string;
  initialCategoryKey?: string;
  initialSegmentKey?: string;
  categories: TCategory[];
  segments: TSegment[];
  companies: TCompany[];
  rows: TParsedRow[];
  defaultRows?: TParsedRow[];
  onSave: (result: TResult) => void;
  onClose: () => void;
};

const RuleForm: React.FC<TProps> = ({
  initialPattern,
  initialCategoryKey = '',
  initialSegmentKey = '',
  categories,
  segments,
  companies,
  rows,
  defaultRows,
  onSave,
  onClose,
}) => {
  const [groups, setGroups] = useState<string[][]>(() =>
    initialPattern ? parsePatternGroups(initialPattern) : [[]]
  );
  const [categoryKey, setCategoryKey] = useState(
    initialCategoryKey === 'uncategorized' ? '' : initialCategoryKey
  );
  const [segmentKey, setSegmentKey] = useState(
    initialSegmentKey === 'uncategorized' ? '' : initialSegmentKey
  );
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDomain, setNewDomain] = useState('');
  const [saving, setSaving] = useState(false);

  const addCompany = useCompaniesStore((s) => s.addCompany);

  const serializedPattern = groups
    .filter((g) => g.length > 0)
    .map((g) => g.join(','))
    .join('|');

  const addGroup = () => setGroups((prev) => [...prev, []]);

  const removeGroup = (index: number) =>
    setGroups((prev) => (prev.length > 1 ? prev.filter((_, i) => i !== index) : [[]]));

  const updateGroup = (index: number, tags: string[]) =>
    setGroups((prev) => prev.map((g, i) => (i === index ? tags.map((t) => t.toLowerCase()) : g)));

  const segmentOptions = segments
    .filter((s) => s.category_key === categoryKey)
    .map((s) => ({ value: s.key, label: s.label }));
  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const handleNameChange = (value: string) => {
    setNewName(value);
    setNewDomain(value.trim().toLowerCase().replace(/\s+/g, '') + '.dk');
  };

  const handleSave = async () => {
    if (!serializedPattern || !categoryKey) return;
    setSaving(true);

    let resolvedCompanyId = companyId;
    if (showNew && newName.trim()) {
      const created = await addCompany(
        newName.trim(),
        newDomain.trim() || null,
        [],
        categoryKey || null,
        segmentKey || null
      );
      if (!created) {
        setSaving(false);
        return;
      }
      resolvedCompanyId = created.id;
    }

    const result = await upsertRule({
      pattern: serializedPattern,
      category_key: categoryKey,
      segment_key: segmentKey || 'uncategorized',
      company_id: resolvedCompanyId,
    });

    setSaving(false);
    if (!result.success) {
      showErrorNotification({ title: 'Fejl', message: 'Kunne ikke gemme regel' });
      return;
    }

    onSave({
      category_key: categoryKey,
      segment_key: segmentKey || 'uncategorized',
      company_id: resolvedCompanyId,
      pattern: serializedPattern,
    });
    onClose();
  };

  const canSave = serializedPattern.length > 0 && !!categoryKey;

  return (
    <Modal opened onClose={onClose} title="Opret regel" size="xl">
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
                    data-autofocus={gi === 0}
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
            data={categories.map((c) => ({ value: c.key, label: c.label }))}
            value={categoryKey || null}
            onChange={(v) => {
              setCategoryKey(v ?? '');
              setSegmentKey('');
            }}
            searchable
            clearable
            renderOption={({ option }) => {
              const cat = categories.find((c) => c.key === option.value);
              return (
                <Stack gap={0}>
                  <Text size="sm">{option.label}</Text>
                  {cat?.description && (
                    <Text size="xs" c="dimmed">
                      {cat.description}
                    </Text>
                  )}
                </Stack>
              );
            }}
          />
          <Select
            label="Segment"
            data={segmentOptions}
            value={segmentKey || null}
            onChange={(v) => setSegmentKey(v ?? '')}
            searchable
            clearable
            disabled={!categoryKey}
            renderOption={({ option }) => {
              const seg = segments.find((s) => s.key === option.value);
              return (
                <Stack gap={0}>
                  <Text size="sm">{option.label}</Text>
                  {seg?.description && (
                    <Text size="xs" c="dimmed">
                      {seg.description}
                    </Text>
                  )}
                </Stack>
              );
            }}
          />
          {!showNew ? (
            <Group align="flex-end" gap="xs">
              <Select
                label="Virksomhed"
                data={companyOptions}
                value={companyId}
                onChange={setCompanyId}
                searchable
                clearable
                style={{ flex: 1 }}
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
              <Button
                variant="subtle"
                size="xs"
                leftSection={<IconPlus size={12} />}
                onClick={() => setShowNew(true)}
                mb={1}
              >
                Ny
              </Button>
            </Group>
          ) : (
            <Stack gap="xs">
              <Group gap="xs" align="flex-end">
                <CompanyLogo domain={newDomain.trim() || null} name={newName || '?'} size={36} />
                <TextInput
                  label="Ny virksomhed"
                  placeholder="f.eks. Netto"
                  value={newName}
                  onChange={(e) => handleNameChange(e.currentTarget.value)}
                  style={{ flex: 1 }}
                />
                <Button
                  variant="subtle"
                  size="xs"
                  color="gray"
                  onClick={() => {
                    setShowNew(false);
                    setNewName('');
                  }}
                  mb={1}
                >
                  Annuller
                </Button>
              </Group>
              <TextInput
                label="Domæne"
                placeholder="f.eks. netto.com"
                value={newDomain}
                onChange={(e) => setNewDomain(e.currentTarget.value)}
                description="Bruges til virksomhedslogo (valgfrit)"
              />
            </Stack>
          )}
          <Group justify="flex-end" mt="xs">
            <Button variant="default" onClick={onClose}>
              Annuller
            </Button>
            <Button onClick={handleSave} loading={saving} disabled={!canSave}>
              Gem regel
            </Button>
          </Group>
        </Stack>

        <Divider orientation="vertical" />

        <RuleTransactionList pattern={serializedPattern} rows={rows} defaultRows={defaultRows} />
      </Group>
    </Modal>
  );
};

export default RuleForm;
