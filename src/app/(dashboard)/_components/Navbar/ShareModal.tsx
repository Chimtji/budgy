'use client';

import { useState } from 'react';
import { IconCheck, IconShare, IconX } from '@tabler/icons-react';
import {
  ActionIcon,
  Button,
  Checkbox,
  CopyButton,
  Group,
  Modal,
  NumberInput,
  PasswordInput,
  Radio,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { showErrorNotification } from '@/notifications/feedback';
import { createSnapshot } from '@/service/database/share/createSnapshot';

export const ShareModal = ({ opened, close }: { opened: boolean; close: () => void }) => {
  const [step, setStep] = useState<'options' | 'result'>('options');
  const [password, setPassword] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [expirationMode, setExpirationMode] = useState<'never' | 'custom'>('never');
  const [durationDays, setDurationDays] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [url, setUrl] = useState('');

  const handleCreate = async () => {
    if (usePassword && !password.trim()) {
      showErrorNotification({ title: 'Fejl', message: 'Adgangskode er påkrævet' });
      return;
    }

    if (expirationMode === 'custom' && (!durationDays || durationDays < 1)) {
      showErrorNotification({ title: 'Fejl', message: 'Varighed skal være mindst 1 dag' });
      return;
    }

    setLoading(true);
    const result = await createSnapshot(
      usePassword ? password : undefined,
      expirationMode === 'custom' && durationDays ? durationDays : undefined
    );
    setLoading(false);

    if (!result.success) {
      showErrorNotification({ title: 'Del snapshot', message: result.error ?? 'Noget gik galt' });
      return;
    }

    setUrl(result.data.url);
    setStep('result');
  };

  const handleReset = () => {
    setStep('options');
    setPassword('');
    setUsePassword(false);
    setExpirationMode('never');
    setDurationDays(null);
    setUrl('');
  };

  const handleClose = () => {
    handleReset();
    close();
  };

  return (
    <Modal opened={opened} onClose={handleClose} title="Del snapshot" centered size="sm">
      {step === 'options' ? (
        <Stack gap="md">
          <Text size="sm" c="dimmed">
            Tilpas delingsindstillinger for dit datasnapshot
          </Text>

          <Stack gap="sm">
            <Checkbox
              label="Beskyt med adgangskode"
              checked={usePassword}
              onChange={(e) => setUsePassword(e.currentTarget.checked)}
            />
            {usePassword && (
              <PasswordInput
                label="Adgangskode"
                placeholder="Indtast adgangskode"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
              />
            )}
          </Stack>

          <Stack gap="sm">
            <Text fw={500} size="sm">
              Udløb
            </Text>
            <Radio.Group
              value={expirationMode}
              onChange={(val: string) => setExpirationMode(val as 'never' | 'custom')}
            >
              <Stack gap="xs">
                <Radio value="never" label="Aldrig (deles uden tidsbegrænsning)" />
                <Radio value="custom" label="Sæt et udløb" />
              </Stack>
            </Radio.Group>

            {expirationMode === 'custom' && (
              <NumberInput
                label="Dage før udløb"
                placeholder="7"
                min={1}
                value={durationDays ?? undefined}
                onChange={val => setDurationDays(typeof val === 'number' ? val : null)}
              />
            )}
          </Stack>

          <Group justify="flex-end" gap="sm" mt="lg">
            <Button variant="light" onClick={handleClose}>
              Annullér
            </Button>
            <Button onClick={handleCreate} loading={loading}>
              Opret deling
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Group>
            <IconCheck size={24} color="green" />
            <Text fw={500}>Snapshot delt!</Text>
          </Group>

          <Text size="sm" c="dimmed">
            Del dette link med en ven for at give dem læseadgang til dit datasnapshot.
          </Text>

          <Group gap="xs">
            <TextInput value={url} readOnly style={{ flex: 1 }} />
            <CopyButton value={url}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Kopieret!' : 'Kopiér link'}>
                  <ActionIcon
                    variant="light"
                    color={copied ? 'teal' : 'violet'}
                    size="lg"
                    onClick={copy}
                  >
                    <IconShare size={16} stroke={1.5} />
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>

          {usePassword && (
            <Text size="xs" c="dimmed">
              ✓ Beskyttet med adgangskode
            </Text>
          )}

          {expirationMode === 'never' && (
            <Text size="xs" c="dimmed">
              ✓ Deles uden tidsbegrænsning
            </Text>
          )}

          {expirationMode === 'custom' && (
            <Text size="xs" c="dimmed">
              ✓ Udløber om {durationDays} {durationDays === 1 ? 'dag' : 'dage'}
            </Text>
          )}

          <Button onClick={handleReset} fullWidth>
            Opret anden deling
          </Button>
        </Stack>
      )}
    </Modal>
  );
};
