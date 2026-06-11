import { notFound } from 'next/navigation';
import { list } from '@vercel/blob';
import type { TSnapshot } from '@/service/database/share/createSnapshot';
import { SharedView } from './SharedView';

type TProps = {
  params: Promise<{ id: string }>;
};

const SharedViewPage = async ({ params }: TProps) => {
  const { id } = await params;

  let snapshot: TSnapshot | null = null;
  try {
    const { blobs } = await list({ prefix: `snapshot:${id}` });
    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      const text = await response.text();
      snapshot = JSON.parse(text) as TSnapshot;
    }
  } catch {
    snapshot = null;
  }

  if (!snapshot) notFound();

  return <SharedView snapshot={snapshot} />;
};

export default SharedViewPage;
