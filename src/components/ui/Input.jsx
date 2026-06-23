const Input = ({
  label,
  error,
  success,
  helper,
  icon: Icon,
  iconEnd: IconEnd,
  size = "sm",
  className = "",
  required,
  ...props
}) => {
  const sizeClass = {
    sm: "",
    md: "brand-input-md",
    lg: "brand-input-lg",
  }[size] || "";

  const statusColor = error ? "border-red-500" : success ? "border-green-600" : "";

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="brand-section-label block">
          {label}
          {required && <span className="ml-1 text-red-600">*</span>}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-4 w-4 text-[var(--brand-text-soft)]" />
          </div>
        )}
        <input
          className={`
            brand-input ${sizeClass}
            ${Icon ? "pl-9" : ""}
            ${IconEnd ? "pr-9" : ""}
            ${statusColor ? `${statusColor} focus:border-current focus:ring-2 ${error ? "ring-red-500/20 focus:ring-red-500/20" : "ring-green-500/20 focus:ring-green-500/20"}` : ""}
            ${className}
          `.trim()}
          aria-invalid={!!error}
          aria-describedby={error ? `${props.id}-error` : helper ? `${props.id}-helper` : undefined}
          {...props}
        />
        {IconEnd && (
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
            <IconEnd className="h-4 w-4 text-[var(--brand-text-soft)]" />
          </div>
        )}
      </div>
      {error && (
        <p id={`${props.id}-error`} className="text-xs font-semibold leading-4 text-red-600 flex items-center gap-1">
          <span>✕</span> {error}
        </p>
      )}
      {success && !error && (
        <p className="text-xs font-semibold leading-4 text-green-600 flex items-center gap-1">
          <span>✓</span> {success}
        </p>
      )}
      {helper && !error && (
        <p id={`${props.id}-helper`} className="text-xs leading-4 text-[var(--brand-text-soft)]">
          {helper}
        </p>
      )}
    </div>
  );
};

export default Input;
