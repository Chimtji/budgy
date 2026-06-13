'use client';

import { Title } from '@mantine/core';
import { GoalsTab } from '../_components/GoalsTab';
import { useViewSnapshot } from '../_components/ViewSnapshotProvider';

const SharedGoalsPage = () => {
  const { goals, transactions, categories } = useViewSnapshot();

  return (
    <>
      <Title order={2} fw={700} mb="md" style={{ letterSpacing: '-0.5px' }}>
        Budgetmål
      </Title>
      <GoalsTab goals={goals} transactions={transactions} categories={categories} />
    </>
  );
};

export default SharedGoalsPage;
