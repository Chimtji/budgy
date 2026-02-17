'use client';

import { useEffect, useLayoutEffect, type FC, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/stores/app/appStore';
import { useBillsStore } from '@/stores/bills/billsStore';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';
import { useUserStore } from '@/stores/user/userStore';

type TProps = { children: ReactNode };

const State: FC<TProps> = ({ children }) => {
  const { login, loggedIn } = useUserStore(
    useShallow((state) => ({
      login: state.login,
      loggedIn: state.loggedIn,
    }))
  );
  const initTransactions = useTransactionsStore((state) => state.initTransactions);
  const initCompanies = useCompaniesStore((state) => state.initCompanies);
  const router = useRouter();

  const setYear = useAppStore((state) => state.setYear);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  // useLayoutEffect(() => {
  //   login();
  //   initTransactions();
  //   initCompanies();
  //   initBills();
  // }, []);

  // useEffect(() => {
  //   if (!loggedIn) {
  //     router.push('/login');
  //   }
  // }, [loggedIn]);

  return children;
};

export default State;
