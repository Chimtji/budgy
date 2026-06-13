import { redirect } from 'next/navigation';

type TProps = {
  params: Promise<{ id: string }>;
};

const SharedViewPage = async ({ params }: TProps) => {
  const { id } = await params;
  redirect(`/view/${id}/overview`);
};

export default SharedViewPage;
