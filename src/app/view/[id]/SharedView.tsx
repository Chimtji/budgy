'use client';

import { Box, Group, Paper, Tabs, Title } from '@mantine/core';
import type { TCategory } from '@/service/database/categories/getAll';
import type { TGoal } from '@/service/database/goals/getAll';
import type { TSegment } from '@/service/database/segments/getAll';
import type { TSnapshot } from '@/service/database/share/createSnapshot';
import type { TSubscriptionMatcher } from '@/service/database/subscriptions/getAll';
import type { TTransaction } from '@/service/database/transactions/getAll';
import { CategoriesTab } from './_components/CategoriesTab';
import { GoalsTab } from './_components/GoalsTab';
import { OverviewTab } from './_components/OverviewTab';
import { SubscriptionsTab } from './_components/SubscriptionsTab';
import { TransactionsTab } from './_components/TransactionsTab';

export type TTypedSnapshot = {
  categories: TCategory[];
  segments: TSegment[];
  transactions: TTransaction[];
  goals: TGoal[];
  subscriptions: TSubscriptionMatcher[];
};

type TProps = {
  snapshot: TSnapshot;
};

export const SharedView = ({ snapshot }: TProps) => {
  const typed = snapshot as unknown as TTypedSnapshot;

  return (
    <Box p="xl" maw={1100} mx="auto">
      <Group mb="xl" justify="space-between" align="center">
        <Title order={2}>Delt snapshot</Title>
      </Group>

      <Paper withBorder>
        <Tabs defaultValue="overview" keepMounted={false}>
          <Tabs.List px="md" pt="xs">
            <Tabs.Tab value="overview">Overblik</Tabs.Tab>
            <Tabs.Tab value="transactions">Transaktioner</Tabs.Tab>
            <Tabs.Tab value="categories">Kategorier</Tabs.Tab>
            <Tabs.Tab value="goals">Budgetmål</Tabs.Tab>
            <Tabs.Tab value="subscriptions">Regninger</Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="overview" p="md">
            <OverviewTab transactions={typed.transactions} categories={typed.categories} />
          </Tabs.Panel>

          <Tabs.Panel value="transactions" p="md">
            <TransactionsTab transactions={typed.transactions} categories={typed.categories} />
          </Tabs.Panel>

          <Tabs.Panel value="categories" p="md">
            <CategoriesTab categories={typed.categories} transactions={typed.transactions} />
          </Tabs.Panel>

          <Tabs.Panel value="goals" p="md">
            <GoalsTab
              goals={typed.goals}
              transactions={typed.transactions}
              categories={typed.categories}
            />
          </Tabs.Panel>

          <Tabs.Panel value="subscriptions" p="md">
            <SubscriptionsTab subscriptions={typed.subscriptions} />
          </Tabs.Panel>
        </Tabs>
      </Paper>
    </Box>
  );
};
