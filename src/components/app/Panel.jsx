export default function Panel({
  children,
  className = "",
  variant = "default",
  as: Component = "div",
  ...props
}) {
  const variants = {
    default: "brand-panel",
    muted: "brand-panel brand-panel-muted",
    strong: "brand-panel brand-panel-strong",
    accent: "brand-panel brand-panel-accent",
    info: "brand-panel brand-panel-info",
    success: "brand-panel brand-panel-success",
    warning: "brand-panel brand-panel-warning",
    danger: "brand-panel brand-panel-danger",
  };

  return (
    <Component className={`${variants[variant] || variants.default} ${className}`.trim()} {...props}>
      {children}
    </Component>
  );
}
