import { redirect } from 'next/navigation';
import { getUserSession } from '@/service/server';

const CatchAllPage = async () => {
  // We check for user here serverside and not via userStore
  // So the auth is calculated before client is rendered and thus before auth can be manipulated
  const user = await getUserSession();
  if (!user) {
    redirect('/login');
  } else {
    redirect('/overview');
  }
};

export default CatchAllPage;
