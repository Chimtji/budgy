'use client';

import { useMemo, useState } from 'react';
import { IconSparkles, IconX } from '@tabler/icons-react';
import { Badge, Button, Divider, Drawer, Group, Select, Stack, Text } from '@mantine/core';
import { matchesPattern } from '@/service/categorization/engine';
import { formatDate } from '@/utilities';
import CompanyLogo from '../../companies/_components/CompanyLogo';
import RuleForm from './RuleForm';

type TCategory = { key: string; label: string; color: string; icon: string; description: string };
type TSegment = { key: string; category_key: string; label: string; description: string };
type TCompany = { id: string; name: string; domain: string | null };
type TRule = {
  pattern: string;
  category_key: string;
  segment_key: string;
  match_count: number;
  company_id: string | null;
};
type TParsedRow = {
  date: string;
  amount: number;
  description: string;
  recipient: string;
  category_key: string;
  segment_key: string;
  company_id: string | null;
  balance: number | null;
  supp_text: string | null;
};

type TRuleResult = {
  category_key: string;
  segment_key: string;
  company_id: string | null;
  pattern: string;
};

type TProps = {
  row: TParsedRow | null;
  categories: TCategory[];
  segments: TSegment[];
  companies: TCompany[];
  rules: TRule[];
  allRows: TParsedRow[];
  onRuleSaved: (result: TRuleResult) => void;
  onUpdate: (category_key: string, segment_key: string, company_id: string | null) => void;
  onUnmatch: () => void;
  onClose: () => void;
};

const matchesRule = (rule: TRule, description: string, recipient: string): boolean =>
  matchesPattern(rule.pattern, `${description} ${recipient}`);

const formatDKK = (amount: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <Stack gap={2}>
    <Text size="xs" c="dimmed" fw={500} tt="uppercase" style={{ letterSpacing: '0.05em' }}>
      {label}
    </Text>
    {children}
  </Stack>
);

