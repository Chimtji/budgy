import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import { Box } from '@mantine/core';
import dashboardClasses from '@/app/(dashboard)/layout.module.css';
import { getSnapshotByShareId } from '@/service/database/share/getSnapshotByShareId';
import { getShareMetadata, isShareValid } from '@/service/database/share/shareUtils';
import { ViewNavbar } from './_components/ViewNavbar';
import { ViewSnapshotProvider } from './_components/ViewSnapshotProvider';
import { PasswordProtected } from './PasswordProtected';

type TProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

const SharedViewLayout = async ({ children, params }: TProps) => {
  const { id } = await params;
  const isValid = await isShareValid(id);
  if (!isValid) notFound();

  const metadata = await getShareMetadata(id);
  const cookieStore = await cookies();
  const isAuthenticated = cookieStore.get(`budgy-share-auth-${id}`)?.value === '1';

  if (metadata?.passwordHash && !isAuthenticated) {
    return <PasswordProtected shareId={id} />;
  }

  const snapshot = await getSnapshotByShareId(id);
  if (!snapshot) notFound();

  return (
    <ViewSnapshotProvider snapshot={snapshot}>
      <Box className={dashboardClasses.root}>
        <Box className={dashboardClasses.sidebar}>
          <ViewNavbar shareId={id} />
        </Box>
        <Box className={dashboardClasses.content}>{children}</Box>
      </Box>
    </ViewSnapshotProvider>
  );
};

export default SharedViewLayout;
