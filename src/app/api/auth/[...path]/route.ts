import { auth } from '@/service/database/auth/server';

export const { POST, GET } = auth.handler();
