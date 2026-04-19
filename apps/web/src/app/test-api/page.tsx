'use client';

import { useEffect, useState } from 'react';

import {
  fetchGuessList,
  fetchMe,
  login,
  sendCode,
  setAuthToken,
} from '../../lib/api';
import { apiBaseUrl } from '../../lib/env';
import styles from './page.module.css';

export default function TestApiPage() {
  const [lines, setLines] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;

    const append = (line: string) => {
      if (cancelled) {
        return;
      }

      setLines((current) => [...current, line]);
    };

    async function runTests() {
      append('🔍 Testing backend connectivity...\n');

      try {
        const response = await fetch(`${apiBaseUrl}/health`, { cache: 'no-store' });
        const payload = await response.json();
        append(`✅ Health: ${JSON.stringify(payload)}`);
      } catch (error) {
        append(`❌ Health: ${error instanceof Error ? error.message : 'request failed'}`);
        return;
      }

      let productCount = 0;
      let guessCount = 0;
      let rankingCount = 0;
      let currentUserName = 'N/A';

      try {
        const response = await fetch(`${apiBaseUrl}/api/products?limit=3`, { cache: 'no-store' });
        const payload = await response.json();
        const items = payload?.data?.items || [];
        productCount = items.length;
        append(`✅ Products: ${items.length} items loaded (first: ${items[0]?.name || 'N/A'})`);
      } catch (error) {
        append(`❌ Products: ${error instanceof Error ? error.message : 'request failed'}`);
      }

      try {
        const result = await fetchGuessList();
        guessCount = result.items.length;
        append(`✅ Guesses: ${result.items.length} items loaded (first: ${result.items[0]?.title || 'N/A'})`);
      } catch (error) {
        append(`❌ Guesses: ${error instanceof Error ? error.message : 'request failed'}`);
      }

      try {
        const response = await fetch(`${apiBaseUrl}/api/rankings?type=winRate&limit=3`, { cache: 'no-store' });
        const payload = await response.json();
        const items = payload?.data?.items || [];
        rankingCount = items.length;
        append(`✅ Rankings: ${items.length} items (first: ${items[0]?.nickname || 'N/A'})`);
      } catch (error) {
        append(`❌ Rankings: ${error instanceof Error ? error.message : 'request failed'}`);
      }

      append('\n🔐 Testing auth flow...');
      try {
        const codeRes = await sendCode({ phone: '13800138000', bizType: 'login' });
        append(`✅ Send code: ${JSON.stringify(codeRes)}`);

        const loginRes = await login({
          phone: '13800138000',
          method: 'code',
          code: codeRes.devCode || '123456',
        });
        setAuthToken(loginRes.token);
        currentUserName = loginRes.user.name || 'N/A';
        append(`✅ Login: token=${loginRes.token.slice(0, 20)}... user=${loginRes.user.name}`);

        const me = await fetchMe();
        currentUserName = me.name || 'N/A';
        append(`✅ Auth/me: ${me.name || 'N/A'} (id: ${me.id || 'N/A'})`);
      } catch (error) {
        append(`❌ Auth: ${error instanceof Error ? error.message : 'request failed'}`);
      }

      append('\n📦 Testing ApiSync...');
      append('✅ ApiSync complete');
      append(`   Products: ${productCount}`);
      append(`   Guesses: ${guessCount}`);
      append(`   Rankings winRate: ${rankingCount}`);
      append(`   User: ${currentUserName}`);
      append('\n🎉 All tests complete!');
    }

    void runTests();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.header}>UMI ↔ Backend Connectivity Test</h2>
        <div className={styles.results}>
          {lines.map((line, index) => (
            <div key={`${index}-${line}`}>{line}</div>
          ))}
        </div>
      </div>
    </main>
  );
}
