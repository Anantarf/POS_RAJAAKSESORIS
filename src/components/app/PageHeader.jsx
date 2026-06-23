export default function PageHeader({ title, description, actions }) {
  return (
    <div className="mb-6 flex flex-col gap-5 border-b border-[var(--brand-border)] pb-5 lg:flex-row lg:items-end lg:justify-between">
      <div className="max-w-3xl">
        <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 sm:text-[15px]">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? <div className="flex flex-wrap gap-3.5 sm:gap-4 lg:justify-end">{actions}</div> : null}
    </div>
  );
}
