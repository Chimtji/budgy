import { redirect } from 'next/navigation';

const CatchAllPage = () => {
  redirect('/transactions');
};

export default CatchAllPage;
