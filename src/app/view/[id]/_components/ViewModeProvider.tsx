'use client';

import { useEffect } from 'react';
import { useAppStore } from '@/stores/app/appStore';

type TProps = {
  children: React.ReactNode;
};

export const ViewModeProvider = ({ children }: TProps) => {
  useEffect(() => {
    useAppStore.getState().setReadOnly(true);
    return () => {
      useAppStore.getState().setReadOnly(false);
    };
  }, []);

  return <>{children}</>;
};
