'use client';

import { useState } from 'react';
import { IconAlertCircle, IconRefresh } from '@tabler/icons-react';
import { Alert, Button, Group, Text } from '@mantine/core';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { syncTransactionsFromBank as syncAction } from '@/service/database/transactions/sync';
import { useAppStore } from '@/stores/app/appStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';

export default function SyncButton() {
  const [isLoading, setIsLoading] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fetchByMonth = useTransactionsStore((state) => state.actions.fetchByMonth);
  const year = useAppStore((state) => state.year);
  const currentMonth = new Date().getMonth() + 1;

  const handleSync = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('Starting sync...');
      const result = await syncAction();
      console.log('Sync result:', result);

      if (result.success) {
        console.log('Sync succeeded, displaying success notification');
        showSuccessNotification({
          title: 'Synkronisering fuldført',
          message: `${result.data.imported} transaktioner importeret`,
        });
        setLastSyncTime(new Date().toLocaleTimeString('da-DK'));
        fetchByMonth(year, currentMonth);
      } else {
        console.log('Sync failed with error:', result.error);
        showErrorNotification({
          title: 'Synkronisering fejlede',
          message: result.error,
        });
        setError(result.error);
      }
    } catch (error) {
      console.error('Sync threw exception:', error);
      const errorMessage = error instanceof Error ? error.message : 'Ukendt fejl';
      showErrorNotification({
        title: 'Synkronisering fejlede',
        message: errorMessage,
      });
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {error && (
        <Alert icon={<IconAlertCircle />} color="red" mb="md">
          {error}
        </Alert>
      )}
      <Group justify="space-between">
        <Group>
          <Button leftSection={<IconRefresh size={16} />} onClick={handleSync} loading={isLoading}>
            Synkroniser med bank
          </Button>
          {lastSyncTime && (
            <Text size="sm" c="dimmed">
              Sidst synkroniseret: {lastSyncTime}
            </Text>
          )}
        </Group>
      </Group>
    </div>
  );
}
