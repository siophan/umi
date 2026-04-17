import Link from 'next/link';

const items = [
  { key: 'home', label: '首页', href: '/', icon: '⌂' },
  { key: 'orders', label: '订单', href: '/orders', icon: '◫' },
  { key: 'warehouse', label: '仓库', href: '/warehouse', icon: '▣' },
  { key: 'me', label: '我的', href: '/me', icon: '◉' },
] as const;

export function BottomTabBar({
  current,
}: {
  current: 'home' | 'orders' | 'warehouse' | 'me';
}) {
  return (
    <nav className="tab-bar">
      {items.map((item) => (
        <Link
          className={`tab-item ${current === item.key ? 'active' : ''}`}
          href={item.href}
          key={item.key}
        >
          <span className="tab-icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </nav>
  );
}
