'use server';

import { cookies } from 'next/headers';
import { auth } from './database';

const SESSION_COOKIE_NAME = '__budgy_session';
const EXPIRES_IN = 60 * 60 * 24 * 5 * 1000; // 5 days

export const setUserSession = async (idToken: string) => {
  const cookieStore = await cookies();
  const sessionCookie = await auth.createSessionCookie(idToken, {
    expiresIn: EXPIRES_IN,
  });

  cookieStore.set(SESSION_COOKIE_NAME, sessionCookie, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    maxAge: EXPIRES_IN / 1000,
    path: '/',
  });
};

export const deleteUserSession = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
};

export const getUserSession = async () => {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!sessionCookie) return null;

  try {
    const decoded = await auth.verifySessionCookie(sessionCookie, true);
    return decoded;
  } catch {
    return null;
  }
};
