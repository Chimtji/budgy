'use client';

import * as TablerIcons from '@tabler/icons-react';
import { IconPencil, IconPlus, IconTrash } from '@tabler/icons-react';
import { ActionIcon, Button, Card, Group, Stack, Text, ThemeIcon } from '@mantine/core';

type TCategory = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};

type TProps = {
  categories: TCategory[];
  selected: string | null;
  onSelect: (key: string) => void;
  onAdd: () => void;
  onEdit: (c: TCategory) => void;
  onDelete: (key: string) => void;
};

const CategoryList: React.FC<TProps> = ({
  categories,
  selected,
  onSelect,
  onAdd,
  onEdit,
  onDelete,
}) => {
  return (
    <Stack gap="xs">
      <Button leftSection={<IconPlus size={16} />} variant="light" onClick={onAdd}>
        Ny kategori
      </Button>
      {categories.map((c) => {
        const Icon = (TablerIcons as unknown as Record<string, React.ComponentType<{ size?: number; stroke?: number }>>)[c.icon];
        return (
          <Card
            key={c.key}
            withBorder
            padding="sm"
            style={{
              cursor: 'pointer',
              borderColor: selected === c.key ? 'var(--mantine-color-violet-5)' : undefined,
              backgroundColor: selected === c.key ? 'var(--mantine-color-violet-0)' : undefined,
            }}
            onClick={() => onSelect(c.key)}
          >
            <Group justify="space-between" wrap="nowrap">
              <Group gap="sm" wrap="nowrap">
                <ThemeIcon color={c.color} variant="light" size="md" radius="sm">
                  {Icon ? <Icon size={16} stroke={1.5} /> : null}
                </ThemeIcon>
                <Text size="sm" fw={selected === c.key ? 600 : 400}>
                  {c.label}
                </Text>
              </Group>
              <Group gap={4} wrap="nowrap">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(c);
                  }}
                >
                  <IconPencil size={14} />
                </ActionIcon>
                <ActionIcon
                  variant="subtle"
                  color="red"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(c.key);
                  }}
                >
                  <IconTrash size={14} />
                </ActionIcon>
              </Group>
            </Group>
          </Card>
        );
      })}
    </Stack>
  );
};

export default CategoryList;

