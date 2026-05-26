'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  IconCheck,
  IconChevronDown,
  IconChevronRight,
  IconChevronUp,
  IconSelector,
  IconSparkles,
} from '@tabler/icons-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ActionIcon, Badge, Group, Table, Text, Tooltip } from '@mantine/core';
import { matchesPattern } from '@/service/categorization/engine';
import ImportPreviewRow from './ImportPreviewRow';
import ImportTransactionDrawer from './ImportTransactionDrawer';
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
  duplicate: boolean;
  auto_matched: boolean;
};

type TRuleResult = {
  category_key: string;
  segment_key: string;
  company_id: string | null;
  pattern: string;
};

type TGroupHeader = {
  type: 'header';
  groupKey: string;
  label: string;
  count: number;
  indices: number[];
  isUncategorized: boolean;
  commonCategoryKey: string | undefined;
  commonSegmentKey: string | undefined;
};
type TFlatItem = TGroupHeader | { type: 'row'; row: TParsedRow; i: number };

type TProps = {
  rows: TParsedRow[];
  activeView: 'unmatched' | 'matched' | 'duplicate';
  grouped: boolean;
  categories: TCategory[];
  segments: TSegment[];
  companies: TCompany[];
  rules: TRule[];
  onChange: React.Dispatch<React.SetStateAction<TParsedRow[]>>;
  onImportRow: (index: number) => void;
  onImportRows: (indices: number[]) => void;
};

const normalizeDescription = (desc: string): string =>
  desc.replace(/\d+/g, '').replace(/\s+/g, ' ').trim().toLowerCase();

