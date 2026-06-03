export function PageHeader({
  title,
  description,
  action
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-normal text-white md:text-3xl">{title}</h1>
        {description ? <p className="mt-1 max-w-2xl text-sm leading-6 text-steel">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
