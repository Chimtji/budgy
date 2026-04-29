'use client';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, Center, Loader, Stack, Text } from '@mantine/core';
import { useTrendData } from '@/stores/stats/statsStore';

export default function TrendChart() {
  const trendData = useTrendData();

  if (!trendData) {
    return (
      <Card withBorder p="lg">
        <Center h={300}>
          <Loader />
        </Center>
      </Card>
    );
  }

  if (trendData.length === 0) {
    return (
      <Card withBorder p="lg">
        <Stack gap="md" align="center">
          <Text c="dimmed">Ingen data</Text>
        </Stack>
      </Card>
    );
  }

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
            {payload[0].payload.month}/{payload[0].payload.year}
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
          Udgiftstrend (sidste 6 måneder)
        </Text>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={trendData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="totalOut"
              stroke="#f03e3e"
              dot={true}
              activeDot={{ r: 6 }}
              name="Udgifter"
            />
          </LineChart>
        </ResponsiveContainer>
      </Stack>
    </Card>
  );
}
