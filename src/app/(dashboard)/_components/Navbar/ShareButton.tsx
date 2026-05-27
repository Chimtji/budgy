'use client';

import { useState } from 'react';
import { IconShare } from '@tabler/icons-react';
import {
  ActionIcon,
  CopyButton,
  Group,
  Modal,
  Stack,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { showErrorNotification } from '@/notifications/feedback';
import { createSnapshot } from '@/service/database/share/createSnapshot';
import classes from './Navbar.module.css';

export const ShareButton = () => {
  const [opened, { open, close }] = useDisclosure(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    const result = await createSnapshot();
    setLoading(false);

    if (!result.success) {
      showErrorNotification({ title: 'Del snapshot', message: result.error ?? 'Noget gik galt' });
      return;
    }

    setUrl(result.data.url);
    open();
  };

  return (
    <>
      <Modal opened={opened} onClose={close} title="Del snapshot" centered>
        <Stack gap="md">
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
          <Text size="xs" c="dimmed">
            Linket er gyldigt i ~30 dage uden aktivitet (jsonblob.com).
          </Text>
        </Stack>
      </Modal>

      <Tooltip label="Del snapshot" position="right" withArrow offset={10}>
        <button
          onClick={handleShare}
          disabled={loading}
          className={classes.link}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          <IconShare size={20} stroke={1.5} />
          <Text size="sm" fw={500}>
            {loading ? 'Opretter...' : 'Del snapshot'}
          </Text>
        </button>
      </Tooltip>
    </>
  );
};
