'use client';

import { IconArrowDownLeft, IconArrowUpRight, IconTrendingUp } from '@tabler/icons-react';
import { Badge, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';
import { useMonthlyStats } from '@/stores/stats/statsStore';

export default function TotalSpendCard() {
  const stats = useMonthlyStats();

  if (!stats) {
    return (
      <Card withBorder p="lg">
        <Text c="dimmed">Loading...</Text>
      </Card>
    );
  }

  const isIncreased = stats.changePercent > 0;
  const trendIcon = isIncreased ? <IconTrendingUp size={16} /> : <IconTrendingUp size={16} />;

  return (
    <Card withBorder p="lg">
      <Stack gap="md">
        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Samlede udgifter
            </Text>
            <Text size="xl" fw={700}>
              {stats.totalOut.toFixed(2)} kr
            </Text>
          </div>
          <ThemeIcon size="lg" variant="light" color="red" radius="md">
            <IconArrowDownLeft size={20} />
          </ThemeIcon>
        </Group>

        <Group justify="space-between">
          <div>
            <Text size="sm" c="dimmed">
              Indkomst
            </Text>
            <Text size="lg" fw={600} c="teal">
              {stats.totalIn.toFixed(2)} kr
            </Text>
          </div>
          <ThemeIcon size="lg" variant="light" color="teal" radius="md">
            <IconArrowUpRight size={20} />
          </ThemeIcon>
        </Group>

        {stats.previousMonthOut > 0 && (
          <Group>
            <Text size="sm">Ændring fra sidste måned:</Text>
            <Badge color={isIncreased ? 'red' : 'green'} variant="light">
              {isIncreased ? '+' : '-'}
              {Math.abs(stats.changePercent).toFixed(1)}%
            </Badge>
          </Group>
        )}
      </Stack>
    </Card>
  );
}
