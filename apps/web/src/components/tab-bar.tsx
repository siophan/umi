import Link from 'next/link';

type TabItem = {
  key: 'home' | 'mall' | 'create' | 'community' | 'profile';
  label: string;
  href: string;
  icon: string;
  isCenter?: boolean;
};

const items: TabItem[] = [
  { key: 'home', label: '首页', href: '/', icon: 'fa-house' },
  { key: 'mall', label: '商城', href: '/mall', icon: 'fa-store' },
  { key: 'create', label: '', href: '/create', icon: 'fa-plus', isCenter: true },
  { key: 'community', label: '猜友圈', href: '/community', icon: 'fa-users' },
  { key: 'profile', label: '我', href: '/me', icon: 'fa-user' },
];

export function BottomTabBar({
  current,
}: {
  current: 'home' | 'mall' | 'create' | 'community' | 'profile' | 'orders' | 'warehouse' | 'me';
}) {
  const activeKey = current === 'me' ? 'profile' : current;

  return (
    <nav className="tab-bar">
      {items.map((item) => {
        if ('isCenter' in item && item.isCenter) {
          return (
            <Link
              className={`tab-item tab-center ${activeKey === item.key ? 'active' : ''}`}
              href={item.href}
              key={item.key}
            >
              <div className="tab-center-btn">
                <i className={`fa-solid ${item.icon}`} />
              </div>
              {item.label ? <span>{item.label}</span> : null}
            </Link>
          );
        }

        return (
          <Link
            className={`tab-item ${activeKey === item.key ? 'active' : ''}`}
            data-tab-id={item.key}
            href={item.href}
            key={item.key}
          >
            <i className={`fa-solid ${item.icon}`} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
