'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { IconBell } from '@tabler/icons-react';
import { useShallow } from 'zustand/shallow';
import { Indicator, Text, Tooltip } from '@mantine/core';
import { detectNotifications } from '@/service/notifications/detector';
import { useNotificationsStore } from '@/stores/notifications/notificationsStore';
import { useSubscriptionsStore } from '@/stores/subscriptions/subscriptionsStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import classes from './Navbar.module.css';

export const NotificationBell: React.FC = () => {
  const pathname = usePathname();
  const isActive = pathname.startsWith('/notifikationer');

  const transactions = useTransactionsStore((s) => s.transactions);
  const matchers = useSubscriptionsStore((s) => s.matchers);
  const { dismissedIds } = useNotificationsStore(
    useShallow((s) => ({ dismissedIds: s.dismissedIds }))
  );

  const unreadCount = useMemo(() => {
    const all = detectNotifications(transactions, matchers);
    return all.filter((n) => !dismissedIds.includes(n.id)).length;
  }, [transactions, matchers, dismissedIds]);

  return (
    <Tooltip label="Notifikationer" position="right" withArrow offset={10}>
      <Link href="/notifikationer" className={classes.link} data-active={isActive || undefined}>
        <Indicator
          color="red"
          size={16}
          label={unreadCount > 0 ? String(unreadCount) : undefined}
          disabled={unreadCount === 0}
          offset={4}
          styles={{ indicator: { fontSize: 10, fontWeight: 700, minWidth: 16, height: 16 } }}
        >
          <IconBell size={20} stroke={1.5} />
        </Indicator>
        <Text size="sm" fw={500}>
          Notifikationer
        </Text>
      </Link>
    </Tooltip>
  );
};
