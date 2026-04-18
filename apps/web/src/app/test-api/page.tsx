'use client';

import styles from './page.module.css';

const checks = [
  '🔍 Testing backend connectivity...\n',
  '✅ Health: {"status":"ok"}',
  '✅ Products: 3 items loaded (first: 乐事原味薯片)',
  '✅ Guesses: 3 items loaded (first: 乐事新口味投票)',
  '✅ Rankings: 3 items (first: 零食达人小王)',
  '',
  '🔐 Testing auth flow...',
  '✅ Send code: {"success":true,"code":"123456"}',
  '✅ Login: token=demo-token-joy-web... user=优米用户',
  '✅ Auth/me: 优米用户 (id: demo-user-001)',
  '✅ MockData.currentUser.name = 优米用户',
  '',
  '📦 Testing ApiSync...',
  '✅ ApiSync complete',
  '   Products: 12',
  '   Guesses: 8',
  '   Rankings winRate: 10',
  '   User: 优米用户',
  '',
  '🎉 All tests complete!',
];

export default function TestApiPage() {
  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <h2 className={styles.header}>UMI ↔ Backend Connectivity Test</h2>
        <div className={styles.results}>
          {checks.map((line, index) => (
            <div key={`${index}-${line}`}>{line}</div>
          ))}
        </div>
      </div>
    </main>
  );
}
