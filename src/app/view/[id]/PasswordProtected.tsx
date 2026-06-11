'use client';

import { useState } from 'react';
import { Box, Button, Group, Paper, PasswordInput, Text, Title } from '@mantine/core';
import { showErrorNotification } from '@/notifications/index';
import type { TSnapshot } from '@/service/database/share/createSnapshot';
import { SharedView } from './SharedView';

type TProps = {
  shareId: string;
  snapshot: TSnapshot;
};

export const PasswordProtected = ({ shareId, snapshot }: TProps) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleSubmit = async () => {
    if (!password.trim()) {
      showErrorNotification({ title: 'Fejl', message: 'Adgangskode er påkrævet' });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch(`/api/share/${shareId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        showErrorNotification({ title: 'Fejl', message: 'Forkert adgangskode' });
        setPassword('');
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);
    } catch {
      showErrorNotification({ title: 'Fejl', message: 'Fejl ved verificering af adgangskode' });
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return <SharedView snapshot={snapshot} />;
  }

  return (
    <Box p="xl" maw={400} mx="auto" mt="xl">
      <Paper withBorder p="md">
        <Title order={3} mb="lg">
          Denne deling er beskyttet
        </Title>
        <Text c="dimmed" size="sm" mb="lg">
          Indtast adgangskoden for at få adgang
        </Text>

        <PasswordInput
          label="Adgangskode"
          placeholder="Indtast adgangskode"
          value={password}
          onChange={(e) => setPassword(e.currentTarget.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleSubmit();
          }}
          disabled={isLoading}
        />

        <Group justify="flex-end" mt="lg">
          <Button onClick={handleSubmit} loading={isLoading}>
            Adgang
          </Button>
        </Group>
      </Paper>
    </Box>
  );
};
