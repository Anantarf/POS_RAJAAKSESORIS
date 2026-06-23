import { useState, useEffect, useMemo, useCallback } from "react";

export function useCart(activeProducts) {
  const [cart, setCart] = useState([]);

  // Sync cart with product changes (remove unavailable, clamp qty, update prices)
  useEffect(() => {
    if (!activeProducts.length) {
      setCart([]);
      return;
    }

    const activeProductById = new Map(activeProducts.map((p) => [p.id, p]));
    setCart((currentCart) => {
      let updated = false;
      const newCart = currentCart
        .map((item) => {
          const latestProduct = activeProductById.get(item.id);
          if (!latestProduct) {
            updated = true;
            return null;
          }

          let itemUpdated = false;
          const updates = {};

          // Clamp quantity to available stock
          if (Number(item.qty || 0) > Number(latestProduct.stok || 0)) {
            updates.qty = Number(latestProduct.stok || 0);
            itemUpdated = true;
          }

          // Update price if changed
          const latestPrice = Number(latestProduct.harga_jual || 0);
          if (Number(item.harga_jual || 0) !== latestPrice) {
            updates.harga_jual = latestPrice;
            itemUpdated = true;
          }

          if (itemUpdated) {
            updated = true;
            return { ...item, ...updates };
          }
          return item;
        })
        .filter(Boolean);

      return updated ? newCart : currentCart;
    });
  }, [activeProducts]);

  const addToCart = useCallback((product) => {
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.id === product.id);

      if (existingItem) {
        return currentCart.map((item) =>
          item.id === product.id
            ? { ...item, qty: Math.min(Number(item.qty || 0) + 1, Number(product.stok || 0)) }
            : item
        );
      }

      return [
        ...currentCart,
        {
          id: product.id,
          nama_produk: product.nama_produk,
          harga_jual: Number(product.harga_jual || 0),
          qty: 1,
          brand: product.brand,
        },
      ];
    });
  }, []);

  const setCartQty = useCallback((productId, qty) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.id === productId ? { ...item, qty: Math.max(0, qty) } : item
      ).filter(item => item.qty > 0)
    );
  }, []);

  const cartTotal = useMemo(
    () => cart.reduce((sum, item) => sum + Number(item.harga_jual || 0) * Number(item.qty || 0), 0),
    [cart]
  );

  const cartItemCount = useMemo(() => cart.reduce((sum, item) => sum + Number(item.qty || 0), 0), [cart]);

  return {
    cart,
    setCart,
    addToCart,
    setCartQty,
    cartTotal,
    cartItemCount,
  };
}
