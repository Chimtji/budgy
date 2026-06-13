import { cookies } from 'next/headers';
import type { TSnapshot } from './createSnapshot';
import { getSnapshotByShareId } from './getSnapshotByShareId';

const snapshotCache = new Map<string, Promise<TSnapshot | null>>();

export const getActiveShareId = async () => {
  const cookieStore = await cookies();
  return cookieStore.get('budgy-share-id')?.value ?? null;
};

export const getActiveShareSnapshot = async (): Promise<TSnapshot | null> => {
  const shareId = await getActiveShareId();
  if (!shareId) return null;

  let snapshotPromise = snapshotCache.get(shareId);
  if (!snapshotPromise) {
    snapshotPromise = getSnapshotByShareId(shareId);
    snapshotCache.set(shareId, snapshotPromise);
  }

  return snapshotPromise;
};
