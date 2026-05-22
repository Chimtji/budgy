'use client';

import { Tabs, Group, ActionIcon, Text } from '@mantine/core';
import { IconPencil, IconTrash } from '@tabler/icons-react';

type TDashboard = { id: string; name: string; url: string; position: number };

type TProps = {
  dashboards: TDashboard[];
  onEdit: (d: TDashboard) => void;
  onDelete: (id: string) => void;
};

const GrafanaTabs: React.FC<TProps> = ({ dashboards, onEdit, onDelete }) => {
  const sorted = [...dashboards].sort((a, b) => a.position - b.position);

  return (
    <Tabs defaultValue={sorted[0]?.id}>
      <Tabs.List>
        {sorted.map((d) => (
          <Tabs.Tab key={d.id} value={d.id}>
            <Group gap={6} wrap="nowrap">
              <Text size="sm">{d.name}</Text>
              <ActionIcon
                variant="subtle"
                size="xs"
                onClick={(e) => { e.stopPropagation(); onEdit(d); }}
              >
                <IconPencil size={12} />
              </ActionIcon>
              <ActionIcon
                variant="subtle"
                color="red"
                size="xs"
                onClick={(e) => { e.stopPropagation(); onDelete(d.id); }}
              >
                <IconTrash size={12} />
              </ActionIcon>
            </Group>
          </Tabs.Tab>
        ))}
      </Tabs.List>
      {sorted.map((d) => (
        <Tabs.Panel key={d.id} value={d.id}>
          <iframe
            src={d.url}
            title={d.name}
            style={{ width: '100%', height: 'calc(100vh - 180px)', border: 'none' }}
          />
        </Tabs.Panel>
      ))}
    </Tabs>
  );
};

export default GrafanaTabs;