const ImportTransactionDrawer: React.FC<TProps> = ({
  row,
  categories,
  segments,
  companies,
  rules,
  allRows,
  onRuleSaved,
  onUpdate,
  onUnmatch,
  onClose,
}) => {
  const [showRuleForm, setShowRuleForm] = useState(false);
  const [editCategoryKey, setEditCategoryKey] = useState<string | null>(null);
  const [editSegmentKey, setEditSegmentKey] = useState<string | null>(null);
  const [editCompanyId, setEditCompanyId] = useState<string | null | undefined>(undefined);
  const category = row ? categories.find((c) => c.key === row.category_key) : undefined;
  const segment = row
    ? segments.find((s) => s.key === row.segment_key && s.category_key === row.category_key)
    : undefined;
  const company = row?.company_id ? companies.find((c) => c.id === row.company_id) : undefined;
  const matchingRules = useMemo(
    () => (row ? rules.filter((r) => matchesRule(r, row.description, row.recipient)) : []),
    [row, rules]
  );

  const suggestedPattern = row ? (row.recipient || row.description).trim().toLowerCase() : '';

  const isCategorized = row ? row.category_key !== 'uncategorized' : false;

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.label }));
  const segmentOptions = segments
    .filter((s) => s.category_key === (editCategoryKey ?? row?.category_key))
    .map((s) => ({ value: s.key, label: s.label }));

  const companyOptions = companies.map((c) => ({ value: c.id, label: c.name }));

  const handleCategoryChange = (value: string | null) => {
    setEditCategoryKey(value);
    setEditSegmentKey(null);
  };

  const handleSegmentChange = (value: string | null) => {
    setEditSegmentKey(value);
  };

  const handleSaveEdit = () => {
    const cat = editCategoryKey ?? row?.category_key ?? 'uncategorized';
    const seg = editSegmentKey ?? row?.segment_key ?? 'uncategorized';
    const comp = editCompanyId !== undefined ? editCompanyId : (row?.company_id ?? null);
    onUpdate(cat, seg, comp);
  };

  const hasUnsavedEdit =
    row &&
    ((editCategoryKey !== null && editCategoryKey !== row.category_key) ||
      (editSegmentKey !== null && editSegmentKey !== row.segment_key) ||
      (editCompanyId !== undefined && editCompanyId !== row.company_id));

  const handleRuleSaved = (result: TRuleResult) => {
    setShowRuleForm(false);
    onRuleSaved(result);
  };

  return (
    <>
      <Drawer
        opened={!!row}
        onClose={() => {
          setEditCategoryKey(null);
          setEditSegmentKey(null);
          setEditCompanyId(undefined);
          onClose();
        }}
        title="Transaktionsdetaljer"
        position="right"
        size="sm"
      >
        {row && (
          <Stack gap="lg">
            <Field label="Beløb">
              <Text fw={700} size="xl" c={row.amount < 0 ? 'red.6' : 'teal.6'}>
                {formatDKK(row.amount)}
              </Text>
            </Field>

            {row.balance !== null && (
              <Field label="Saldo efter">
                <Text size="sm" c="dimmed">
                  {formatDKK(row.balance)}
                </Text>
              </Field>
            )}

            <Divider />

            <Field label="Dato">
              <Text size="sm">{formatDate(row.date)}</Text>
            </Field>
            <Field label="Beskrivelse">
              <Text size="sm" style={{ wordBreak: 'break-word' }}>
                {row.description}
              </Text>
            </Field>

            {row.supp_text && row.supp_text !== row.description && (
              <Field label="Supplerende tekst">
                <Text size="sm" c="dimmed" style={{ wordBreak: 'break-word' }}>
                  {row.supp_text}
                </Text>
              </Field>
            )}

            <Field label="Modtager">
              <Text size="sm" style={{ wordBreak: 'break-word' }}>
                {row.recipient || '—'}
              </Text>
            </Field>

            <Divider />

            <Field label="Virksomhed">
              <Select
                data={companyOptions}
                value={editCompanyId !== undefined ? editCompanyId : (row.company_id ?? null)}
                onChange={(v) => setEditCompanyId(v)}
                placeholder="Ingen (valgfrit)"
                clearable
                searchable
                size="sm"
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
            </Field>

            <Field label="Kategori">
              <Select
                data={categoryOptions}
                value={editCategoryKey ?? row.category_key}
                onChange={handleCategoryChange}
                placeholder="Vælg kategori"
                clearable
                size="sm"
              />
            </Field>

            <Field label="Segment">
              <Select
                data={segmentOptions}
                value={
                  editSegmentKey ?? (row.segment_key !== 'uncategorized' ? row.segment_key : null)
                }
                onChange={handleSegmentChange}
                placeholder="Vælg segment"
                clearable
                size="sm"
                disabled={segmentOptions.length === 0}
              />
            </Field>

            {(hasUnsavedEdit || isCategorized) && (
              <Group gap="xs">
                {hasUnsavedEdit && (
                  <Button size="xs" variant="light" color="teal" onClick={handleSaveEdit}>
                    Gem ændringer
                  </Button>
                )}
                {isCategorized && (
                  <Button
                    size="xs"
                    variant="subtle"
                    color="red"
                    leftSection={<IconX size={13} />}
                    onClick={onUnmatch}
                  >
                    Fjern fra klar
                  </Button>
                )}
              </Group>
            )}

            <Divider />

            <Field label="Matchende regler">
              {matchingRules.length === 0 ? (
                <Stack gap="xs">
                  <Text size="sm" c="dimmed">
                    Ingen regler matcher
                  </Text>
                  <Button
                    variant="light"
                    color="violet"
                    size="xs"
                    leftSection={<IconSparkles size={13} />}
                    onClick={() => setShowRuleForm(true)}
                  >
                    Opret regel
                  </Button>
                </Stack>
              ) : (
                <Stack gap="xs">
                  {matchingRules.map((rule) => {
                    const ruleCategory = categories.find((c) => c.key === rule.category_key);
                    const ruleSegment = segments.find(
                      (s) => s.key === rule.segment_key && s.category_key === rule.category_key
                    );
                    return (
                      <Stack
                        key={rule.pattern}
                        gap={4}
                        style={{
                          padding: '8px',
                          borderRadius: '6px',
                          background: 'var(--mantine-color-default-hover)',
                        }}
                      >
                        <Text size="xs" ff="monospace" style={{ wordBreak: 'break-all' }}>
                          {rule.pattern}
                        </Text>
                        <Group gap="xs">
                          {ruleCategory && (
                            <Badge variant="light" color={ruleCategory.color} radius="sm" size="sm">
                              {ruleCategory.label}
                            </Badge>
                          )}
                          {ruleSegment && (
                            <Badge variant="light" color="gray" radius="sm" size="sm">
                              {ruleSegment.label}
                            </Badge>
                          )}
                          <Text size="xs" c="dimmed">
                            {rule.match_count} {rule.match_count === 1 ? 'gang' : 'gange'} anvendt
                          </Text>
                        </Group>
                      </Stack>
                    );
                  })}
                </Stack>
              )}
            </Field>
          </Stack>
        )}
      </Drawer>

      {showRuleForm && row && (
        <RuleForm
          initialPattern={suggestedPattern}
          initialCategoryKey={row.category_key !== 'uncategorized' ? row.category_key : ''}
          initialSegmentKey={row.segment_key !== 'uncategorized' ? row.segment_key : ''}
          categories={categories}
          segments={segments}
          companies={companies}
          rows={allRows}
          onSave={handleRuleSaved}
          onClose={() => setShowRuleForm(false)}
        />
      )}
    </>
  );
};

export default ImportTransactionDrawer;
