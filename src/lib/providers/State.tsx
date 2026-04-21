'use client';

import { useEffect, useRef, useState, type FC, type ReactNode } from 'react';
import { useAuthenticate } from '@neondatabase/auth/react';
import { useShallow } from 'zustand/shallow';
import { useAppStore } from '@/stores/app/appStore';

type TProps = { children: ReactNode };

const State: FC<TProps> = ({ children }) => {
  const { user } = useAuthenticate();
  const { setYear, userId, setUserId, cleanData } = useAppStore(
    useShallow((state) => ({
      setYear: state.setYear,
      userId: state.userId,
      setUserId: state.setUserId,
      cleanData: state.cleanData,
    }))
  );
  const [isSynced, setIsSynced] = useState(false);
  // const syncedRef = useRef(false);

  useEffect(() => {
    if (user) {
      const incomingId = user.id;
      const persistedId = userId;

      if (incomingId !== persistedId) {
        console.log('This is not the previous user.', incomingId, persistedId);
        cleanData().then((result) => {
          setUserId(incomingId);
        });
      } else {
        setUserId(incomingId);
      }

      setYear(new Date().getFullYear());
      setIsSynced(true);
    }
  }, [user?.id]);

  // useEffect(() => {
  //   const syncAuth = async () => {
  //     if (syncedRef.current) return; // Prevent multiple syncs

  //     if (user) {
  //       if (user.id !== userId) {
  //         await cleanData();
  //       }
  //       setUserId(user.id);
  //     }

  //     console.log('resolved state');
  //     syncedRef.current = true;
  //     setIsSynced(true);
  //   };

  //   syncAuth();
  // }, [user?.id]);

  if (!isSynced) {
    return null;
  }

  return <>{children}</>;
};

export default State;
