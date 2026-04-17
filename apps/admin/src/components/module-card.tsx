export function ModuleCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="module-card">
      <h3>{title}</h3>
      <p>{description}</p>
    </article>
  );
}
