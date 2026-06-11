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

  console.log('SharedViewPage: Checking share validity for:', id);
  const isValid = await isShareValid(id);
  console.log('SharedViewPage: isValid =', isValid);
  if (!isValid) {
    console.log('SharedViewPage: Share not valid, calling notFound()');
    notFound();
  }

  const metadata = await getShareMetadata(id);
  console.log('SharedViewPage: metadata =', metadata);
  const isPasswordProtected = !!metadata?.passwordHash;

  let snapshot: TSnapshot | null = null;
  try {
    console.log('SharedViewPage: Fetching snapshot with prefix:', `snapshot:${id}`);
    const { blobs } = await list({ prefix: `snapshot:${id}` });
    console.log('SharedViewPage: Found blobs:', blobs.length, blobs.map(b => b.pathname));
    if (blobs.length > 0) {
      const response = await fetch(blobs[0].url);
      const text = await response.text();
      snapshot = JSON.parse(text) as TSnapshot;
    }
  } catch (err) {
    console.error('SharedViewPage: Error fetching snapshot:', err);
    snapshot = null;
  }

  console.log('SharedViewPage: snapshot =', snapshot ? 'found' : 'not found');
  if (!snapshot) notFound();

  if (isPasswordProtected) {
    return <PasswordProtected shareId={id} snapshot={snapshot} />;
  }

  return <SharedView snapshot={snapshot} />;
};

export default SharedViewPage;
