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

const overviewSubItems = [
  { key: 'general', label: 'Generelt' },
  { key: 'spending', label: 'Udgifter' },
  { key: 'income', label: 'Indkomst' },
];

const categorySubItems = [
  { key: 'list', label: 'Liste' },
  { key: 'spending', label: 'Forbrug' },
];

const subscriptionSubItems = [{ key: 'list', label: 'Liste' }];

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
          const subItems =
            key === 'overview'
              ? overviewSubItems
              : key === 'categories'
                ? categorySubItems
                : key === 'subscriptions'
                  ? subscriptionSubItems
                  : null;
          return (
            <Stack key={key} gap={2}>
              <Tooltip label={label} position="right" withArrow offset={10}>
                <Link
                  href={subItems ? `${href}/${subItems[0].key}` : href}
                  className={classes.link}
                  data-active={isActive || undefined}
                >
                  <Icon size={20} stroke={1.5} />
                  <Text size="sm" fw={500}>
                    {label}
                  </Text>
                </Link>
              </Tooltip>
              {subItems && isActive && (
                <Stack gap={2} className={classes.subLinks}>
                  {subItems.map((sub) => {
                    const subHref = `${href}/${sub.key}`;
                    return (
                      <div key={sub.key} className={classes.subLink}>
                        <Link
                          href={subHref}
                          className={classes.link}
                          data-active={pathname.startsWith(subHref) || undefined}
                          style={{ paddingTop: 6, paddingBottom: 6, fontSize: 13 }}
                        >
                          <Text size="xs" fw={500}>
                            {sub.label}
                          </Text>
                        </Link>
                      </div>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          );
        })}
      </Stack>
    </nav>
  );
};
