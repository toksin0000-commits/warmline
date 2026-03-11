'use client';

import Envelope from '@/components/Envelope';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const openEnvelope = () => {
    router.push('/message');
  };

  return (
    <div className="flex items-center justify-center h-screen bg-white relative">
      <Envelope onOpen={openEnvelope} />

      <div className="absolute bottom-20 text-center">
        <p className="text-black">You’ve got mail.</p>
        <p className="text-black">Mail for you.</p>
      </div>
    </div>
  );
}
