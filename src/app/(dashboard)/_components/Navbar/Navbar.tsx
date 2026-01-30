'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Icon,
  IconCash,
  IconCategory,
  IconDashboard,
  IconReceipt,
  IconReceipt2,
  IconTargetArrow,
} from '@tabler/icons-react';
import { Box, Code, Group, Indicator, Select, Stack, Title } from '@mantine/core';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import ForceGetButton from './ForceGetButton';
import SyncButton from './SyncButton';
import classes from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);

  const pending = useTransactionsStore((state) => state.pendingTransactions);

  const data = [
    { link: '/overview', label: 'Overblik', icon: IconDashboard },
    {
      link: '/transactions',
      label: 'Transaktioner',
      icon: IconCash,
      indicator: Object.keys(pending).length,
    },
    { link: '/categories', label: 'Kategorier', icon: IconCategory },
    { link: '/bills', label: 'Faste Regninger', icon: IconReceipt },
  ];

  const NavItem = ({
    link,
    label,
    icon,
    indicator,
  }: {
    link: string;
    label: string;
    icon: Icon;
    indicator?: number;
  }) => {
    const Icon = icon;

    return (
      <Link
        className={classes.link}
        data-active={link === active || undefined}
        href={link}
        key={label}
        onClick={(event) => {
          setActive(link);
        }}
      >
        <Icon className={classes.linkIcon} stroke={1.5} />
        <Box component="span" visibleFrom="xl">
          {label}
        </Box>
      </Link>
    );
  };

  return (
    <>
      <nav className={classes.navbar}>
        <div className={classes.navbarMain}>
          <Group className={classes.header} justify="space-between">
            <Title hiddenFrom="xl">B</Title>
            <Title visibleFrom="xl">Budgy</Title>
          </Group>
          <Stack gap="xs">
            <Select
              placeholder="Vælg år"
              data={['2025', '2024', '2023', '2022']}
              defaultValue="2025"
            />
            {data.map((item) => (
              <NavItem {...item} key={item.label} />
            ))}
          </Stack>
        </div>

        <div className={classes.footer}>
          <ForceGetButton />
          <SyncButton />
        </div>
      </nav>
    </>
  );
}