const ImportPreviewTable: React.FC<TProps> = ({
  rows,
  activeView,
  grouped,
  categories,
  segments,
  companies,
  rules,
  onChange,
  onImportRow,
  onImportRows,
}) => {
  const [selectedRow, setSelectedRow] = useState<TParsedRow | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [groupRuleForm, setGroupRuleForm] = useState<TGroupHeader | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<'amount' | 'date' | 'description' | null>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  // Groups are collapsed by default; expandedGroups tracks which have been opened
  const scrollRef = useRef<HTMLDivElement>(null);
  const rowsRef = useRef(rows);
  rowsRef.current = rows;

  const toggleGroup = useCallback((key: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const handleApplyRule = useCallback(
    ({ category_key, segment_key, company_id, pattern }: TRuleResult) => {
      onChange((prev) =>
        prev.map((r) => {
          if (r.duplicate || r.category_key !== 'uncategorized') return r;
          const matches = matchesPattern(pattern, `${r.description} ${r.recipient}`);
          return matches ? { ...r, category_key, segment_key, company_id, auto_matched: true } : r;
        })
      );
    },
    []
  );

  const handleRowSelect = useCallback((index: number) => {
    setSelectedRow(rowsRef.current[index]);
    setSelectedIndex(index);
  }, []);

  const handleUpdateRow = useCallback(
    (category_key: string, segment_key: string, company_id: string | null) => {
      if (selectedIndex === null) return;
      onChange((prev) =>
        prev.map((r, i) =>
          i === selectedIndex
            ? { ...r, category_key, segment_key, company_id, auto_matched: true }
            : r
        )
      );
      setSelectedRow((prev) => (prev ? { ...prev, category_key, segment_key, company_id } : null));
    },
    [selectedIndex, onChange]
  );

  const handleUpdateRowInline = useCallback(
    (i: number, category_key: string, segment_key: string, company_id: string | null) => {
      onChange((prev) =>
        prev.map((r, idx) =>
          idx === i
            ? {
                ...r,
                category_key,
                segment_key,
                company_id,
                auto_matched: category_key !== 'uncategorized',
              }
            : r
        )
      );
    },
    [onChange]
  );

  const handleUnmatch = useCallback(() => {
    if (selectedIndex === null) return;
    onChange((prev) =>
      prev.map((r, i) =>
        i === selectedIndex
          ? {
              ...r,
              category_key: 'uncategorized',
              segment_key: 'uncategorized',
              company_id: null,
              auto_matched: false,
            }
          : r
      )
    );
    setSelectedRow(null);
    setSelectedIndex(null);
  }, [selectedIndex, onChange]);

  const handleToggleSort = (col: 'amount' | 'date' | 'description') => {
    if (sortBy === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(col);
      setSortDir('asc');
    }
  };

  const visibleItems = useMemo(() => {
    return rows
      .map((row, i) => ({ row, i }))
      .filter(({ row }) => {
        if (activeView === 'duplicate') return row.duplicate;
        if (activeView === 'unmatched')
          return !row.duplicate && row.category_key === 'uncategorized';
        return !row.duplicate && row.category_key !== 'uncategorized';
      })
      .sort((a, b) => {
        if (!sortBy) return 0;
        const dir = sortDir === 'asc' ? 1 : -1;
        if (sortBy === 'amount') return (a.row.amount - b.row.amount) * dir;
        if (sortBy === 'date') return a.row.date.localeCompare(b.row.date) * dir;
        if (sortBy === 'description')
          return a.row.description.localeCompare(b.row.description) * dir;
        return 0;
      });
  }, [rows, activeView, sortBy, sortDir]);

  const flatItems = useMemo<TFlatItem[]>(() => {
    if (!grouped) {
      return visibleItems.map(({ row, i }) => ({ type: 'row' as const, row, i }));
    }

    const groupMap = new Map<string, { label: string; indices: number[] }>();
    for (const { row, i } of visibleItems) {
      const key = normalizeDescription(row.description);
      if (!groupMap.has(key)) groupMap.set(key, { label: row.description, indices: [] });
      groupMap.get(key)!.indices.push(i);
    }

    const sorted = [...groupMap.entries()].sort(
      (a, b) => b[1].indices.length - a[1].indices.length
    );

    const flat: TFlatItem[] = [];
    for (const [groupKey, { label, indices }] of sorted) {
      const groupRows = indices.map((i) => rows[i]);
      const isUncategorized = groupRows.some((r) => r.category_key === 'uncategorized');
      const allSameCat = groupRows.every((r) => r.category_key === groupRows[0].category_key);
      const commonCategoryKey = allSameCat ? groupRows[0].category_key : undefined;
      const allSameSeg =
        commonCategoryKey && groupRows.every((r) => r.segment_key === groupRows[0].segment_key);
      const commonSegmentKey = allSameSeg ? groupRows[0].segment_key : undefined;

      flat.push({
        type: 'header',
        groupKey,
        label,
        count: indices.length,
        indices,
        isUncategorized,
        commonCategoryKey,
        commonSegmentKey,
      });
      if (expandedGroups.has(groupKey)) {
        for (const i of indices) {
          flat.push({ type: 'row', row: rows[i], i });
        }
      }
    }
    return flat;
  }, [visibleItems, rows, expandedGroups, grouped]);

  const rowVirtualizer = useVirtualizer({
    count: flatItems.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: (index) => (flatItems[index].type === 'header' ? 40 : 52),
    overscan: 10,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0 ? totalSize - virtualRows[virtualRows.length - 1].end : 0;

  const groupSuggestedPattern = (_header: TGroupHeader) => '';

  return (
    <>
      <div ref={scrollRef} style={{ overflow: 'auto', flex: 1, minHeight: 0, height: '100%' }}>
        <Table highlightOnHover>
          <Table.Thead
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 1,
              background: 'var(--mantine-color-body)',
            }}
          >
            <Table.Tr>
              <Table.Th
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                onClick={() => handleToggleSort('amount')}
              >
                <Group gap={4} wrap="nowrap">
                  Beløb
                  {sortBy === 'amount' ? (
                    sortDir === 'asc' ? (
                      <IconChevronUp size={12} stroke={1.5} />
                    ) : (
                      <IconChevronDown size={12} stroke={1.5} />
                    )
                  ) : (
                    <IconSelector size={12} stroke={1.5} style={{ opacity: 0.3 }} />
                  )}
                </Group>
              </Table.Th>
              <Table.Th>Virksomhed</Table.Th>
              <Table.Th
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                onClick={() => handleToggleSort('description')}
              >
                <Group gap={4} wrap="nowrap">
                  Beskrivelse
                  {sortBy === 'description' ? (
                    sortDir === 'asc' ? (
                      <IconChevronUp size={12} stroke={1.5} />
                    ) : (
                      <IconChevronDown size={12} stroke={1.5} />
                    )
                  ) : (
                    <IconSelector size={12} stroke={1.5} style={{ opacity: 0.3 }} />
                  )}
                </Group>
              </Table.Th>
              <Table.Th
                style={{ cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
                onClick={() => handleToggleSort('date')}
              >
                <Group gap={4} wrap="nowrap">
                  Dato
                  {sortBy === 'date' ? (
                    sortDir === 'asc' ? (
                      <IconChevronUp size={12} stroke={1.5} />
                    ) : (
                      <IconChevronDown size={12} stroke={1.5} />
                    )
                  ) : (
                    <IconSelector size={12} stroke={1.5} style={{ opacity: 0.3 }} />
                  )}
                </Group>
              </Table.Th>
              <Table.Th>Kategori</Table.Th>
              <Table.Th />
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paddingTop > 0 && (
              <tr>
                <td colSpan={6} style={{ height: paddingTop, padding: 0 }} />
              </tr>
            )}
            {virtualRows.map((vr) => {
              const item = flatItems[vr.index];

              if (item.type === 'header') {
                const cat = item.commonCategoryKey
                  ? categories.find((c) => c.key === item.commonCategoryKey)
                  : undefined;
                const seg = item.commonSegmentKey
                  ? segments.find(
                      (s) =>
                        s.key === item.commonSegmentKey && s.category_key === item.commonCategoryKey
                    )
                  : undefined;
                return (
                  <Table.Tr
                    key={`h-${item.groupKey}`}
                    style={{ cursor: 'pointer', background: 'var(--mantine-color-default-hover)' }}
                    onClick={() => toggleGroup(item.groupKey)}
                  >
                    <Table.Td>
                      <Group gap={6} wrap="nowrap">
                        <ActionIcon variant="transparent" color="gray" size="xs">
                          {expandedGroups.has(item.groupKey) ? (
                            <IconChevronDown size={13} />
                          ) : (
                            <IconChevronRight size={13} />
                          )}
                        </ActionIcon>
                        <Badge variant="light" color="gray" radius="sm" size="sm">
                          {item.count}×
                        </Badge>
                      </Group>
                    </Table.Td>
                    <Table.Td />
                    <Table.Td>
                      <Text
                        size="xs"
                        fw={600}
                        c="dimmed"
                        tt="uppercase"
                        style={{
                          letterSpacing: '0.04em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          maxWidth: 300,
                        }}
                      >
                        {normalizeDescription(item.label) || item.label}
                      </Text>
                    </Table.Td>
                    <Table.Td />
                    <Table.Td>
                      <Group gap={4} wrap="nowrap">
                        {cat && (
                          <Badge variant="light" color={cat.color} radius="sm" size="sm">
                            {cat.label}
                          </Badge>
                        )}
                        {seg && (
                          <Badge variant="light" color="gray" radius="sm" size="sm">
                            {seg.label}
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4} justify="flex-end" wrap="nowrap">
                        {item.isUncategorized && (
                          <Tooltip label="Opret regel for hele gruppen" withArrow position="left">
                            <ActionIcon
                              variant="subtle"
                              color="violet"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setGroupRuleForm(item);
                              }}
                            >
                              <IconSparkles size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                        {activeView !== 'duplicate' && (
                          <Tooltip label={`Importer alle ${item.count}`} withArrow position="left">
                            <ActionIcon
                              variant="subtle"
                              color="teal"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                onImportRows(item.indices);
                              }}
                            >
                              <IconCheck size={14} />
                            </ActionIcon>
                          </Tooltip>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              }

              return (
                <ImportPreviewRow
                  key={item.i}
                  index={item.i}
                  row={item.row}
                  rowsRef={rowsRef}
                  categories={categories}
                  segments={segments}
                  companies={companies}
                  onApplyRule={handleApplyRule}
                  onUpdate={handleUpdateRowInline}
                  onSelect={handleRowSelect}
                  onImport={onImportRow}
                />
              );
            })}
            {paddingBottom > 0 && (
              <tr>
                <td colSpan={6} style={{ height: paddingBottom, padding: 0 }} />
              </tr>
            )}
          </Table.Tbody>
        </Table>
      </div>

      <ImportTransactionDrawer
        row={selectedRow}
        categories={categories}
        segments={segments}
        companies={companies}
        rules={rules}
        allRows={rows}
        onRuleSaved={handleApplyRule}
        onUpdate={handleUpdateRow}
        onUnmatch={handleUnmatch}
        onClose={() => {
          setSelectedRow(null);
          setSelectedIndex(null);
        }}
      />

      {groupRuleForm && (
        <RuleForm
          initialPattern={groupSuggestedPattern(groupRuleForm)}
          initialCategoryKey={groupRuleForm.commonCategoryKey ?? ''}
          initialSegmentKey={groupRuleForm.commonSegmentKey ?? ''}
          categories={categories}
          segments={segments}
          companies={companies}
          rows={rows}
          defaultRows={groupRuleForm.indices.map((i) => rows[i])}
          onSave={(result) => {
            handleApplyRule(result);
            setGroupRuleForm(null);
          }}
          onClose={() => setGroupRuleForm(null)}
        />
      )}
    </>
  );
};

export default ImportPreviewTable;
