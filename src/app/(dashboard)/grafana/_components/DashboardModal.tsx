'use client';

import { useState } from 'react';
import { Modal, Stack, TextInput, Button, Group } from '@mantine/core';

type TDashboard = { id: string; name: string; url: string; position: number };

type TProps = {
  dashboard?: TDashboard;
  onSave: (data: { name: string; url: string }) => void;
  onClose: () => void;
};

const DashboardModal: React.FC<TProps> = ({ dashboard, onSave, onClose }) => {
  const [name, setName] = useState(dashboard?.name ?? '');
  const [url, setUrl] = useState(dashboard?.url ?? '');

  const handleSave = () => {
    if (!name || !url) return;
    onSave({ name, url });
    onClose();
  };

  return (
    <Modal
      opened
      onClose={onClose}
      title={dashboard ? 'Rediger dashboard' : 'Tilføj dashboard'}
    >
      <Stack>
        <TextInput
          label="Navn"
          value={name}
          onChange={(e) => setName(e.currentTarget.value)}
          placeholder="Dashboard navn"
          required
        />
        <TextInput
          label="URL"
          value={url}
          onChange={(e) => setUrl(e.currentTarget.value)}
          placeholder="https://grafana.example.com/d/..."
          required
        />
        <Group justify="flex-end">
          <Button variant="default" onClick={onClose}>Annuller</Button>
          <Button onClick={handleSave}>Gem</Button>
        </Group>
      </Stack>
    </Modal>
  );
};

export default DashboardModal;
