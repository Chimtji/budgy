'use server';

import { setUserSession } from '@/service/server';

export async function startUserSession(idToken: string) {
  await setUserSession(idToken);
}
