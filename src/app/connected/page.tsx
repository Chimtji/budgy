import { Suspense } from 'react';
import dynamic from 'next/dynamic';

const ConnectionResolver = dynamic(() => import('./ConnectionResolver'), { ssr: false });

export default function ConnectedPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConnectionResolver />
    </Suspense>
  );
}
