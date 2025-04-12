'use client';

import { useEffect, useState } from 'react';
import { Button, Container, Select, Title } from '@mantine/core';

export default function HomePage() {
  const [institutions, setInstitutions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/institutions')
      .then((res) => res.json())
      .then((data) => setInstitutions(data));
  }, []);

  const handleConnect = async () => {
    const res = await fetch('/api/requisition', {
      method: 'POST',
      body: JSON.stringify({ institution_id: selected }),
    });
    const data = await res.json();

    if (data.link) {
      window.location.href = data.link; // Redirect to GoCardless auth
    }
  };

  return (
    <Container pt="xl">
      <Title order={2} mb="md">
        Connect Your Bank
      </Title>

      <Select
        searchable
        label="Select your bank"
        placeholder="Choose..."
        data={institutions.map((inst) => ({
          label: inst.name,
          value: inst.id,
        }))}
        value={selected}
        onChange={setSelected}
        mb="md"
      />

      <Button onClick={handleConnect} disabled={!selected}>
        Connect
      </Button>
    </Container>
  );
}
