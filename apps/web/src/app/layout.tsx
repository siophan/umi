import './globals.css';
import type { ReactNode } from 'react';

export const metadata = {
  title: 'JOY Web',
  description: '用户端应用骨架',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
