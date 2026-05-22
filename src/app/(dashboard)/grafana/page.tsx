'use client';

import { useEffect, useState } from 'react';
import { Stack, Title, Group, Button, Text } from '@mantine/core';
import { IconPlus } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { useGrafanaStore } from '@/stores/grafana/grafanaStore';
import GrafanaTabs from './_components/GrafanaTabs';
import DashboardModal from './_components/DashboardModal';

type TDashboard = { id: string; name: string; url: string; position: number };

const GrafanaPage: React.FC = () => {
  const { dashboards, addDashboard, updateDashboard, removeDashboard } = useGrafanaStore(
    useShallow((s) => ({
      dashboards: s.dashboards,
      addDashboard: s.addDashboard,
      updateDashboard: s.updateDashboard,
      removeDashboard: s.removeDashboard,
    }))
  );

  const [showModal, setShowModal] = useState(false);
  const [editingDashboard, setEditingDashboard] = useState<TDashboard | undefined>(undefined);

  useEffect(() => {
    useGrafanaStore.getState().init();
  }, []);

  const handleSave = (data: { name: string; url: string }) => {
    if (editingDashboard) {
      updateDashboard({ ...editingDashboard, ...data });
    } else {
      addDashboard(data);
    }
  };

  const handleEdit = (d: TDashboard) => {
    setEditingDashboard(d);
    setShowModal(true);
  };

  const closeModal = () => { setShowModal(false); setEditingDashboard(undefined); };

  return (
    <Stack gap="lg">
      <Group justify="space-between" align="flex-end">
        <Stack gap={4}>
          <Title order={2} fw={700} style={{ letterSpacing: '-0.5px' }}>Grafana Dashboards</Title>
          <Text size="sm" c="dimmed">{dashboards.length} dashboards konfigureret</Text>
        </Stack>
        <Button leftSection={<IconPlus size={16} />} onClick={() => setShowModal(true)}>
          Tilføj dashboard
        </Button>
      </Group>
      {dashboards.length === 0 ? (
        <Text c="dimmed" size="sm">Ingen dashboards tilføjet endnu.</Text>
      ) : (
        <GrafanaTabs
          dashboards={dashboards}
          onEdit={handleEdit}
          onDelete={removeDashboard}
        />
      )}
      {showModal && (
        <DashboardModal
          dashboard={editingDashboard}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </Stack>
  );
};

export default GrafanaPage;
