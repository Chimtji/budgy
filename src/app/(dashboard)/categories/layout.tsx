'use client';

import { Group, Title } from '@mantine/core';

export default function CategoriesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--mantine-spacing-xl) * 2)',
      }}
    >
      <Group align="center" pb="md" style={{ flexShrink: 0 }}>
        <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>
          Kategorier
        </Title>
      </Group>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
