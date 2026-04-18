import Link from 'next/link';

export function PageHeader({
  title,
  dark = false,
  backHref = '/',
}: {
  title: string;
  dark?: boolean;
  backHref?: string;
}) {
  return (
    <header className={`page-header ${dark ? 'dark' : ''}`}>
      <Link className="page-header__back" href={backHref}>
        <i className="fa-solid fa-arrow-left" />
      </Link>
      <div className="page-header__title">{title}</div>
      <div className="page-header__action">
        <i className="fa-solid fa-ellipsis" />
      </div>
    </header>
  );
}
