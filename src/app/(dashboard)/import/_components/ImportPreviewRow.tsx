'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { IconCheck, IconPlus, IconSparkles } from '@tabler/icons-react';
import { ActionIcon, Badge, Group, Select, Table, Text, Tooltip } from '@mantine/core';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import { formatDate } from '@/utilities';
import CompanyForm from '../../companies/_components/CompanyForm';
import CompanyLogo from '../../companies/_components/CompanyLogo';
import RuleForm from './RuleForm';

type TCategory = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};
type TSegment = {
  id: string;
  key: string;
  category_key: string;
  label: string;
  description: string;
};
type TCompany = { id: string; name: string; domain: string | null; tags: string[] };
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
  duplicate: boolean;
  auto_matched: boolean;
};

type TRuleResult = {
  category_key: string;
  segment_key: string;
  company_id: string | null;
  pattern: string;
};

type TProps = {
  index: number;
  row: TParsedRow;
  rowsRef: React.RefObject<TParsedRow[]>;
  categories: TCategory[];
  segments: TSegment[];
  companies: TCompany[];
  onApplyRule: (result: TRuleResult) => void;
  onUpdate: (
    index: number,
    category_key: string,
    segment_key: string,
    company_id: string | null
  ) => void;
  onSelect: (index: number) => void;
  onImport: (index: number) => void;
};

const formatDKK = (amount: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);

