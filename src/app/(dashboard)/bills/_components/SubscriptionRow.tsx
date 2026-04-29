'use client';

import { IconEdit, IconTrash } from '@tabler/icons-react';
import { Button, Group, Stack, TableTd, TableTr, Text } from '@mantine/core';
import categories from '@/data/categories.json';
import { SubscriptionData } from '@/service/database/subscriptions';
import RecurrenceIndicator from './RecurrenceIndicator';

interface SubscriptionRowProps {
  subscription: SubscriptionData;
  onEdit: (subscription: SubscriptionData) => void;
  onDelete: (id: string) => void;
}

export default function SubscriptionRow({ subscription, onEdit, onDelete }: SubscriptionRowProps) {
  // Find category and segment labels by ID
  const category = Object.values(categories).find((cat) => cat.id === subscription.categoryId);
  const segment = category
    ? Object.values(category.segments).find((seg) => seg.id === subscription.segmentId)
    : null;

  const categoryLabel = category?.label || 'Ukendt kategori';
  const segmentLabel = segment?.label || 'Ukendt segment';

  return (
    <TableTr key={subscription.id}>
      <TableTd>
        <Stack gap={0}>
          <Text fw={500}>{subscription.merchantName}</Text>
          <Text size="sm" c="dimmed">
            {categoryLabel} • {segmentLabel}
          </Text>
        </Stack>
      </TableTd>
      <TableTd>
        {subscription.expectedAmount.toFixed(2)} {subscription.currency}
      </TableTd>
      <TableTd>
        <RecurrenceIndicator cadence={subscription.cadence} />
      </TableTd>
      <TableTd>
        {subscription.nextDueDate
          ? new Date(subscription.nextDueDate).toLocaleDateString('da-DK')
          : '-'}
      </TableTd>
      <TableTd>
        <Group gap="xs">
          <Button
            variant="subtle"
            size="xs"
            onClick={() => onEdit(subscription)}
            leftSection={<IconEdit size={14} />}
          >
            Rediger
          </Button>
          <Button
            variant="subtle"
            size="xs"
            color="red"
            onClick={() => onDelete(subscription.id)}
            leftSection={<IconTrash size={14} />}
          >
            Slet
          </Button>
        </Group>
      </TableTd>
    </TableTr>
  );
}
