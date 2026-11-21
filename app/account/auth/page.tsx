'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function AuthRedirectInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams.get('redirect');
    const target = redirect ? `/login?redirect=${encodeURIComponent(redirect)}` : '/login';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-[50vh] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-800 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export default function AccountAuthRedirect() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[50vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-brand-800 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthRedirectInner />
    </Suspense>
  );
}
