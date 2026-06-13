import { list } from '@vercel/blob';
import type { TSnapshot } from './createSnapshot';

export const getSnapshotByShareId = async (shareId: string): Promise<TSnapshot | null> => {
  try {
    const { blobs } = await list({ prefix: `snapshot:${shareId}` });
    if (blobs.length === 0) return null;

    const response = await fetch(blobs[0].url);
    if (!response.ok) return null;

    const text = await response.text();
    return JSON.parse(text) as TSnapshot;
  } catch {
    return null;
  }
};
