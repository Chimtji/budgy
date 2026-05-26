'use client';

import * as TablerIcons from '@tabler/icons-react';
import { IconPencil, IconTarget, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Badge, Box, Group, Paper, Progress, Text, ThemeIcon } from '@mantine/core';

const formatDKK = (n: number) =>
  new Intl.NumberFormat('da-DK', {
    style: 'currency',
    currency: 'DKK',
    maximumFractionDigits: 0,
  }).format(n);

const MONTH_LABELS: Record<string, string> = {
  '01': 'jan.', '02': 'feb.', '03': 'mar.', '04': 'apr.',
  '05': 'maj', '06': 'jun.', '07': 'jul.', '08': 'aug.',
  '09': 'sep.', '10': 'okt.', '11': 'nov.', '12': 'dec.',
};

function formatShortDate(dateStr: string) {
  const [y, m] = dateStr.split('-');
  return `${MONTH_LABELS[m]} ${y}`;
}

type TGoalCardProps = {
  name: string;
  categoryLabel: string;
  categoryColor: string;
  categoryIcon: string;
  segmentLabel: string | null; // null = alle segmenter
  /** null when no limit is set for the viewed month */
  amountLimit: number | null;
  effectiveFrom: string | null;
  spent: number;
  onEdit: () => void;
  onDelete: () => void;
};

export default function GoalCard({
  name,
  categoryLabel,
  categoryColor,
  categoryIcon,
  segmentLabel,
  amountLimit,
  effectiveFrom,
  spent,
  onEdit,
  onDelete,
}: TGoalCardProps) {
  const hasLimit = amountLimit !== null;
  const pct = hasLimit && amountLimit > 0 ? Math.min((spent / amountLimit) * 100, 100) : 0;
  const over = hasLimit && spent > amountLimit;
  const approaching = !over && pct >= 80;
  const progressColor = over ? 'red' : approaching ? 'orange' : 'green';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const IconComponent = (TablerIcons as any)[categoryIcon] ?? IconTarget;

  return (
    <Paper withBorder p="md" radius="md">
      <Group justify="space-between" mb={4}>
        <Text fw={700} size="sm">{name}</Text>
        <Group gap={4}>
          <ActionIcon variant="subtle" color="gray" size="sm" onClick={onEdit}>
            <IconPencil size={14} stroke={1.5} />
          </ActionIcon>
          <ActionIcon variant="subtle" color="red" size="sm" onClick={onDelete}>
            <IconTrash size={14} stroke={1.5} />
          </ActionIcon>
        </Group>
      </Group>

      <Group gap="xs" mb="sm">
        <ThemeIcon color={categoryColor} variant="light" size="sm" radius="sm">
          <IconComponent size={14} stroke={1.5} />
        </ThemeIcon>
        <Text size="xs" c="dimmed">
          {categoryLabel}{segmentLabel ? ` · ${segmentLabel}` : ' · Alle segmenter'}
        </Text>
      </Group>

      {hasLimit && effectiveFrom ? (
        <>
          <Text size="xs" c="dimmed" mb="xs">
            Loft: {formatDKK(amountLimit)} / md. &middot; Gælder fra {formatShortDate(effectiveFrom)}
          </Text>
          <Progress value={pct} color={progressColor} size="sm" radius="xl" mb="xs" />
          <Group justify="space-between">
            <Box>
              <Text size="sm" fw={500} c={over ? 'red' : 'dark'}>
                {formatDKK(spent)}
              </Text>
              <Text size="xs" c="dimmed">brugt</Text>
            </Box>
            <Badge variant="light" color={progressColor} radius="sm" size="sm">
              {over
                ? `+${formatDKK(spent - amountLimit)} over`
                : `${formatDKK(amountLimit - spent)} tilbage`}
            </Badge>
          </Group>
        </>
      ) : (
        <Group justify="space-between" align="center">
          <Box>
            <Text size="sm" fw={500}>{formatDKK(spent)}</Text>
            <Text size="xs" c="dimmed">brugt</Text>
          </Box>
          <Text size="xs" c="dimmed">Intet loft sat</Text>
        </Group>
      )}
    </Paper>
  );
}
