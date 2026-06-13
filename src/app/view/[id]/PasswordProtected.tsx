'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Box, Button, Group, Paper, PasswordInput, Text, Title } from '@mantine/core';
import { showErrorNotification } from '@/notifications/index';

type TProps = {
  shareId: string;
};

export const PasswordProtected = ({ shareId }: TProps) => {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

      router.refresh();
    } catch {
      showErrorNotification({ title: 'Fejl', message: 'Fejl ved verificering af adgangskode' });
      setIsLoading(false);
    }
  };

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
