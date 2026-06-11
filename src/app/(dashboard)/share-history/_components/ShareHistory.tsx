'use client';

import { useEffect, useState } from 'react';
import { IconLock, IconTrash } from '@tabler/icons-react';
import {
  ActionIcon,
  Badge,
  Button,
  Group,
  Loader,
  Modal,
  Paper,
  Stack,
  Table,
  Text,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { showErrorNotification, showSuccessNotification } from '@/notifications/feedback';
import { getShareHistory } from '@/service/database/share/getShareHistory';
import { revokeShare } from '@/service/database/share/revokeShare';
import type { TShareListEntry } from '@/service/database/share/types';

export const ShareHistory = () => {
  const [shares, setShares] = useState<TShareListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmOpened, { open: openConfirm, close: closeConfirm }] = useDisclosure(false);

  const loadShares = async () => {
    setLoading(true);
    const result = await getShareHistory();
    setLoading(false);

    if (!result.success) {
      showErrorNotification({
        title: 'Fejl',
        message: result.error ?? 'Kunne ikke indlæse delinger',
      });
      return;
    }

    setShares(result.data.shares);
  };

  useEffect(() => {
    loadShares();
  }, []);

  const handleRevokeClick = (shareId: string) => {
    setConfirmId(shareId);
    openConfirm();
  };

  const handleConfirmRevoke = async () => {
    if (!confirmId) return;

    setRevoking(confirmId);
    const result = await revokeShare(confirmId);
    setRevoking(null);
    closeConfirm();

    if (!result.success) {
      showErrorNotification({
        title: 'Fejl',
        message: result.error ?? 'Kunne ikke tilbagekalde deling',
      });
      return;
    }

    showSuccessNotification({ title: 'Succes', message: 'Deling tilbagekaldt' });
    await loadShares();
  };

  const getStatusBadge = (entry: TShareListEntry) => {
    if (entry.status === 'revoked') {
      return <Badge color="red">Tilbagekaldt</Badge>;
    }

    if (entry.expiresAt) {
      const expiresAt = new Date(entry.expiresAt);
      if (new Date() > expiresAt) {
        return <Badge color="gray">Udløbet</Badge>;
      }
      return <Badge color="yellow">Aktiv</Badge>;
    }

    return <Badge color="green">Aktivt</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('da-DK', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <Paper withBorder p="md">
        <Group justify="center">
          <Loader size="sm" />
          <Text c="dimmed">Indlæser delinger...</Text>
        </Group>
      </Paper>
    );
  }

  if (shares.length === 0) {
    return (
      <Paper withBorder p="md">
        <Text c="dimmed" ta="center">
          Ingen delinger endnu
        </Text>
      </Paper>
    );
  }

  return (
    <>
      <Modal opened={confirmOpened} onClose={closeConfirm} title="Bekræft tilbagekaldelse" centered>
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Er du sikker på, at du vil tilbagekalde denne deling? Dette kan ikke omgøres.
          </Text>
          <Group justify="flex-end" gap="sm">
            <Button variant="light" onClick={closeConfirm}>
              Annullér
            </Button>
            <Button color="red" onClick={handleConfirmRevoke} loading={revoking === confirmId}>
              Tilbagekald
            </Button>
          </Group>
        </Stack>
      </Modal>

      <Paper withBorder>
        <Table striped>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Status</Table.Th>
              <Table.Th>Oprettet</Table.Th>
              <Table.Th>Udløber</Table.Th>
              <Table.Th>Beskyttet</Table.Th>
              <Table.Th style={{ width: '100px' }}>Handling</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {shares.map((share) => (
              <Table.Tr key={share.shareId}>
                <Table.Td>{getStatusBadge(share)}</Table.Td>
                <Table.Td>
                  <Text size="sm">{formatDate(share.createdAt)}</Text>
                </Table.Td>
                <Table.Td>
                  <Text size="sm">{share.expiresAt ? formatDate(share.expiresAt) : 'Aldrig'}</Text>
                </Table.Td>
                <Table.Td>
                  {share.passwordProtected ? (
                    <Group gap={4}>
                      <IconLock size={16} />
                      <Text size="sm">Ja</Text>
                    </Group>
                  ) : (
                    <Text size="sm" c="dimmed">
                      Nej
                    </Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    size="sm"
                    color="red"
                    variant="light"
                    onClick={() => handleRevokeClick(share.shareId)}
                    disabled={share.status === 'revoked' || revoking === share.shareId}
                    loading={revoking === share.shareId}
                  >
                    <IconTrash size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>
    </>
  );
};
