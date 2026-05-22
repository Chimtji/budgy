'use client';

import * as TablerIcons from '@tabler/icons-react';
import {
  IconChevronDown,
  IconChevronRight,
  IconPencil,
  IconPlus,
  IconTrash,
} from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Stack,
  Text,
  ThemeIcon,
  UnstyledButton,
} from '@mantine/core';

type TCategory = {
  id: string;
  key: string;
  label: string;
  color: string;
  icon: string;
  description: string;
};
type TSegment = {
  id: string;
  key: string;
  category_key: string;
  label: string;
  description: string;
};

type TProps = {
  categories: TCategory[];
  segments: TSegment[];
  selected: string | null;
  onSelect: (key: string) => void;
  onAddCategory: () => void;
  onEditCategory: (c: TCategory) => void;
  onDeleteCategory: (key: string) => void;
  onAddSegment: (categoryKey: string) => void;
  onEditSegment: (s: TSegment) => void;
  onDeleteSegment: (id: string) => void;
};

const CategoryPanel: React.FC<TProps> = ({
  categories,
  segments,
  selected,
  onSelect,
  onAddCategory,
  onEditCategory,
  onDeleteCategory,
  onAddSegment,
  onEditSegment,
  onDeleteSegment,
}) => {
  return (
    <Stack gap="xs">
      <Button leftSection={<IconPlus size={16} />} variant="light" onClick={onAddCategory}>
        Ny kategori
      </Button>

      {categories.map((c) => {
        const Icon = (
          TablerIcons as unknown as Record<
            string,
            React.ComponentType<{ size?: number; stroke?: number }>
          >
        )[c.icon];
        const catSegments = segments.filter((s) => s.category_key === c.key);
        const isOpen = selected === c.key;

        return (
          <Stack
            key={c.key}
            gap={0}
            style={{
              border: `1px solid ${isOpen ? `var(--mantine-color-${c.color}-5)` : 'var(--mantine-color-default-border)'}`,
              borderRadius: 8,
              overflow: 'hidden',
              background: isOpen ? `var(--mantine-color-${c.color}-light)` : undefined,
            }}
          >
            <UnstyledButton onClick={() => onSelect(c.key)} style={{ padding: '10px 12px' }}>
              <Group justify="space-between" wrap="nowrap">
                <Group gap="sm" wrap="nowrap">
                  {isOpen ? <IconChevronDown size={14} /> : <IconChevronRight size={14} />}
                  <ThemeIcon color={c.color} variant="light" size="sm" radius="sm">
                    {Icon ? <Icon size={14} stroke={1.5} /> : null}
                  </ThemeIcon>
                  <Text size="sm" fw={600}>
                    {c.label}
                  </Text>
                  <Badge variant="light" color="gray" radius="sm" size="xs">
                    {catSegments.length}
                  </Badge>
                </Group>
                <Group gap={4} wrap="nowrap" onClick={(e) => e.stopPropagation()}>
                  <ActionIcon variant="subtle" size="sm" onClick={() => onEditCategory(c)}>
                    <IconPencil size={13} />
                  </ActionIcon>
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    size="sm"
                    onClick={() => onDeleteCategory(c.key)}
                  >
                    <IconTrash size={13} />
                  </ActionIcon>
                </Group>
              </Group>
            </UnstyledButton>

            {isOpen && (
              <Stack
                gap={0}
                style={{
                  borderTop: '1px solid var(--mantine-color-default-border)',
                  padding: '8px 12px',
                }}
              >
                {catSegments.map((s) => (
                  <Group key={s.id} justify="space-between" wrap="nowrap" py={4}>
                    <Text size="sm" c="dimmed" style={{ paddingLeft: 22 }}>
                      {s.label}
                    </Text>
                    <Group gap={4} wrap="nowrap">
                      <ActionIcon variant="subtle" size="xs" onClick={() => onEditSegment(s)}>
                        <IconPencil size={12} />
                      </ActionIcon>
                      <ActionIcon
                        variant="subtle"
                        color="red"
                        size="xs"
                        onClick={() => onDeleteSegment(s.id)}
                      >
                        <IconTrash size={12} />
                      </ActionIcon>
                    </Group>
                  </Group>
                ))}
                {catSegments.length === 0 && (
                  <Text size="xs" c="dimmed" style={{ paddingLeft: 22, paddingBottom: 4 }}>
                    Ingen segmenter endnu
                  </Text>
                )}
                <Button
                  variant="subtle"
                  size="xs"
                  leftSection={<IconPlus size={12} />}
                  mt={4}
                  style={{ alignSelf: 'flex-start', marginLeft: 14 }}
                  onClick={() => onAddSegment(c.key)}
                >
                  Nyt segment
                </Button>
              </Stack>
            )}
          </Stack>
        );
      })}
    </Stack>
  );
};

export default CategoryPanel;
