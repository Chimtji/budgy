import { notFound } from 'next/navigation';
import { get, list } from '@vercel/blob';
import type { TSnapshot } from '@/service/database/share/createSnapshot';
import { getShareMetadata, isShareValid } from '@/service/database/share/shareUtils';
import { PasswordProtected } from './PasswordProtected';
import { SharedView } from './SharedView';

type TProps = {
  params: Promise<{ id: string }>;
};

const SharedViewPage = async ({ params }: TProps) => {
  const { id } = await params;

  const isValid = await isShareValid(id);
  if (!isValid) notFound();

  const metadata = await getShareMetadata(id);
  const isPasswordProtected = !!metadata?.passwordHash;

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

  if (isPasswordProtected) {
    return <PasswordProtected shareId={id} snapshot={snapshot} />;
  }

  return <SharedView snapshot={snapshot} />;
};

export default SharedViewPage;
