'use client';

import { useEffect } from 'react';
import { Center, Title } from '@mantine/core';
import { useUserStore } from '@/stores/user/userStore';

const Page = () => {
  const deleteAllAccess = useUserStore((state) => state.deleteAllAccess);

  useEffect(() => {
    deleteAllAccess();
  }, []);

  return (
    <Center h="100vh">
      <Title>You are logged out.</Title>
    </Center>
  );
};

export default Page;
