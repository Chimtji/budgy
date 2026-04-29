'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Badge, Card, Center, Group, Loader, Stack, Text } from '@mantine/core';
import { useRecurringBreakdown } from '@/stores/stats/statsStore';

export default function RecurringVsOneTime() {
  const breakdown = useRecurringBreakdown();

  if (!breakdown) {
    return (
      <Card withBorder p="lg">
        <Center h={300}>
          <Loader />
        </Center>
      </Card>
    );
  }

  const data = [
    {
      name: 'Udgifter',
      Tilbagevendende: breakdown.recurring,
      Engangs: breakdown.oneTime,
    },
  ];

  const recurringPercent = breakdown.recurringPercent.toFixed(1);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          style={{
            background: '#fff',
            border: '1px solid #ccc',
            padding: '8px',
            borderRadius: '4px',
          }}
        >
          <Text size="sm" fw={500}>
            {payload[0].name}
          </Text>
          <Text size="sm" c="dimmed">
            {payload[0].value.toFixed(2)} kr
          </Text>
        </div>
      );
    }
    return null;
  };

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Text size="sm" c="dimmed">
          Tilbagevendende vs engangs
        </Text>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Tilbagevendende" stackId="a" fill="#748ffc" />
            <Bar dataKey="Engangs" stackId="a" fill="#ffa94d" />
          </BarChart>
        </ResponsiveContainer>

        <Group gap="md">
          <div>
            <Badge color="blue" size="lg">
              {recurringPercent}%
            </Badge>
            <Text size="xs" c="dimmed" mt="xs">
              Tilbagevendende
            </Text>
          </div>
          <div>
            <Badge color="orange" size="lg">
              {(100 - parseFloat(recurringPercent)).toFixed(1)}%
            </Badge>
            <Text size="xs" c="dimmed" mt="xs">
              Engangs
            </Text>
          </div>
        </Group>
      </Stack>
    </Card>
  );
}
