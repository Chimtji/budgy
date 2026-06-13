'use client';

import { Title } from '@mantine/core';
import { SubscriptionsTab } from '../_components/SubscriptionsTab';
import { useViewSnapshot } from '../_components/ViewSnapshotProvider';

const SharedSubscriptionsPage = () => {
  const { subscriptions } = useViewSnapshot();

  return (
    <>
      <Title order={2} fw={700} mb="md" style={{ letterSpacing: '-0.5px' }}>
        Regninger
      </Title>
      <SubscriptionsTab subscriptions={subscriptions} />
    </>
  );
};

export default SharedSubscriptionsPage;
