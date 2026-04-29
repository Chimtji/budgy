'use client';

import { useMemo, useState } from 'react';
import { IconSearch } from '@tabler/icons-react';
import {
  Badge,
  Button,
  Center,
  Checkbox,
  Group,
  Loader,
  Select,
  Stack,
  Table,
  TextInput,
} from '@mantine/core';
import categories from '@/data/categories.json';
import { useAppStore } from '@/stores/app/appStore';
import { useTransactionsByMonth } from '@/stores/transactions/transactionsStore';
import BulkCategorizeModal from './BulkCategorizeModal';
import TransactionRow from './TransactionRow';

export default function TransactionTable() {
  const year = useAppStore((state) => state.year);
  const currentMonth = new Date().getMonth() + 1;
  const transactions = useTransactionsByMonth(year, currentMonth);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'merchant'>('date');
  const [isLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkModalOpen, setBulkModalOpen] = useState(false);

  const uncategorized = transactions.filter((tx) => !tx.categoryId || !tx.segmentId);

  const filtered = transactions
    .filter((tx) => tx.merchantName.toLowerCase().includes(search.toLowerCase()))
    .filter((tx) => !selectedCategory || tx.categoryId === selectedCategory)
    .sort((a, b) => {
      if (sortBy === 'amount') return b.amount - a.amount;
      if (sortBy === 'merchant') return a.merchantName.localeCompare(b.merchantName);
      return new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime();
    });

  const allSelectedInView = useMemo(() => {
    return filtered.length > 0 && filtered.every((tx) => selectedIds.has(tx.id));
  }, [filtered, selectedIds]);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const newSet = new Set(selectedIds);
      filtered.forEach((tx) => newSet.add(tx.id));
      setSelectedIds(newSet);
    } else {
      const newSet = new Set(selectedIds);
      filtered.forEach((tx) => newSet.delete(tx.id));
      setSelectedIds(newSet);
    }
  };

  const handleRowSelection = (transactionId: string, selected: boolean) => {
    const newSet = new Set(selectedIds);
    if (selected) {
      newSet.add(transactionId);
    } else {
      newSet.delete(transactionId);
    }
    setSelectedIds(newSet);
  };

  const handleBulkSuccess = () => {
    setSelectedIds(new Set());
  };

  if (isLoading) {
    return (
      <Center py={40}>
        <Loader />
      </Center>
    );
  }

  const categoryOptions = [
    { value: '', label: 'Alle kategorier' },
    ...Object.entries(categories).map(([key, cat]) => ({
      value: cat.id,
      label: cat.label,
    })),
  ];

  return (
    <Stack gap="lg">
      <div>
        <Group mb="lg">
          <TextInput
            placeholder="Søg efter handlende..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => setSearch(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Kategori"
            data={categoryOptions}
            value={selectedCategory}
            onChange={setSelectedCategory}
            clearable
            style={{ minWidth: 200 }}
          />
          <Select
            placeholder="Sortér efter"
            data={[
              { value: 'date', label: 'Dato' },
              { value: 'amount', label: 'Beløb' },
              { value: 'merchant', label: 'Handlende' },
            ]}
            value={sortBy}
            onChange={(val) => setSortBy(val as 'date' | 'amount' | 'merchant')}
            style={{ minWidth: 150 }}
          />
        </Group>

        {selectedIds.size > 0 && (
          <Group mb="lg">
            <Badge>{selectedIds.size} valgt</Badge>
            <Button size="xs" onClick={() => setBulkModalOpen(true)}>
              Kategoriser valgte
            </Button>
          </Group>
        )}
      </div>

      {uncategorized.length > 0 && (
        <div>
          <Group mb="sm">
            <Badge color="yellow">Ikke kategoriseret</Badge>
            <Badge variant="light">{uncategorized.length}</Badge>
          </Group>
          <Table striped>
            <Table.Thead>
              <Table.Tr>
                <Table.Th style={{ width: 40 }}></Table.Th>
                <Table.Th>Dato</Table.Th>
                <Table.Th>Handlende</Table.Th>
                <Table.Th>Beløb</Table.Th>
                <Table.Th>Kategori</Table.Th>
                <Table.Th>Segment</Table.Th>
                <Table.Th>Handling</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {uncategorized.map((tx) => (
                <TransactionRow
                  key={tx.id}
                  transaction={tx}
                  isSelected={selectedIds.has(tx.id)}
                  onSelectionChange={(selected) => handleRowSelection(tx.id, selected)}
                />
              ))}
            </Table.Tbody>
          </Table>
        </div>
      )}

      {filtered.length === 0 ? (
        <Center py={40}>
          <Badge>Ingen transaktioner fundet</Badge>
        </Center>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: 40 }}>
                <Checkbox
                  checked={allSelectedInView}
                  onChange={(e) => handleSelectAll(e.currentTarget.checked)}
                />
              </Table.Th>
              <Table.Th>Dato</Table.Th>
              <Table.Th>Handlende</Table.Th>
              <Table.Th>Beløb</Table.Th>
              <Table.Th>Kategori</Table.Th>
              <Table.Th>Segment</Table.Th>
              <Table.Th>Handling</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((tx) => (
              <TransactionRow
                key={tx.id}
                transaction={tx}
                isSelected={selectedIds.has(tx.id)}
                onSelectionChange={(selected) => handleRowSelection(tx.id, selected)}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}

      <BulkCategorizeModal
        opened={bulkModalOpen}
        onClose={() => setBulkModalOpen(false)}
        selectedTransactionIds={Array.from(selectedIds)}
        onSuccess={handleBulkSuccess}
      />
    </Stack>
  );
}
