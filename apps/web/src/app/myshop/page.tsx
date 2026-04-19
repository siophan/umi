'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MyShopAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/my-shop');
  }, [router]);

  return null;
}
