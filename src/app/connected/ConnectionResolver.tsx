'use client';

import { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useShallow } from 'zustand/shallow';
import { Loader } from '@mantine/core';
import { hasValidConnectionRef } from '@/service/server';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { useUserStore } from '@/stores/user/userStore';

const ConnectionResolver = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { deleteAllAccess, authenticate } = useUserStore(
    useShallow((state) => ({
      deleteAllAccess: state.deleteAllAccess,
      authenticate: state.authenticate,
    }))
  );

  useEffect(() => {
    const ref = searchParams.get('ref');

    // This is very unique for this component,
    // so we don't centralise this logic in the user store.
    const run = async () => {
      if (!ref) {
        deleteAllAccess();
        router.push('/login');
        return;
      }

      const response = await hasValidConnectionRef(ref);
      if (!response.success) {
        deleteAllAccess();
        router.push('/login');
      }

      authenticate();
      await useTransactionsStore.getState().syncTransactions();

      router.push('/overview');
    };

    run();
  }, [searchParams, router]);

  return <Loader />;
};

export default ConnectionResolver;
