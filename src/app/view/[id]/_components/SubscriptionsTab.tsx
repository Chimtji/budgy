import { Badge, Group, Table, Text } from '@mantine/core';
import type { TSubscriptionMatcher } from '@/service/database/subscriptions/getAll';

type TProps = {
  subscriptions: TSubscriptionMatcher[];
};

const cadenceLabel: Record<string, string> = {
  monthly: 'Månedlig',
  'bi-monthly': 'Hver 2. måned',
  quarterly: 'Kvartalsvis',
  'half-yearly': 'Halvårlig',
  yearly: 'Årlig',
  irregular: 'Uregelmæssig',
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(amount);

export const SubscriptionsTab = ({ subscriptions }: TProps) => {
  if (subscriptions.length === 0)
    return (
      <Text c="dimmed" size="sm">
        Ingen regninger.
      </Text>
    );

  return (
    <Table striped={false} style={{ borderSpacing: '0 4px', borderCollapse: 'separate' }}>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Navn</Table.Th>
          <Table.Th>Frekvens</Table.Th>
          <Table.Th>Beløb</Table.Th>
          <Table.Th>Status</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>
        {subscriptions.map((s) => (
          <Table.Tr key={s.id}>
            <Table.Td
              style={{
                background: 'var(--mantine-color-default-hover)',
                borderRadius: '6px 0 0 6px',
              }}
            >
              <Text size="sm" fw={500}>
                {s.name}
              </Text>
            </Table.Td>
            <Table.Td style={{ background: 'var(--mantine-color-default-hover)' }}>
              <Badge variant="light" color="gray" radius="sm" size="sm">
                {s.cadence ? (cadenceLabel[s.cadence] ?? s.cadence) : '—'}
              </Badge>
            </Table.Td>
            <Table.Td style={{ background: 'var(--mantine-color-default-hover)' }}>
              <Text size="sm" c="dimmed">
                {s.amount_min != null && s.amount_max != null
                  ? `${formatAmount(s.amount_min)} – ${formatAmount(s.amount_max)}`
                  : '—'}
              </Text>
            </Table.Td>
            <Table.Td
              style={{
                background: 'var(--mantine-color-default-hover)',
                borderRadius: '0 6px 6px 0',
              }}
            >
              <Badge variant="light" color={s.cancelled_at ? 'red' : 'green'} radius="sm" size="sm">
                {s.cancelled_at ? 'Opsagt' : 'Aktiv'}
              </Badge>
            </Table.Td>
          </Table.Tr>
        ))}
      </Table.Tbody>
    </Table>
  );
};
