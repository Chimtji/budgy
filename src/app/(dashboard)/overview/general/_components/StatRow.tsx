'use client';

import { IconInfoCircle } from '@tabler/icons-react';
import { Group, Stack, Text, ThemeIcon, Tooltip, UnstyledButton } from '@mantine/core';

export type TSegmentAmount = { key: string; label: string; amount: number; color: string };

type TProps = {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  segments: TSegmentAmount[];
  infoText: string;
  onClick?: () => void;
};

const StatRow: React.FC<TProps> = ({ label, value, icon, color, segments, infoText, onClick }) => {
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
    <UnstyledButton
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '8px 4px',
        borderRadius: 6,
        cursor: onClick ? 'pointer' : undefined,
        width: '100%',
      }}
      styles={{ root: { '&:hover': { background: 'var(--mantine-color-default-hover)' } } }}
    >
      <ThemeIcon size={28} radius="md" variant="light" color={color} style={{ flexShrink: 0 }}>
        {icon}
      </ThemeIcon>
      <Stack gap={0} style={{ flex: 1, minWidth: 0 }}>
        <Text
          size="xs"
          c="dimmed"
          fw={600}
          tt="uppercase"
          style={{ letterSpacing: '0.05em', lineHeight: 1.2 }}
        >
          {label}
        </Text>
        <Text fw={800} style={{ fontSize: 18, letterSpacing: '-0.5px', lineHeight: 1.1 }}>
          {value}{' '}
          <Text span size="xs" c="dimmed" fw={400}>
            / md.
          </Text>
        </Text>
      </Stack>
      <Tooltip label={tooltipContent} multiline w={220} withArrow position="top-end">
        <IconInfoCircle
          size={15}
          stroke={1.5}
          style={{ color: 'var(--mantine-color-gray-5)', cursor: 'default', flexShrink: 0 }}
          onClick={(e) => e.stopPropagation()}
        />
      </Tooltip>
    </UnstyledButton>
  );
};

export default StatRow;
