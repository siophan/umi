import Link from 'next/link';

const shortcuts = [
  { label: '订单', href: '/orders', icon: '◫' },
  { label: '仓库', href: '/warehouse', icon: '▣' },
  { label: '竞猜历史', href: '/guess/guess-1', icon: '◎' },
  { label: '编辑资料', href: '/login', icon: '✎' },
] as const;

export function ProfileShortcuts() {
  return (
    <div className="profile-shortcuts">
      {shortcuts.map((item) => (
        <Link className="profile-shortcuts__item" href={item.href} key={item.label}>
          <span className="profile-shortcuts__icon">{item.icon}</span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
