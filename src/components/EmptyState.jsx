export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  actionLabel,
  variant = "default",
}) {
  const iconColor = {
    default: "text-[var(--brand-text-soft)]",
    success: "text-green-600",
    warning: "text-amber-600",
    danger: "text-red-600",
  }[variant] || "text-[var(--brand-text-soft)]";

  const bgColor = {
    default: "bg-[var(--brand-surface-soft)]",
    success: "bg-green-50 dark:bg-green-950",
    warning: "bg-amber-50 dark:bg-amber-950",
    danger: "bg-red-50 dark:bg-red-950",
  }[variant] || "bg-[var(--brand-surface-soft)]";

  return (
    <div className={`flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-[var(--brand-border)] ${bgColor} px-6 py-12 text-center`}>
      {Icon && (
        <div className="mb-4 rounded-lg bg-[var(--brand-surface)]/50 p-3">
          <Icon className={`h-10 w-10 ${iconColor}`} />
        </div>
      )}

      <h3 className="text-lg font-semibold text-[var(--brand-text)]">
        {title || "Belum ada data"}
      </h3>

      {description && (
        <p className="mt-2 max-w-md text-sm text-[var(--brand-text-muted)]">
          {description}
        </p>
      )}

      {action && actionLabel && (
        <button
          type="button"
          onClick={action}
          className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-gold)] px-4 py-2 text-sm font-semibold text-[var(--brand-text)] transition hover:opacity-90 active:scale-95"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
