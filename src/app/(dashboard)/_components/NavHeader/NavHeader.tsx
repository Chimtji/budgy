import { UserButton } from '@neondatabase/auth/react';
import { IconBell, IconNotification } from '@tabler/icons-react';
import { ActionIcon, Box, Flex, Group } from '@mantine/core';
import classes from './NavHeader.module.css';

const NavHeader = () => {
  return (
    <header className={classes.header}>
      <Flex className={classes.inner} justify="right" ml="xl" mr="xl">
        <Group gap={20}>
          <ActionIcon radius="md" variant="subtle" size="xl">
            <IconBell stroke={1.5} />
          </ActionIcon>
          <UserButton className={classes.userButton} variant="ghost" />
        </Group>
      </Flex>
    </header>
  );
};

export default NavHeader;
