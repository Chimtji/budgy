'use client';

import { useEffect, type FC, type ReactNode } from 'react';
import { useAppStore } from '@/stores/app/appStore';

type TProps = { children: ReactNode };

const State: FC<TProps> = ({ children }) => {
  const setYear = useAppStore((state) => state.setYear);

  useEffect(() => {
    setYear(new Date().getFullYear());
  }, []);

  return children;
};

export default State;
