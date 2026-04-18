import Link from 'next/link';

const shortcuts = [
  { label: '订单', href: '/orders', icon: 'fa-solid fa-bag-shopping' },
  { label: '仓库', href: '/warehouse', icon: 'fa-solid fa-box-archive' },
  { label: '竞猜历史', href: '/guess/guess-1', icon: 'fa-solid fa-clock-rotate-left' },
  { label: '编辑资料', href: '/login', icon: 'fa-solid fa-pen-to-square' },
] as const;

export function ProfileShortcuts() {
  return (
    <div className="profile-shortcuts">
      {shortcuts.map((item) => (
        <Link className="profile-shortcuts__item" href={item.href} key={item.label}>
          <span className="profile-shortcuts__icon"><i className={item.icon} /></span>
          <span>{item.label}</span>
        </Link>
      ))}
    </div>
  );
}
