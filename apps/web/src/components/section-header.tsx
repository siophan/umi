import Link from 'next/link';

export function SectionHeader({
  title,
  moreHref,
}: {
  title: string;
  moreHref?: string;
}) {
  return (
    <div className="section-header">
      <h2>{title}</h2>
      {moreHref ? (
        <Link href={moreHref}>
          全部 <span><i className="fa-solid fa-chevron-right" /></span>
        </Link>
      ) : null}
    </div>
  );
}
