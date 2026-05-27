'use client';

import { IconInfoCircle } from '@tabler/icons-react';
import { Card, Group, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';

export type TSegmentAmount = { key: string; label: string; amount: number; color: string };

type TProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  segments: TSegmentAmount[];
  infoText: string;
};

const SegmentBreakdownCard: React.FC<TProps> = ({
  label,
  value,
  icon,
  color,
  segments,
  infoText,
}) => {
  const total = segments.reduce((s, seg) => s + seg.amount, 0);
  const activeSegments = segments.filter((s) => s.amount > 0).sort((a, b) => b.amount - a.amount);

  const tooltipContent = (
    <Stack gap={4}>
      <Text size="xs">{infoText}</Text>
      {total > 0 && activeSegments.length > 0 && (
        <>
          <Text size="xs" c="dimmed" mt={4}>
            Fordeling:
          </Text>
          {activeSegments.map((s) => (
            <Group key={s.key} justify="space-between" gap="xs">
              <Text size="xs">{s.label}</Text>
              <Text size="xs" fw={600}>
                {Math.round((s.amount / total) * 100)}%
              </Text>
            </Group>
          ))}
        </>
      )}
    </Stack>
  );

  return (
    <Card withBorder p="md" style={{ height: '100%' }}>
      <Group justify="space-between" mb={6} wrap="nowrap">
        <Group gap={8} wrap="nowrap">
          <ThemeIcon size={22} radius="md" variant="light" color={color}>
            {icon}
          </ThemeIcon>
          <Text size="xs" c="dimmed" tt="uppercase" fw={700} style={{ letterSpacing: '0.06em' }}>
            {label}
          </Text>
        </Group>
        <Tooltip label={tooltipContent} multiline w={220} withArrow position="top-end">
          <IconInfoCircle
            size={15}
            stroke={1.5}
            style={{ color: 'var(--mantine-color-gray-5)', cursor: 'default', flexShrink: 0 }}
          />
        </Tooltip>
      </Group>
      <Text fw={800} style={{ fontSize: 22, letterSpacing: '-0.5px', lineHeight: 1 }}>
        {value}{' '}
        <Text span size="xs" c="dimmed" fw={400}>
          / md.
        </Text>
      </Text>
    </Card>
  );
};

export default SegmentBreakdownCard;
