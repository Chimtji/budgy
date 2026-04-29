'use client';

import { useMemo, useState } from 'react';
import { IconPlus, IconSearch } from '@tabler/icons-react';
import { Button, Group, Stack, Table, Text, TextInput } from '@mantine/core';
import { SubscriptionData } from '@/service/database/subscriptions';
import SubscriptionRow from './SubscriptionRow';

interface SubscriptionsListProps {
  subscriptions: SubscriptionData[];
  onEdit: (subscription: SubscriptionData) => void;
  onDelete: (id: string) => void;
  onCreateNew: () => void;
  isLoading: boolean;
}

export default function SubscriptionsList({
  subscriptions,
  onEdit,
  onDelete,
  onCreateNew,
  isLoading,
}: SubscriptionsListProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return subscriptions;
    const searchLower = search.toLowerCase();
    return subscriptions.filter((sub) => sub.merchantName.toLowerCase().includes(searchLower));
  }, [subscriptions, search]);

  if (isLoading) {
    return <Text>Henter abonnementer...</Text>;
  }

  if (subscriptions.length === 0) {
    return (
      <Stack align="center" gap="lg" py="xl">
        <Text c="dimmed">Ingen abonnementer endnu</Text>
        <Button onClick={onCreateNew} leftSection={<IconPlus size={16} />}>
          Opret abonnement
        </Button>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      <Group>
        <TextInput
          placeholder="Søg efter forhandler..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Button onClick={onCreateNew} leftSection={<IconPlus size={16} />}>
          Opret abonnement
        </Button>
      </Group>

      {filtered.length === 0 ? (
        <Text c="dimmed">Ingen abonnementer matchede søgekriteriet</Text>
      ) : (
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Forhandler</Table.Th>
              <Table.Th>Beløb</Table.Th>
              <Table.Th>Hyppighed</Table.Th>
              <Table.Th>Næste forfaldsdato</Table.Th>
              <Table.Th>Handlinger</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {filtered.map((subscription) => (
              <SubscriptionRow
                key={subscription.id}
                subscription={subscription}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </Table.Tbody>
        </Table>
      )}
    </Stack>
  );
}
