'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function LegacyShopDetailPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const brand = searchParams.get('brand') || '乐事';
    router.replace(`/shop/${encodeURIComponent(brand)}?brand=${encodeURIComponent(brand)}`);
  }, [router, searchParams]);

  return null;
}

export default function LegacyShopDetailPage() {
  return (
    <Suspense fallback={null}>
      <LegacyShopDetailPageInner />
    </Suspense>
  );
}
