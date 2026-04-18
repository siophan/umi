import type { ReactNode } from 'react';

import { BottomTabBar } from './tab-bar';

export function MobileShell({
  children,
  tab,
  tone = 'light',
}: {
  children: ReactNode;
  tab?:
    | 'home'
    | 'mall'
    | 'create'
    | 'community'
    | 'profile'
    | 'orders'
    | 'warehouse'
    | 'me';
  tone?: 'light' | 'dark' | 'mall';
}) {
  return (
    <div className={`mobile-shell tone-${tone}`}>
      <div className="mobile-shell__body">{children}</div>
      {tab ? <BottomTabBar current={tab} /> : null}
    </div>
  );
}
