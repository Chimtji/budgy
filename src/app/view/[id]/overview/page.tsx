'use client';

import { Title } from '@mantine/core';
import { OverviewTab } from '../_components/OverviewTab';
import { useViewSnapshot } from '../_components/ViewSnapshotProvider';

const SharedOverviewPage = () => {
  const { transactions, categories } = useViewSnapshot();

  return (
    <>
      <Title order={2} fw={700} mb="md" style={{ letterSpacing: '-0.5px' }}>
        Overblik
      </Title>
      <OverviewTab transactions={transactions} categories={categories} />
    </>
  );
};

export default SharedOverviewPage;
