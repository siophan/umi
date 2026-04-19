'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatDetailAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/chat/u123');
  }, [router]);

  return null;
}
