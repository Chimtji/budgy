'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app/appStore';
import { useCategoriesStore } from '@/stores/categories/categoriesStore';
import { useCompaniesStore } from '@/stores/companies/companiesStore';
import { useGoalsStore } from '@/stores/goals/goalsStore';
import { useGrafanaStore } from '@/stores/grafana/grafanaStore';
import { useTransactionsStore } from '@/stores/transactions/transactionsStore';

type TProps = {
  children: React.ReactNode;
};

const State = ({ children }: TProps) => {
  useEffect(() => {
    if (useAppStore.getState().isReadOnly) return;

    useCategoriesStore.getState().initCategories();
    useCompaniesStore.getState().init();
    useGoalsStore.getState().init();
    useTransactionsStore.getState().init();
    useGrafanaStore.getState().init();
  }, []);

  return <>{children}</>;
};

export default State;
