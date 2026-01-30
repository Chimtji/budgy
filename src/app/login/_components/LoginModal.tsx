'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useShallow } from 'zustand/shallow';
import { Button, Modal, Stack, Text, TextInput, Title } from '@mantine/core';
import { auth } from '@/service/client';
import { useUserStore } from '@/stores/user/userStore';
import { startUserSession } from '../actions';

const LoginModal = () => {
  const { deleteAllAccess, login } = useUserStore(
    useShallow((state) => ({
      deleteAllAccess: state.deleteAllAccess,
      login: state.login,
    }))
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  useEffect(() => {
    deleteAllAccess();
  }, []);

  const handleLogin = async () => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);
    const idToken = await user.getIdToken();

    startUserSession(idToken).then((response) => {
      login();
      router.push('/overview');
    });
  };

  return (
    <Modal
      opened
      onClose={() => {}}
      overlayProps={{ blur: 3, backgroundOpacity: 0.5 }}
      centered
      styles={{ close: { display: 'none' } }}
    >
      <Stack justify="center" align="center" pb="xl">
        <Title order={1} size="3em">
          Unlock.
        </Title>
        <Text>Signin with your credentials</Text>
        <TextInput
          name="email"
          autoComplete="email"
          type="text"
          placeholder="Insert Email"
          onChange={(e) => setEmail(e.target.value)}
          size="lg"
          w="20em"
        />
        <TextInput
          autoComplete="password"
          name="password"
          type="password"
          placeholder="Insert Password"
          onChange={(e) => setPassword(e.target.value)}
          size="lg"
          w="20em"
        />
        <Button w="10em" size="lg" onClick={handleLogin}>
          Sign in
        </Button>
      </Stack>
    </Modal>
  );
};

export default LoginModal;
