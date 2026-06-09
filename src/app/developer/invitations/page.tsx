'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DeveloperInvitationsPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50">
      <div className="text-sm font-semibold text-slate-500 animate-pulse font-sans">Redirecting...</div>
    </div>
  );
}
