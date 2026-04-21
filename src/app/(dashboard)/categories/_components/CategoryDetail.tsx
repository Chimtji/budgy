'use client';

import * as Icons from '@tabler/icons-react';
import { Button, Card, Drawer, Group, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { TCategory } from '@/service/database/categories/getCategories';

const getIcon = (iconName: string) => {
  const IconComponent = (Icons as Record<string, any>)[iconName] || Icons.IconQuestionMark;
  return IconComponent;
};

const CategoryDetail = ({
  category,
  opened,
  onClose,
}: {
  category: TCategory;
  opened: boolean;
  onClose: () => void;
}) => {
  const IconComponent = getIcon(category.icon);

  return (
    <Drawer opened={opened} onClose={onClose} position="right" zIndex={300}>
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div style={{ paddingBottom: 'var(--mantine-spacing-xl)' }}>
          <Group gap="md">
            <ThemeIcon size="lg" radius="md" variant="light" color={category.color}>
              {IconComponent && <IconComponent size={24} />}
            </ThemeIcon>
            <div style={{ flex: 1 }}>
              <Title order={3} size="h4">
                {category.label}
              </Title>
              <Text size="xs" c="dimmed" mt={2}>
                {category.segments.length} segmenter
              </Text>
            </div>
          </Group>
        </div>

        <Stack
          gap="md"
          style={{ flex: 1, overflowY: 'auto', paddingRight: 'var(--mantine-spacing-md)' }}
        >
          <Text size="sm" c="dimmed">
            {category.description}
          </Text>

          {category.segments.length > 0 && (
            <Stack gap="md" mt="lg">
              <Title order={4}>Segmenter</Title>
              <Stack gap="sm">
                {category.segments.map((segment) => (
                  <Card key={segment.id} shadow="xs" padding="md" radius="md" withBorder>
                    <Group justify="space-between" mb="xs">
                      <Text fw={500} size="sm">
                        {segment.label}
                      </Text>
                    </Group>
                    <Text size="xs" c="dimmed" lineClamp={2}>
                      {segment.description}
                    </Text>
                  </Card>
                ))}
              </Stack>
            </Stack>
          )}

          {category.segments.length === 0 && (
            <Text c="dimmed" size="sm" mt="lg">
              Ingen segmenter i denne kategori
            </Text>
          )}
        </Stack>

        <Group
          justify="flex-end"
          gap="md"
          style={{ paddingTop: 'var(--mantine-spacing-md)', marginTop: 'auto' }}
        >
          <Button variant="subtle" onClick={onClose}>
            Tilbage
          </Button>
        </Group>
      </div>
    </Drawer>
  );
};

export default CategoryDetail;
