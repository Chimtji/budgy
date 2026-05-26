'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  IconArchive,
  IconArchiveOff,
  IconChevronDown,
  IconChevronUp,
  IconPencil,
  IconSearch,
  IconSelector,
  IconTrash,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Group,
  Pagination,
  Paper,
  Table,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { type TTransaction } from '@/service/database/transactions/getAll';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import CompanyLogo from '../../companies/_components/CompanyLogo';
import TransactionDrawer from './TransactionDrawer';

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

type TProps = {
  transactions: TTransaction[];
  categories: TCategory[];
  segments: TSegment[];
  onEdit: (t: TTransaction) => void;
  onArchive: (t: TTransaction) => void;
  onUnarchive: (t: TTransaction) => void;
  onDelete: (t: TTransaction) => void;
  showArchived: boolean;
};

type TSortField = 'date' | 'amount' | 'category_key';
type TSortDir = 'asc' | 'desc';

const PAGE_SIZE = 30;

const formatDKK = (amount: number) =>
  new Intl.NumberFormat('da-DK', { style: 'currency', currency: 'DKK' }).format(amount);

const SortIcon: React.FC<{ field: TSortField; current: TSortField; dir: TSortDir }> = ({
  field,
  current,
  dir,
}) => {
  if (field !== current) return <IconSelector size={14} />;
  return dir === 'asc' ? <IconChevronUp size={14} /> : <IconChevronDown size={14} />;
};

const TransactionTable: React.FC<TProps> = ({
  transactions,
  categories,
  segments,
  onEdit,
  onArchive,
  onUnarchive,
  onDelete,
  showArchived,
}) => {
  const companies = useCompaniesStore((s) => s.companies);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebouncedValue(search, 200);
  const [sortField, setSortField] = useState<TSortField>('date');
  const [sortDir, setSortDir] = useState<TSortDir>('desc');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<TTransaction | null>(null);

  useEffect(() => {
    setPage(1);
  }, [transactions, debouncedSearch]);

  const sorted = useMemo(() => {
    const q = debouncedSearch.toLowerCase().trim();
    const filtered = q
      ? transactions.filter(
          (t) =>
            t.description.toLowerCase().includes(q) ||
            t.recipient.toLowerCase().includes(q) ||
            (t.company_name ?? '').toLowerCase().includes(q)
        )
      : transactions;
    return [...filtered].sort((a, b) => {
      let diff = 0;
      if (sortField === 'date') diff = a.date.localeCompare(b.date);
      else if (sortField === 'amount') diff = a.amount - b.amount;
      else if (sortField === 'category_key')
        diff = (a.category_key ?? '').localeCompare(b.category_key ?? '');
      return sortDir === 'asc' ? diff : -diff;
    });
  }, [transactions, debouncedSearch, sortField, sortDir]);

  const totalPages = Math.ceil(sorted.length / PAGE_SIZE);
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSort = (field: TSortField) => {
    if (field === sortField) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else {
      setSortField(field);
      setSortDir('desc');
    }
  };

  const SortableTh: React.FC<{ field: TSortField; children: React.ReactNode }> = ({
    field,
    children,
  }) => (
    <Table.Th>
      <UnstyledButton onClick={() => handleSort(field)} style={{ width: '100%' }}>
        <Group gap={4} wrap="nowrap">
          <Text size="sm" fw={500}>
            {children}
          </Text>
          <SortIcon field={field} current={sortField} dir={sortDir} />
        </Group>
      </UnstyledButton>
    </Table.Th>
  );

  return (
    <>
      <TextInput
        placeholder="Søg på beskrivelse, modtager eller firma..."
        leftSection={<IconSearch size={16} />}
        value={search}
        onChange={(e) => setSearch(e.currentTarget.value)}
        mb="sm"
        style={{ flexShrink: 0 }}
      />
      <Paper
        p="sm"
        style={{
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ overflow: 'auto', flex: 1 }}>
          <Table style={{ borderCollapse: 'separate', borderSpacing: '0 4px' }}>
            <Table.Thead
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 1,
                background: 'var(--mantine-color-body)',
              }}
            >
              <Table.Tr>
                <SortableTh field="date">Dato</SortableTh>
                <Table.Th>Virksomhed</Table.Th>
                <SortableTh field="amount">Beløb</SortableTh>
                <SortableTh field="category_key">Kategori</SortableTh>
                <Table.Th>Segment</Table.Th>
                <Table.Th />
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paged.map((t) => {
                const category = categories.find((c) => c.key === t.category_key);
                const segment = segments.find(
                  (s) => s.key === t.segment_key && s.category_key === t.category_key
                );
                return (
                  <Table.Tr
                    key={t.id}
                    onClick={() => setSelected(t)}
                    style={{ cursor: 'pointer', background: 'var(--mantine-color-default-hover)' }}
                  >
                    <Table.Td style={{ borderRadius: '6px 0 0 6px' }}>
                      <Text size="sm" c="dimmed" style={{ whiteSpace: 'nowrap' }}>
                        {new Date(t.date).toLocaleDateString('da-DK')}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {(() => {
                        const domain =
                          t.company_domain ??
                          companies.find((c) => c.name === t.company_name)?.domain ??
                          null;
                        return (
                          <Group gap={6} wrap="nowrap">
                            <CompanyLogo
                              domain={domain}
                              name={t.company_name || t.description}
                              size={22}
                            />
                            <Text
                              size="sm"
                              style={{
                                maxWidth: 200,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {t.company_name || t.description}
                            </Text>
                          </Group>
                        );
                      })()}
                    </Table.Td>
                    <Table.Td>
                      <Text
                        c={t.amount < 0 ? 'red.6' : 'teal.6'}
                        fw={600}
                        size="sm"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        {formatDKK(t.amount)}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {category && (
                        <Badge color={category.color} variant="light" radius="sm" size="sm">
                          {category.label}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {segment && (
                        <Badge variant="light" color="gray" radius="sm" size="sm">
                          {segment.label}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td
                      style={{ borderRadius: '0 6px 6px 0' }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Group gap={4} wrap="nowrap">
                        {showArchived ? (
                          <>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() => onUnarchive(t)}
                            >
                              <IconArchiveOff size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="red"
                              size="sm"
                              onClick={() => onDelete(t)}
                            >
                              <IconTrash size={14} />
                            </ActionIcon>
                          </>
                        ) : (
                          <>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() => onEdit(t)}
                            >
                              <IconPencil size={14} />
                            </ActionIcon>
                            <ActionIcon
                              variant="subtle"
                              color="gray"
                              size="sm"
                              onClick={() => onArchive(t)}
                            >
                              <IconArchive size={14} />
                            </ActionIcon>
                          </>
                        )}
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        </div>
        {totalPages > 1 && (
          <Group
            justify="center"
            p="md"
            style={{ flexShrink: 0, borderTop: '1px solid var(--mantine-color-default-border)' }}
          >
            <Pagination value={page} onChange={setPage} total={totalPages} size="sm" />
          </Group>
        )}
      </Paper>

      <TransactionDrawer
        transaction={selected}
        categories={categories}
        segments={segments}
        onClose={() => setSelected(null)}
      />
    </>
  );
};

export default TransactionTable;
