'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconCategory,
  IconLayoutDashboard,
  IconReceipt,
  IconRepeat,
  IconTarget,
} from '@tabler/icons-react';
import { Box, Group, Stack, Text, Title, Tooltip } from '@mantine/core';
import classes from '@/app/(dashboard)/_components/Navbar/Navbar.module.css';

type TProps = {
  shareId: string;
};

const navItems = [
  { key: 'overview', label: 'Overblik', icon: IconLayoutDashboard },
  { key: 'transactions', label: 'Transaktioner', icon: IconReceipt },
  { key: 'categories', label: 'Kategorier', icon: IconCategory },
  { key: 'goals', label: 'Budgetmål', icon: IconTarget },
  { key: 'subscriptions', label: 'Regninger', icon: IconRepeat },
];

export const ViewNavbar = ({ shareId }: TProps) => {
  const pathname = usePathname();

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Group gap="xs" align="center">
          <Box className={classes.logo}>B</Box>
          <div>
            <Title order={4} className={classes.title}>
              Budgy
            </Title>
            <Text size="xs" c="dimmed">
              Delt læsevisning
            </Text>
          </div>
        </Group>
      </div>

      <Stack gap={4} className={classes.links}>
        {navItems.map(({ key, label, icon: Icon }) => {
          const href = `/view/${shareId}/${key}`;
          const isActive = pathname.startsWith(href);
          return (
            <Tooltip key={key} label={label} position="right" withArrow offset={10}>
              <Link href={href} className={classes.link} data-active={isActive || undefined}>
                <Icon size={20} stroke={1.5} />
                <Text size="sm" fw={500}>
                  {label}
                </Text>
              </Link>
            </Tooltip>
          );
        })}
      </Stack>
    </nav>
  );
};
