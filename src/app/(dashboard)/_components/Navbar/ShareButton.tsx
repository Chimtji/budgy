'use client';

import { IconShare } from '@tabler/icons-react';
import { ActionIcon, Stack, Text, Tooltip } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { ShareModal } from './ShareModal';
import classes from './Navbar.module.css';

export const ShareButton = () => {
  const [opened, { open, close }] = useDisclosure(false);

  return (
    <>
      <ShareModal opened={opened} close={close} />

      <Tooltip label="Del snapshot" position="right" withArrow offset={10}>
        <button
          onClick={open}
          className={classes.link}
          style={{
            background: 'none',
            border: 'none',
            width: '100%',
            cursor: 'pointer',
          }}
        >
          <IconShare size={20} stroke={1.5} />
          <Text size="sm" fw={500}>
            Del snapshot
          </Text>
        </button>
      </Tooltip>
    </>
  );
};
