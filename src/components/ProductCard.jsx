import { useState } from "react";

export default function ProductCard({
  id,
  name,
  price,
  stock,
  image,
  onSelect,
  onQuickAction,
  disabled = false,
  variant = "default",
}) {
  const [isHovered, setIsHovered] = useState(false);

  const isOutOfStock = stock === 0;
  const displayPrice = typeof price === "number" ? price.toLocaleString("id-ID") : price;

  const cardClasses = {
    default: "brand-product-card brand-product-card-available",
    selected: "brand-product-card brand-product-card-selected",
    disabled: "brand-product-card brand-product-card-disabled",
  };

  return (
    <button
      type="button"
      onClick={() => onSelect?.({ id, name, price, stock, image })}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      disabled={disabled || isOutOfStock}
      className={`${cardClasses[variant]} w-full min-w-0 text-left`}
      aria-label={`${name} - ${isOutOfStock ? "Stok habis" : `Rp ${displayPrice}`}`}
    >
      {/* Image Container */}
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-md bg-[var(--brand-surface-soft)]">
        {image ? (
          <img
            src={image}
            alt={name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <span className="text-3xl">📦</span>
          </div>
        )}

        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-xs">HABIS</span>
          </div>
        )}

        {stock > 0 && stock <= 5 && (
          <div className="absolute top-2 right-2 rounded-full bg-amber-500 px-2 py-1 text-xs font-bold text-white">
            {stock}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="mb-2 flex-1">
        <h3 className="line-clamp-2 text-sm font-bold text-[var(--brand-text)]">
          {name}
        </h3>
        <p className="mt-1 text-xs text-[var(--brand-text-muted)]">
          {stock > 0 ? `${stock} stok` : "Stok habis"}
        </p>
      </div>

      {/* Price */}
      <div className="mb-2">
        <p className="text-sm font-black text-[var(--brand-gold)]">
          Rp {displayPrice}
        </p>
      </div>

      {/* Action Button */}
      {onQuickAction && !isOutOfStock && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onQuickAction?.({ id, name, price, stock });
          }}
          className={`w-full rounded-md bg-[var(--brand-gold)] px-3 py-2 text-xs font-bold text-[var(--brand-text)] transition ${
            isHovered ? "opacity-90" : "opacity-100"
          }`}
        >
          Tambah
        </button>
      )}
    </button>
  );
}
