'use client';

import { Title } from '@mantine/core';
import { useViewSnapshot } from '../_components/ViewSnapshotProvider';
import { TransactionsTab } from '../_components/TransactionsTab';

const SharedTransactionsPage = () => {
  const { transactions, categories } = useViewSnapshot();

  return (
    <>
      <Title order={2} fw={700} mb="md" style={{ letterSpacing: '-0.5px' }}>
        Transaktioner
      </Title>
      <TransactionsTab transactions={transactions} categories={categories} />
    </>
  );
};

export default SharedTransactionsPage;
