'use client';

import { useEffect, useMemo, useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import {
  ActionIcon,
  Badge,
  Button,
  Divider,
  Drawer,
  Group,
  Select,
  Stack,
  Text,
} from '@mantine/core';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { matchesPattern, type TRule } from '@/service/categorization/engine';
import { getAllRules } from '@/service/database/rules/getAll';
import { type TTransaction } from '@/service/database/transactions/getAll';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import CompanyForm from '../../companies/_components/CompanyForm';
import CompanyLogo from '../../companies/_components/CompanyLogo';

type TCategory = { key: string; label: string; color: string };
type TSegment = { key: string; category_key: string; label: string };

type TProps = {
  transaction: TTransaction | null;
  categories: TCategory[];
  segments: TSegment[];
  onClose: () => void;
};

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

const matchesRule = (rule: TRule, description: string, recipient: string): boolean =>
  matchesPattern(rule.pattern, `${description} ${recipient}`);

const TransactionDrawer: React.FC<TProps> = ({ transaction: t, categories, segments, onClose }) => {
  const companies = useCompaniesStore((s) => s.companies);
  const addCompany = useCompaniesStore((s) => s.addCompany);
  const updateTransaction = useTransactionsStore((s) => s.updateTransaction);
  const { categories: allCategories, segments: allSegments } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );
  const [rules, setRules] = useState<TRule[]>([]);
  const [pendingCategory, setPendingCategory] = useState<string | null>(null);
  const [pendingSegment, setPendingSegment] = useState<string | null>(null);
  const [pendingCompany, setPendingCompany] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showAddCompany, setShowAddCompany] = useState(false);

  const fetchRules = () => {
    getAllRules().then((result) => {
      if (result.success) setRules(result.data);
    });
  };

  useEffect(() => {
    fetchRules();
  }, [t?.id]);

  useEffect(() => {
    setPendingCategory(t?.category_key ?? null);
    setPendingSegment(t?.segment_key ?? null);
    setPendingCompany(t?.company_name ?? null);
  }, [t?.id]);

  const categoryOptions = categories.map((c) => ({ value: c.key, label: c.label }));
  const segmentOptions = segments
    .filter((s) => s.category_key === pendingCategory)
    .map((s) => ({ value: s.key, label: s.label }));

  const isDirty =
    pendingCategory !== (t?.category_key ?? null) ||
    pendingSegment !== (t?.segment_key ?? null) ||
    pendingCompany !== (t?.company_name ?? null);

  const handleSave = async () => {
    if (!t) return;
    setIsSaving(true);
    try {
      await updateTransaction({
        id: t.id,
        date: t.date,
        amount: t.amount,
        description: t.description,
        recipient: t.recipient,
        category_key: pendingCategory ?? '',
        segment_key: pendingSegment ?? '',
        company_name: pendingCompany,
      });
      showSuccessNotification({ title: 'Gemt', message: 'Kategori opdateret' });
      fetchRules();
    } catch {
      showErrorNotification({ title: 'Fejl', message: 'Kunne ikke opdatere kategori' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddCompany = async (
    name: string,
    domain: string | null,
    tags: string[],
    category_key: string | null,
    segment_key: string | null
  ) => {
    const result = await addCompany(name, domain, tags, category_key, segment_key);
    if (result) setPendingCompany(result.name);
  };

  const matchingRules = useMemo(
    () => (t ? rules.filter((r) => matchesRule(r, t.description, t.recipient)) : []),
    [t, rules]
  );

  return (
    <>
      {showAddCompany && (
        <CompanyForm
          categories={allCategories}
          segments={allSegments}
          onSave={handleAddCompany}
          onClose={() => setShowAddCompany(false)}
        />
      )}
      <Drawer
        opened={!!t}
        onClose={onClose}
        title="Transaktionsdetaljer"
        position="right"
        size="sm"
      >
        {t && (
          <Stack gap="lg">
            <Field label="Beløb">
              <Text fw={700} size="xl" c={t.amount < 0 ? 'red.6' : 'teal.6'}>
                {formatDKK(t.amount)}
              </Text>
            </Field>

            <Divider />

            <Field label="Dato">
              <Text size="sm">
                {new Date(t.date).toLocaleDateString('da-DK', { dateStyle: 'long' })}
              </Text>
            </Field>

            <Field label="Beskrivelse">
              <Text size="sm" style={{ wordBreak: 'break-word' }}>
                {t.description}
              </Text>
            </Field>

            {t.recipient && (
              <Field label="Modpart">
                <Text size="sm" style={{ wordBreak: 'break-word' }}>
                  {t.recipient}
                </Text>
              </Field>
            )}

            <Divider />

            <Field label="Virksomhed">
              <Group gap="xs" wrap="nowrap">
                <CompanyLogo
                  domain={companies.find((c) => c.name === pendingCompany)?.domain ?? null}
                  name={pendingCompany ?? ''}
                  size={24}
                />
                <Select
                  data={companies.map((c) => ({ value: c.name, label: c.name }))}
                  value={pendingCompany}
                  onChange={setPendingCompany}
                  placeholder="Ingen virksomhed"
                  clearable
                  searchable
                  size="sm"
                  style={{ flex: 1 }}
                />
                <ActionIcon variant="light" size="sm" onClick={() => setShowAddCompany(true)}>
                  <IconPlus size={14} stroke={1.5} />
                </ActionIcon>
              </Group>
            </Field>

            <Field label="Kategori">
              <Select
                data={categoryOptions}
                value={pendingCategory}
                onChange={(v) => {
                  setPendingCategory(v);
                  setPendingSegment(null);
                }}
                placeholder="Ingen kategori"
                clearable
                size="sm"
              />
            </Field>

            <Field label="Segment">
              <Select
                data={segmentOptions}
                value={pendingSegment}
                onChange={setPendingSegment}
                placeholder="Intet segment"
                clearable
                disabled={!pendingCategory || segmentOptions.length === 0}
                size="sm"
              />
            </Field>

            {isDirty && (
              <Button size="sm" onClick={handleSave} loading={isSaving}>
                Gem ændringer
              </Button>
            )}

            <Divider />

            <Field label="Matchende regler">
              {matchingRules.length === 0 ? (
                <Text size="sm" c="dimmed">
                  Ingen regler matcher
                </Text>
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
    </>
  );
};

export default TransactionDrawer;
