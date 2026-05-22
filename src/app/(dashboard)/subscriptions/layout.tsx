'use client';

import { useState } from 'react';
import { IconPlus } from '@tabler/icons-react';
import { Button, Group, Stack, Text, Title } from '@mantine/core';
import AddMatcherModal from './_components/AddMatcherModal';

export default function SubscriptionsLayout({ children }: { children: React.ReactNode }) {
  const [addOpen, setAddOpen] = useState(false);

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--mantine-spacing-xl) * 2)',
      }}
    >
      <AddMatcherModal opened={addOpen} onClose={() => setAddOpen(false)} />
      <Group justify="space-between" align="flex-end" pb="md" style={{ flexShrink: 0 }}>
        <Stack gap={4}>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
            Abonnementer
          </Title>
          <Text size="sm" c="dimmed">
            Faste betalinger opdaget og bekræftet fra dine transaktioner
          </Text>
        </Stack>
        <Button
          leftSection={<IconPlus size={16} />}
          variant="light"
          onClick={() => setAddOpen(true)}
        >
          Tilføj ny
        </Button>
      </Group>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
