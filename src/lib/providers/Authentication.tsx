'use client';

import { NeonAuthUIProvider } from '@neondatabase/auth/react';
import { authClient } from '../../service/database/auth/client';

const Authentication = ({ children }: { children: React.ReactNode }) => {
  return (
    <NeonAuthUIProvider authClient={authClient} redirectTo="/bills" emailOTP>
      {children}
    </NeonAuthUIProvider>
  );
};

export default Authentication;
