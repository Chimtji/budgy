'use client';

import { useEffect } from 'react';
import { Container, Stack, Text, Title } from '@mantine/core';
import { useAppStore } from '@/stores/app/appStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import SyncButton from './_components/SyncButton';
import TransactionTable from './_components/TransactionTable';
import CSVImportModal from './_components/CSVImportModal';

export default function TransactionsPage() {
  const year = useAppStore((state) => state.year);
  const fetchByMonth = useTransactionsStore((state) => state.actions.fetchByMonth);
  const currentMonth = new Date().getMonth() + 1;

  useEffect(() => {
    fetchByMonth(year, currentMonth);
  }, [year, currentMonth, fetchByMonth]);

  return (
    <Container size="xl" py="xl">
      <Stack gap="lg">
        <div>
          <Title order={1}>Transaktioner</Title>
          <Text c="dimmed" size="sm">
            Se og administrer alle dine banktransaktioner
          </Text>
        </div>

        <CSVImportModal />

        <SyncButton />

        <TransactionTable />
      </Stack>
    </Container>
  );
}
