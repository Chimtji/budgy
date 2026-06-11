import { del, list, put } from '@vercel/blob';
import type { TShareList, TShareListEntry, TShareMetadata } from './types';

const USERID = 'default';

const fetchBlobContent = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;
    return response.text();
  } catch {
    return null;
  }
};

export const getShareList = async (): Promise<TShareList> => {
  try {
    const { blobs } = await list({ prefix: `share-list:${USERID}` });
    if (blobs.length === 0) return [];
    const content = await fetchBlobContent(blobs[0].url);
    if (!content) return [];
    return JSON.parse(content);
  } catch {
    return [];
  }
};

export const addShareToList = async (entry: TShareListEntry): Promise<void> => {
  const list_data = await getShareList();
  list_data.push(entry);
  await put(`share-list:${USERID}`, JSON.stringify(list_data), { access: 'private', allowOverwrite: true });
};

export const updateShareInList = async (
  shareId: string,
  updates: Partial<TShareListEntry>
): Promise<void> => {
  const list_data = await getShareList();
  const index = list_data.findIndex((s) => s.shareId === shareId);
  if (index >= 0) {
    list_data[index] = { ...list_data[index], ...updates };
    await put(`share-list:${USERID}`, JSON.stringify(list_data), { access: 'private', allowOverwrite: true });
  }
};

export const getShareMetadata = async (shareId: string): Promise<TShareMetadata | null> => {
  try {
    const { blobs } = await list({ prefix: `share-meta:${shareId}` });
    if (blobs.length === 0) return null;
    const content = await fetchBlobContent(blobs[0].url);
    if (!content) return null;
    return JSON.parse(content);
  } catch {
    return null;
  }
};

export const putShareMetadata = async (
  shareId: string,
  metadata: TShareMetadata
): Promise<void> => {
  await put(`share-meta:${shareId}`, JSON.stringify(metadata), { access: 'private', addRandomSuffix: true });
};

export const isShareValid = async (shareId: string): Promise<boolean> => {
  const list_data = await getShareList();
  const entry = list_data.find((s) => s.shareId === shareId);
  if (!entry) return false;
  if (entry.status === 'revoked') return false;
  if (entry.expiresAt) {
    const expiresAt = new Date(entry.expiresAt);
    if (new Date() > expiresAt) return false;
  }
  return true;
};

export const deleteShareData = async (shareId: string): Promise<void> => {
  try {
    await Promise.all([del(`snapshot:${shareId}`), del(`share-meta:${shareId}`)]);
  } catch {
    // ignore
  }
};
