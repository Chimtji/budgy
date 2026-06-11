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
    console.log('[getShareMetadata] Fetching metadata for:', shareId);
    const { blobs } = await list({ prefix: `share-meta:${shareId}` });
    console.log('[getShareMetadata] Found blobs:', blobs.length);
    if (blobs.length === 0) {
      console.log('[getShareMetadata] No blobs found - returning null');
      return null;
    }
    const content = await fetchBlobContent(blobs[0].url);
    console.log('[getShareMetadata] Content:', content);
    if (!content) {
      console.log('[getShareMetadata] No content - returning null');
      return null;
    }
    const parsed = JSON.parse(content);
    console.log('[getShareMetadata] Parsed metadata:', parsed);
    return parsed;
  } catch (error) {
    console.error('[getShareMetadata] Error:', error);
    return null;
  }
};

export const putShareMetadata = async (
  shareId: string,
  metadata: TShareMetadata
): Promise<void> => {
  await put(`share-meta:${shareId}`, JSON.stringify(metadata), { access: 'private', allowOverwrite: true });
};

export const isShareValid = async (shareId: string): Promise<boolean> => {
  console.log('[isShareValid] Checking shareId:', shareId);
  
  // Check if metadata blob exists
  const metadata = await getShareMetadata(shareId);
  console.log('[isShareValid] metadata:', metadata);
  if (!metadata) {
    console.log('[isShareValid] No metadata found - returning false');
    return false;
  }
  
  // Check if revoked
  if (metadata.status === 'revoked') {
    console.log('[isShareValid] Status is revoked - returning false');
    return false;
  }
  
  // Check expiration
  if (metadata.expiresAt) {
    const expiresAt = new Date(metadata.expiresAt);
    if (new Date() > expiresAt) {
      console.log('[isShareValid] Share expired - returning false');
      return false;
    }
  }
  
  console.log('[isShareValid] Share is valid - returning true');
  return true;
};

export const deleteShareData = async (shareId: string): Promise<void> => {
  try {
    await Promise.all([del(`snapshot:${shareId}`), del(`share-meta:${shareId}`)]);
  } catch {
    // ignore
  }
};
