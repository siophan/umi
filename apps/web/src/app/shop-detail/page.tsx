'use client';

import { useSearchParams } from 'next/navigation';

import ShopDetailPage from '../shop/[id]/page';

export default function LegacyShopDetailPage() {
  const searchParams = useSearchParams();
  const brand = searchParams.get('brand') || '乐事';

  return <ShopDetailPage params={{ id: brand }} />;
}
