import Input from "./ui/Input";

export default function FormField({
  label,
  type = "text",
  error,
  success,
  helper,
  icon,
  iconEnd,
  required,
  placeholder,
  value,
  onChange,
  onBlur,
  disabled,
  id,
  className = "",
}) {
  const handleChange = (e) => {
    onChange?.(e.target.value);
  };

  const handleBlur = (e) => {
    onBlur?.(e.target.value);
  };

  return (
    <Input
      id={id}
      type={type}
      label={label}
      error={error}
      success={success}
      helper={helper}
      icon={icon}
      iconEnd={iconEnd}
      required={required}
      placeholder={placeholder}
      value={value}
      onChange={handleChange}
      onBlur={handleBlur}
      disabled={disabled}
      className={className}
      aria-required={required}
    />
  );
}