const ImportPreviewRow: React.FC<TProps> = React.memo(
  ({
    index,
    row,
    rowsRef,
    categories,
    segments,
    companies,
    onApplyRule,
    onUpdate,
    onSelect,
    onImport,
  }) => {
    const isCategorized = row.category_key !== 'uncategorized';
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [showNewCompany, setShowNewCompany] = useState(false);
    const [savingCompany, setSavingCompany] = useState(false);

    const addCompany = useCompaniesStore((s) => s.addCompany);

    // Draft state — buffered until confirmed so the row doesn't jump tabs mid-edit
    const [draftCategoryKey, setDraftCategoryKey] = useState<string | null>(null);
    const [draftSegmentKey, setDraftSegmentKey] = useState<string | null>(null);
    const [draftCompanyId, setDraftCompanyId] = useState<string | null | undefined>(undefined);

    const activeCategoryKey = draftCategoryKey ?? row.category_key;
    const activeSegmentKey = draftSegmentKey ?? row.segment_key;
    const activeCompanyId = draftCompanyId !== undefined ? draftCompanyId : row.company_id;

    const hasDraft =
      (draftCategoryKey !== null && draftCategoryKey !== row.category_key) ||
      (draftSegmentKey !== null && draftSegmentKey !== row.segment_key) ||
      (draftCompanyId !== undefined && draftCompanyId !== row.company_id);

    // O(1) company lookup map
    const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

    const activeCompany = activeCompanyId ? companyById.get(activeCompanyId) : undefined;

    const categoryOptions = useMemo(
      () => categories.map((c) => ({ value: c.key, label: c.label })),
      [categories]
    );
    const segmentOptions = useMemo(
      () =>
        segments
          .filter((s) => s.category_key === activeCategoryKey)
          .map((s) => ({ value: s.key, label: s.label })),
      [segments, activeCategoryKey]
    );
    const companyOptions = useMemo(
      () => companies.map((c) => ({ value: c.id, label: c.name })),
      [companies]
    );

    const handleConfirm = useCallback(() => {
      onUpdate(
        index,
        activeCategoryKey === 'uncategorized'
          ? 'uncategorized'
          : (activeCategoryKey ?? 'uncategorized'),
        activeSegmentKey ?? 'uncategorized',
        activeCompanyId ?? null
      );
      setDraftCategoryKey(null);
      setDraftSegmentKey(null);
      setDraftCompanyId(undefined);
    }, [index, activeCategoryKey, activeSegmentKey, activeCompanyId, onUpdate]);

    const handleCategoryChange = useCallback((val: string | null) => {
      setDraftCategoryKey(val ?? 'uncategorized');
      setDraftSegmentKey('uncategorized');
    }, []);

    const handleSegmentChange = useCallback((val: string | null) => {
      setDraftSegmentKey(val ?? 'uncategorized');
    }, []);

    const handleCompanyChange = useCallback((val: string | null) => {
      setDraftCompanyId(val);
    }, []);

    const renderCompanyOption = useCallback(
      ({ option }: { option: { value: string; label: string } }) => {
        const co = companyById.get(option.value);
        return (
          <Group gap="xs">
            <CompanyLogo domain={co?.domain ?? null} name={option.label} size={16} />
            <Text size="xs">{option.label}</Text>
          </Group>
        );
      },
      [companyById]
    );

    const handleSaveNewCompany = async (
      name: string,
      domain: string | null,
      tags: string[],
      category_key: string | null,
      segment_key: string | null
    ) => {
      setSavingCompany(true);
      const created = await addCompany(name, domain, tags, category_key, segment_key);
      setSavingCompany(false);
      if (created) {
        setDraftCompanyId(created.id);
        // Also draft the company's default category/segment if the row is uncategorized
        if (activeCategoryKey === 'uncategorized' && created.category_key) {
          setDraftCategoryKey(created.category_key);
          setDraftSegmentKey(created.segment_key ?? 'uncategorized');
        }
        setShowNewCompany(false);
      }
    };

    return (
      <>
        <Table.Tr
          onClick={() => onSelect(index)}
          style={{ cursor: 'pointer', opacity: row.duplicate ? 0.45 : 1 }}
        >
          <Table.Td>
            <Text
              c={row.amount < 0 ? 'red.6' : 'teal.6'}
              fw={600}
              size="sm"
              style={{ whiteSpace: 'nowrap' }}
            >
              {formatDKK(row.amount)}
            </Text>
          </Table.Td>
          <Table.Td onClick={(e) => e.stopPropagation()}>
            {!row.duplicate && (
              <Group gap={4} wrap="nowrap">
                <CompanyLogo
                  domain={activeCompany?.domain ?? null}
                  name={activeCompany?.name ?? '?'}
                  size={24}
                />
                <Select
                  size="xs"
                  placeholder="Virksomhed"
                  data={companyOptions}
                  value={activeCompanyId ?? null}
                  onChange={handleCompanyChange}
                  clearable
                  searchable
                  style={{ width: 130 }}
                  styles={{ input: { fontSize: 12 } }}
                  renderOption={renderCompanyOption}
                />
                <Tooltip label="Opret ny virksomhed" withArrow position="top">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    size="sm"
                    onClick={() => setShowNewCompany(true)}
                  >
                    <IconPlus size={13} />
                  </ActionIcon>
                </Tooltip>
              </Group>
            )}
          </Table.Td>
          <Table.Td>
            <Text
              size="sm"
              c={isCategorized ? 'dimmed' : undefined}
              style={{
                maxWidth: 300,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {row.description}
            </Text>
          </Table.Td>
          <Table.Td>
            <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
              {formatDate(row.date)}
            </Text>
          </Table.Td>
          <Table.Td onClick={(e) => e.stopPropagation()}>
            {row.duplicate ? null : (
              <Group gap={6} wrap="nowrap">
                <Select
                  size="xs"
                  placeholder="Kategori"
                  data={categoryOptions}
                  value={activeCategoryKey !== 'uncategorized' ? activeCategoryKey : null}
                  onChange={handleCategoryChange}
                  clearable
                  searchable
                  style={{ width: 130 }}
                  styles={{ input: { fontSize: 12 } }}
                />
                <Select
                  size="xs"
                  placeholder="Segment"
                  data={segmentOptions}
                  value={activeSegmentKey !== 'uncategorized' ? activeSegmentKey : null}
                  onChange={handleSegmentChange}
                  clearable
                  searchable
                  disabled={segmentOptions.length === 0}
                  style={{ width: 120 }}
                  styles={{ input: { fontSize: 12 } }}
                />
                {hasDraft && (
                  <Tooltip label="Bekræft ændringer" withArrow position="top">
                    <ActionIcon variant="light" color="teal" size="sm" onClick={handleConfirm}>
                      <IconCheck size={13} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </Group>
            )}
          </Table.Td>
          <Table.Td>
            <div onClick={(e) => e.stopPropagation()}>
              <Group gap={4} justify="flex-end" wrap="nowrap">
                {row.duplicate ? (
                  <Badge variant="light" color="gray" radius="sm" size="sm">
                    Duplikat
                  </Badge>
                ) : (
                  <>
                    {!isCategorized && (
                      <Tooltip
                        label="Opret regel for automatisk genkendelse"
                        withArrow
                        position="left"
                      >
                        <ActionIcon
                          variant="subtle"
                          color="violet"
                          size="sm"
                          onClick={() => setShowRuleForm(true)}
                        >
                          <IconSparkles size={14} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    <Tooltip label="Importer denne række" withArrow position="left">
                      <ActionIcon
                        variant="subtle"
                        color="teal"
                        size="sm"
                        onClick={() => onImport(index)}
                      >
                        <IconCheck size={14} />
                      </ActionIcon>
                    </Tooltip>
                  </>
                )}
              </Group>
            </div>
          </Table.Td>
        </Table.Tr>
        {showRuleForm && (
          <RuleForm
            initialPattern=""
            initialCategoryKey={row.category_key}
            initialSegmentKey={row.segment_key}
            categories={categories}
            segments={segments}
            companies={companies}
            rows={rowsRef.current ?? []}
            onSave={onApplyRule}
            onClose={() => setShowRuleForm(false)}
          />
        )}
        {showNewCompany && (
          <CompanyForm
            categories={categories}
            segments={segments}
            onSave={handleSaveNewCompany}
            onClose={() => setShowNewCompany(false)}
          />
        )}
      </>
    );
  }
);

export default ImportPreviewRow;
