'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Icon, IconReceipt } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { Box, Group, Select, Stack, Title } from '@mantine/core';
import { useAppStore } from '@/stores/app/appStore';
import classes from './Navbar.module.css';

const Navbar = () => {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);

  const { year, setYear } = useAppStore(
    useShallow((state) => ({
      year: state.year,
      setYear: state.setYear,
    }))
  );

  const data = [{ link: '/bills', label: 'Faste Regninger', icon: IconReceipt }];

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

  const lastTenYears = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

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
              data={lastTenYears}
              defaultValue={year.toString()}
              onChange={(val) => setYear(parseInt(val!))}
            />
            {data.map((item) => (
              <NavItem {...item} key={item.label} />
            ))}
          </Stack>
        </div>
      </nav>
    </>
  );
};

export default Navbar;
