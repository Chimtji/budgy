'use client';

import { useEffect, useState } from 'react';
import { Button, Modal, Select, Stack, Text, Title } from '@mantine/core';
import { TAPIBank } from '@/service';
import { getBankRequisition, getBanks } from '@/service/server';

const EstablishConnectionModal = ({ open }: { open: boolean }) => {
  const [banks, setBanks] = useState<TAPIBank[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    getBanks().then((res) => res.success && setBanks(res.data));
  }, []);

  const handleConnect = async () => {
    const start = await getBankRequisition(selected as string);

    if (start.success) {
      window.location.href = start.data.redirect;
    }
  };

  return (
    <Modal
      zIndex={300}
      opened={open}
      onClose={() => {}}
      overlayProps={{ blur: 3, backgroundOpacity: 0.5 }}
      centered
      size="30em"
      styles={{ close: { display: 'none' } }}
    >
      <Stack justify="center" align="center" pb="xl" gap="lg">
        <Title order={1} size="3em">
          Authenticate.
        </Title>
        <Text>Choose your bank</Text>
        <Select
          w="20em"
          placeholder="Choose or search"
          data={banks.map((bank) => ({ label: bank.name, value: bank.id }))}
          searchable
          onChange={setSelected}
          nothingFoundMessage="Nothing found..."
        />
        <Button onClick={handleConnect} disabled={!selected}>
          Connect
        </Button>
      </Stack>
    </Modal>
  );
};

export default EstablishConnectionModal;
