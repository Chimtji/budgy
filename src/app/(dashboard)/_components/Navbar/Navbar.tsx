'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@neondatabase/auth/react';
import { Icon, IconCalculator, IconCreditCard, IconReceipt, IconTag, IconChartBar } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { Group, Select, Stack, Title } from '@mantine/core';
import { useAppStore } from '@/stores/app/appStore';
import classes from './Navbar.module.css';

const Navbar = () => {
  const pathname = usePathname();
  const [active, setActive] = useState(pathname);
  const [isHovered, setIsHovered] = useState(false);
  const [isFooterHovered, setIsFooterHovered] = useState(false);

  const { year, setYear } = useAppStore(
    useShallow((state) => ({
      year: state.year,
      setYear: state.setYear,
    }))
  );

  const data = [
    { link: '/overview', label: 'Økonomi', icon: IconChartBar },
    { link: '/transactions', label: 'Transaktioner', icon: IconCreditCard },
    { link: '/bills', label: 'Abonnementer', icon: IconReceipt },
    { link: '/categories', label: 'Kategorier', icon: IconTag },
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
        title={label}
      >
        <Icon className={classes.linkIcon} stroke={1.5} />
        <span className={classes.linkLabel}>{label}</span>
      </Link>
    );
  };

  const lastTenYears = Array.from({ length: 10 }, (_, i) => String(new Date().getFullYear() - i));

  return (
    <>
      <nav
        className={classes.navbar}
        data-expanded={isHovered || isFooterHovered ? true : undefined}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className={classes.navbarMain}>
          <Group className={classes.header} justify="space-between">
            <Title>B</Title>
          </Group>
          <Stack gap="xs">
            {/* <Select
              placeholder="Vælg år"
              data={lastTenYears}
              defaultValue={year.toString()}
              onChange={(val) => setYear(parseInt(val!))}
            /> */}
            {data.map((item) => (
              <NavItem {...item} key={item.label} />
            ))}
          </Stack>
        </div>
        <div
          className={classes.footer}
          onMouseEnter={() => setIsFooterHovered(true)}
          onMouseLeave={() => setIsFooterHovered(false)}
        >
          <UserButton className={classes.userButton} variant="ghost" />
        </div>
      </nav>
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: isHovered || isFooterHovered ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0)',
          zIndex: 500,
          pointerEvents: isHovered || isFooterHovered ? 'auto' : 'none',
          transition: 'background-color 0.3s ease',
        }}
        onClick={() => {
          setIsHovered(false);
          setIsFooterHovered(false);
        }}
      />
    </>
  );
};

export default Navbar;
