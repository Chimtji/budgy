import { notFound } from 'next/navigation';
import { getStore } from '@netlify/blobs';
import type { TSnapshot } from '@/service/database/share/createSnapshot';
import { SharedView } from './SharedView';

type TProps = {
  params: Promise<{ id: string }>;
};

const SharedViewPage = async ({ params }: TProps) => {
  const { id } = await params;

  let snapshot: TSnapshot | null = null;
  try {
    const store = getStore('snapshots');
    snapshot = await store.get(id, { type: 'json' });
  } catch {
    snapshot = null;
  }

  if (!snapshot) notFound();

  return <SharedView snapshot={snapshot} />;
};

export default SharedViewPage;
