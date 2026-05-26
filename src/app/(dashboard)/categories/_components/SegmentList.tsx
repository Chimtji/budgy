'use client';

import { Stack, Group, Button, Card, Text, ActionIcon } from '@mantine/core';
import { IconPencil, IconTrash, IconPlus } from '@tabler/icons-react';

type TSegment = { id: string; key: string; category_key: string; label: string; description: string };

type TProps = {
  categoryKey: string;
  segments: TSegment[];
  onAdd: () => void;
  onEdit: (s: TSegment) => void;
  onDelete: (id: string) => void;
};

const SegmentList: React.FC<TProps> = ({ categoryKey, segments, onAdd, onEdit, onDelete }) => {
  const filtered = segments.filter((s) => s.category_key === categoryKey);

  return (
    <Stack gap="xs">
      <Button leftSection={<IconPlus size={16} />} variant="light" onClick={onAdd}>
        Nyt segment
      </Button>
      {filtered.map((s) => (
        <Card key={s.id} withBorder padding="sm">
          <Group justify="space-between" wrap="nowrap">
            <Text size="sm">{s.label}</Text>
            <Group gap={4} wrap="nowrap">
              <ActionIcon variant="subtle" size="sm" onClick={() => onEdit(s)}>
                <IconPencil size={14} />
              </ActionIcon>
              <ActionIcon variant="subtle" color="red" size="sm" onClick={() => onDelete(s.id)}>
                <IconTrash size={14} />
              </ActionIcon>
            </Group>
          </Group>
        </Card>
      ))}
      {filtered.length === 0 && (
        <Text size="sm" c="dimmed">Ingen segmenter endnu.</Text>
      )}
    </Stack>
  );
};

export default SegmentList;
