'use client';

import { useEffect, useState } from 'react';
import { IconArchive, IconEye, IconEyeOff } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { Badge, Box, Button, Group, Skeleton, Stack, Text, Title } from '@mantine/core';
import { type TTransaction } from '@/service/database/transactions/getAll';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import EditCategoryModal from './_components/EditCategoryModal';
import TransactionFilters from './_components/TransactionFilters';
import TransactionTable from './_components/TransactionTable';

const CONTENT_PADDING = 'var(--mantine-spacing-xl)';

const TransactionsPage: React.FC = () => {
  const {
    transactions,
    isLoading,
    init,
    updateTransaction,
    archiveTransaction,
    unarchiveTransaction,
    deleteTransaction,
  } = useTransactionsStore(
    useShallow((s) => ({
      transactions: s.transactions,
      isLoading: s.isLoading,
      init: s.init,
      updateTransaction: s.updateTransaction,
      archiveTransaction: s.archiveTransaction,
      unarchiveTransaction: s.unarchiveTransaction,
      deleteTransaction: s.deleteTransaction,
    }))
  );
  const { categories, segments } = useCategoriesStore(
    useShallow((s) => ({ categories: s.categories, segments: s.segments }))
  );

  const [editing, setEditing] = useState<TTransaction | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [hideInternal, setHideInternal] = useState(true);

  useEffect(() => {
    useTransactionsStore.getState().init({});
  }, []);

  const handleFilter = (filters: { year?: number; category_key?: string }) => {
    init(filters);
  };

  const handleSave = (input: {
    id: string;
    date: string;
    amount: number;
    description: string;
    recipient: string;
    category_key: string;
    segment_key: string;
    company_name: string | null;
  }) => {
    updateTransaction(input);
  };

  const internalCount = transactions.filter((t) => t.category_key === 'internal').length;
  const archivedCount = transactions.filter((t) => t.is_archived).length;

  const visibleTransactions = transactions.filter(
    (t) =>
      (showArchived ? t.is_archived : !t.is_archived) &&
      (!hideInternal || t.category_key !== 'internal')
  );

  return (
    <Box
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: `calc(100vh - ${CONTENT_PADDING} * 2)`,
      }}
    >
      <Group justify="space-between" align="flex-end" pb="md" style={{ flexShrink: 0 }}>
        <Stack gap={4}>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
            Transaktioner
          </Title>
          <Text size="sm" c="dimmed">
            {visibleTransactions.length} poster
          </Text>
        </Stack>
        <Group gap="sm">
          <Button
            variant={hideInternal ? 'light' : 'outline'}
            color={hideInternal ? 'gray' : 'violet'}
            size="sm"
            leftSection={
              hideInternal ? (
                <IconEyeOff size={14} stroke={1.5} />
              ) : (
                <IconEye size={14} stroke={1.5} />
              )
            }
            rightSection={
              internalCount > 0 ? (
                <Badge
                  variant="filled"
                  color={hideInternal ? 'gray' : 'violet'}
                  size="xs"
                  style={{ minWidth: 18 }}
                >
                  {internalCount}
                </Badge>
              ) : undefined
            }
            onClick={() => setHideInternal((v) => !v)}
          >
            Interne
          </Button>
          <Button
            variant={showArchived ? 'light' : 'outline'}
            color={showArchived ? 'orange' : 'gray'}
            size="sm"
            leftSection={<IconArchive size={14} stroke={1.5} />}
            rightSection={
              archivedCount > 0 ? (
                <Badge
                  variant="filled"
                  color={showArchived ? 'orange' : 'gray'}
                  size="xs"
                  style={{ minWidth: 18 }}
                >
                  {archivedCount}
                </Badge>
              ) : undefined
            }
            onClick={() => setShowArchived((v) => !v)}
          >
            Arkiverede
          </Button>
          <TransactionFilters categories={categories} onFilter={handleFilter} />
        </Group>
      </Group>

      {isLoading && <Skeleton radius="md" style={{ flex: 1 }} />}
      {!isLoading && visibleTransactions.length === 0 && (
        <Text c="dimmed" size="sm">
          {showArchived ? 'Ingen arkiverede transaktioner.' : 'Ingen transaktioner fundet.'}
        </Text>
      )}
      {!isLoading && visibleTransactions.length > 0 && (
        <TransactionTable
          transactions={visibleTransactions}
          categories={categories}
          segments={segments}
          showArchived={showArchived}
          onEdit={setEditing}
          onArchive={(t) => archiveTransaction(t.id)}
          onUnarchive={(t) => unarchiveTransaction(t.id)}
          onDelete={(t) => deleteTransaction(t.id)}
        />
      )}

      <EditCategoryModal
        transaction={editing}
        categories={categories}
        segments={segments}
        onClose={() => setEditing(null)}
        onSave={handleSave}
      />
    </Box>
  );
};

export default TransactionsPage;
