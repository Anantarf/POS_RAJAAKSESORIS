const Button = ({
  children,
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  type = "button",
  loading = false,
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "disabled:cursor-not-allowed disabled:opacity-60 font-semibold transition-all duration-200";

  const variants = {
    primary: "brand-button-primary",
    secondary: "brand-button-secondary",
    accent: "brand-button-success",
    outline: "brand-button-outline",
    danger: "brand-button-danger",
    warning: "brand-button-warning",
    ghost: "brand-button-ghost",
  };

  const sizes = {
    sm: "min-h-[var(--control-height-sm)] rounded-[var(--button-radius-sm)] px-4 py-2.5 text-sm",
    md: "min-h-[var(--control-height-md)] rounded-[var(--button-radius-md)] px-5 py-3 text-sm",
    lg: "min-h-[var(--control-height-lg)] rounded-[var(--button-radius-lg)] px-6 py-3 text-base",
    xl: "min-h-[var(--control-height-xl)] rounded-[var(--button-radius-lg)] px-7 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";
  const resolvedVariant = variants[variant] || variants.primary;
  const resolvedSize = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      className={`${baseClasses} ${resolvedVariant} ${resolvedSize} ${widthClass} ${className}`.trim()}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-r-transparent" />
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
