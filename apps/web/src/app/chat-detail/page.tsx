'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ChatDetailAliasPage() {
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const target =
      params.get('id') ||
      params.get('uid') ||
      params.get('userId') ||
      params.get('target') ||
      '';

    router.replace(target ? `/chat/${encodeURIComponent(target)}` : '/chat');
  }, [router]);

  return null;
}
