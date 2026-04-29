'use client';

import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Badge, Card, Center, Group, Loader, Stack, Text } from '@mantine/core';
import categories from '@/data/categories.json';
import { useCategoryBreakdown } from '@/stores/stats/statsStore';

export default function CategoryBreakdown() {
  const breakdown = useCategoryBreakdown();

  if (!breakdown) {
    return (
      <Card withBorder p="lg">
        <Center h={300}>
          <Loader />
        </Center>
      </Card>
    );
  }

  if (breakdown.length === 0) {
    return (
      <Card withBorder p="lg">
        <Stack gap="md" align="center">
          <Text c="dimmed">Ingen data</Text>
        </Stack>
      </Card>
    );
  }

  const COLORS = Object.values(categories).map((cat) => cat.color || '#8884d8');

  const data = breakdown.map((item) => ({
    name: item.categoryId,
    value: item.percentage,
    amount: item.amount,
  }));

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const categoryId = payload[0].name;
      const category = Object.values(categories).find((c) => c.id === categoryId);
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
            {category?.label || 'Unknown'}
          </Text>
          <Text size="sm" c="dimmed">
            {payload[0].value.toFixed(1)}%
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
          Kategoriopdeling
        </Text>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={(props: any) => `${props.value.toFixed(1)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        <Group grow>
          {breakdown.map((item, idx) => {
            const category = Object.values(categories).find((c) => c.id === item.categoryId);
            return (
              <div key={item.categoryId}>
                <Group gap="xs">
                  <Badge
                    size="sm"
                    style={{ backgroundColor: COLORS[idx % COLORS.length], cursor: 'default' }}
                  >
                    {category?.label || 'Unknown'}
                  </Badge>
                </Group>
                <Text size="xs" c="dimmed">
                  {item.amount.toFixed(2)} kr ({item.percentage.toFixed(1)}%)
                </Text>
              </div>
            );
          })}
        </Group>
      </Stack>
    </Card>
  );
}
