'use client';

import { Title } from '@mantine/core';
import { CategoriesTab } from '../_components/CategoriesTab';
import { useViewSnapshot } from '../_components/ViewSnapshotProvider';

const SharedCategoriesPage = () => {
  const { categories, transactions } = useViewSnapshot();

  return (
    <>
      <Title order={2} fw={700} mb="md" style={{ letterSpacing: '-0.5px' }}>
        Kategorier
      </Title>
      <CategoriesTab categories={categories} transactions={transactions} />
    </>
  );
};

export default SharedCategoriesPage;
