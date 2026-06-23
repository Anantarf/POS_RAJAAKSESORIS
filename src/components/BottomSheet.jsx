import { useEffect, useRef } from "react";

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  actions,
  scrollable = true,
}) {
  const sheetRef = useRef(null);

  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleBackdropClick = (e) => {
      if (e.target === e.currentTarget) onClose();
    };

    document.addEventListener("keydown", handleEscape);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "auto";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-end"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 transition-opacity" />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="relative w-full max-w-full rounded-t-2xl bg-[var(--brand-surface)] shadow-xl"
        style={{
          maxHeight: "90vh",
          animation: "slideUp 300ms ease-out",
        }}
      >
        {/* Header */}
        <div className="sticky top-0 border-b border-[var(--brand-border)] px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-[var(--brand-text)]">
              {title}
            </h2>
            <button
              onClick={onClose}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--brand-border)] text-[var(--brand-text-soft)] hover:bg-[var(--brand-surface-soft)]"
              aria-label="Tutup"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div
          className={`${scrollable ? "overflow-y-auto" : ""} px-4 py-4`}
          style={{
            maxHeight: "calc(90vh - 130px)",
          }}
        >
          {children}
        </div>

        {/* Actions */}
        {actions && (
          <div className="sticky bottom-0 border-t border-[var(--brand-border)] bg-[var(--brand-surface)] px-4 py-4">
            <div className="flex gap-3">
              {actions.map((action, idx) => (
                <button
                  key={idx}
                  onClick={action.onClick}
                  className={`flex-1 rounded-lg px-4 py-3 font-semibold transition ${
                    action.variant === "primary"
                      ? "bg-[var(--brand-gold)] text-[var(--brand-text)] hover:opacity-90"
                      : "border border-[var(--brand-border)] text-[var(--brand-text)] hover:bg-[var(--brand-surface-soft)]"
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
