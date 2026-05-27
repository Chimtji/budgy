'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconBuilding,
  IconCategory,
  IconFileImport,
  IconLayoutDashboard,
  IconReceipt,
  IconRepeat,
  IconRobot,
  IconTarget,
} from '@tabler/icons-react';
import { Box, Group, Stack, Text, Title, Tooltip } from '@mantine/core';
import { NotificationBell } from './NotificationBell';
import { ShareButton } from './ShareButton';
import classes from './Navbar.module.css';

const navItems = [
  {
    href: '/overview',
    label: 'Overblik',
    icon: IconLayoutDashboard,
    activePaths: ['/overview/general', '/overview/spending', '/overview/income'],
    subItems: [
      { href: '/overview/general', label: 'Generelt' },
      { href: '/overview/spending', label: 'Udgifter' },
      { href: '/overview/income', label: 'Indkomst' },
    ],
  },
  { href: '/transactions', label: 'Transaktioner', icon: IconReceipt },
  { href: '/categories/list', label: 'Kategorier', icon: IconCategory },
  { href: '/companies', label: 'Virksomheder', icon: IconBuilding },
  { href: '/subscriptions/list', label: 'Regninger', icon: IconRepeat },
  { href: '/goals', label: 'Budgetmål', icon: IconTarget },
  { href: '/rules', label: 'Autoregler', icon: IconRobot },
];

export const Navbar = () => {
  const pathname = usePathname();

  return (
    <nav className={classes.navbar}>
      <div className={classes.header}>
        <Group gap="xs" align="center">
          <Box className={classes.logo}>B</Box>
          <Title order={4} className={classes.title}>
            Budgy
          </Title>
        </Group>
      </div>

      <Stack gap={4} className={classes.links}>
        {navItems.map(({ href, label, icon: Icon, subItems, activePaths }) => {
          const isActive = activePaths
            ? activePaths.some((p) => pathname.startsWith(p))
            : pathname.startsWith(href);
          return (
            <Stack key={href} gap={2}>
              <Tooltip label={label} position="right" withArrow offset={10}>
                <Link
                  href={subItems ? subItems[0].href : href}
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
                  {subItems.map((sub) => (
                    <div key={sub.href} className={classes.subLink}>
                      <Link
                        href={sub.href}
                        className={classes.link}
                        data-active={pathname.startsWith(sub.href) || undefined}
                        style={{ paddingTop: 6, paddingBottom: 6, fontSize: 13 }}
                      >
                        <Text size="xs" fw={500}>
                          {sub.label}
                        </Text>
                      </Link>
                    </div>
                  ))}
                </Stack>
              )}
            </Stack>
          );
        })}
        <NotificationBell />
      </Stack>

      <div className={classes.footer}>
        <Tooltip label="Importer CSV" position="right" withArrow offset={10}>
          <Link
            href="/import"
            className={classes.link}
            data-active={pathname.startsWith('/import') || undefined}
          >
            <IconFileImport size={20} stroke={1.5} />
            <Text size="sm" fw={500}>
              Importer CSV
            </Text>
          </Link>
        </Tooltip>
        <ShareButton />
      </div>
    </nav>
  );
};
