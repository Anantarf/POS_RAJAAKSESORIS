import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import LottieState from "../components/LottieState";
import Panel from "../components/app/Panel";
import ConfirmModal from "../components/ConfirmModal";
import Loading from "../components/Loading";
import LoadingState from "../components/LoadingState";
import PinConfirmationModal from "../components/PinConfirmationModal";
import ReceiptModal from "../components/ReceiptModal";
import { useAuth } from "../contexts/useAuth";
import { showNotification } from "../contexts/NotificationContext";
import { SplitPaymentWidget } from "../features/cashier/components/SplitPaymentWidget";
import { CartMobileSheet } from "../features/cashier/components/CartMobileSheet";
import { PaymentMethodSelector } from "../features/cashier/components/PaymentMethodSelector";
import { SmartCashInput } from "../features/cashier/components/SmartCashInput";
import {
  customerPaymentPlatforms,
  walletPlatformLabelMap,
} from "../data/businessOptions";
import {
  buildCashierCategoryOptions,
  getCartUnavailableMessage,
  getProductBrand,
  getProductDisplayName,
  getStockDisplay,
} from "../features/cashier/utils/productPresentation";
import {
  createSplitPaymentRow,
  getCashInputDisplay,
  getPaymentLabel,
  getResolvedPaymentMethod,
  getSplitPaymentAmount,
} from "../features/cashier/utils/paymentCalculations";
import CashierSearchPanel from "../features/cashier/components/CashierSearchPanel";
import { useProducts } from "../hooks/useProducts";
import {
  isPinActionCancelledError,
  usePinConfirmation,
} from "../hooks/usePinConfirmation";
import { useShift } from "../hooks/useShift";
import { useTransactions } from "../hooks/useTransactions";
import { useWallet } from "../hooks/useWallet";
import { formatDateTime, formatRupiah } from "../utils/format";
import {
  openReceiptPrintWindow,
  printTransactionReceiptWithStatus,
} from "../utils/print";
import { recordOperationalEventSoon } from "../services/observability";
import { getMoneySaveFailureMessage } from "../core/money/moneyRetry";

const paymentGroups = [
  { value: "cash", label: "Cash" },
  { value: "qris", label: "QRIS" },
  { value: "transfer_bank", label: "Transfer Bank" },
  { value: "ewallet", label: "E-Wallet" },
  { value: "pasar_kuota", label: "PASAR KUOTA" },
];

const NOTE_MAX_LENGTH = 150;
// ponytail: instant removal for unavailable items—better UX than 2.8s delay
const CART_UNAVAILABLE_REMOVAL_DELAY_MS = 0;
const bankWalletIds = ["bca", "bank_mas", "mandiri", "bri", "bni"];
const ewalletWalletIds = [
  "dana",
  "shopee",
  "ovo",
  "gopay_customer",
  "gopay_driver",
  "grab_customer",
  "grab_driver",
  "isaku_indomaret",
  "shopee_food_driver",
  "maxim_driver",
  "linkaja",
  "in_driver",
  "emoney",
  "etoll_emoney_mandiri",
  "etoll_brizzi",
  "etoll_tapcash_bni",
];
const splitPaymentMethodIds = [
  "cash",
  "qris",
  "bca",
  "bank_mas",
  "mandiri",
  "bri",
  "bni",
  "dana",
  "shopee",
  "ovo",
  "gopay_customer",
  "pasar_kuota",
];
const splitPaymentOptions = customerPaymentPlatforms.filter((platform) =>
  splitPaymentMethodIds.includes(platform.value)
);

export default function CashierPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { products, refreshProducts } = useProducts();
  const { createAccessoryTransaction, deleteTransactionHistory } = useTransactions();
  const { currentShift, selectedCashier } = useShift();
  const { walletBalances } = useWallet();

  const searchInputRef = useRef(null);
  const cashInputRef = useRef(null);
  const successTimerRef = useRef(null);
  const cartRemovalTimerRef = useRef(null);
  const productHydrationRef = useRef(false);

  const [step, setStep] = useState("product");
  const [activeCategory, setActiveCategory] = useState("semua");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState([]);
  const [paymentGroup, setPaymentGroup] = useState("cash");
  const [paymentMode, setPaymentMode] = useState("single");
  const [bankWallet, setBankWallet] = useState("bca");
  const [ewalletWallet, setEwalletWallet] = useState("dana");
  const [cashReceived, setCashReceived] = useState("");
  const [splitPayments, setSplitPayments] = useState(() => [
    createSplitPaymentRow("cash"),
    createSplitPaymentRow("qris"),
  ]);
  const [note, setNote] = useState("");
  const [processing, setProcessing] = useState(false);
  const processingRef = useRef(false);
  const [successFeedback, setSuccessFeedback] = useState(null);
  const [receiptTransaction, setReceiptTransaction] = useState(null);
  const [lastCompletedTransaction, setLastCompletedTransaction] = useState(null);
  const [voidTarget, setVoidTarget] = useState(null);
  const [hydratingProducts, setHydratingProducts] = useState(false);
  const [productHydrationError, setProductHydrationError] = useState("");
  const [shiftBannerExpanded, setShiftBannerExpanded] = useState(true);
  const {
    isPinModalOpen,
    closePinModal,
    executeSensitiveAction,
    executeConfirmedAction,
    actionDescription,
  } = usePinConfirmation();

  const activeProducts = useMemo(
    () => products.filter((product) => product.status === "active"),
    [products]
  );

  const categoryOptions = useMemo(
    () => buildCashierCategoryOptions(activeProducts),
    [activeProducts]
  );

  useEffect(() => {
    if (!categoryOptions.some((category) => category.value === activeCategory)) {
      setActiveCategory("semua");
    }
  }, [activeCategory, categoryOptions]);

  useEffect(() => {
    setCart((currentCart) => {
      if (!currentCart.length) return currentCart;

      const activeProductById = new Map(activeProducts.map((product) => [product.id, product]));
      let changed = false;
      let markedUnavailable = false;

      const nextCart = currentCart.flatMap((item) => {
        const latestProduct = activeProductById.get(item.id);

        if (!latestProduct) {
          if (item.unavailableReason !== "deleted") {
            changed = true;
            markedUnavailable = true;
          }

          return [
            {
              ...item,
              unavailableReason: "deleted",
              unavailableAt: item.unavailableAt || Date.now(),
            },
          ];
        }

        const latestStock = Number(latestProduct.stok || 0);
        const latestPrice = Number(latestProduct.harga_jual ?? item.harga_jual ?? 0);

        if (latestStock <= 0) {
          if (item.unavailableReason !== "out_of_stock" || Number(item.stok || 0) !== latestStock) {
            changed = true;
            markedUnavailable = true;
          }

          return [
            {
              ...item,
              stok: latestStock,
              unavailableReason: "out_of_stock",
              unavailableAt: item.unavailableAt || Date.now(),
            },
          ];
        }

        const safeQty = Math.min(Number(item.qty || 0), latestStock);
        if (safeQty <= 0) return [];

        const nextItem = {
          ...item,
          nama: latestProduct.nama || item.nama,
          brand: latestProduct.brand ?? item.brand,
          provider: latestProduct.provider ?? item.provider,
          kategori: latestProduct.kategori ?? item.kategori,
          harga_jual: latestPrice,
          stok: latestStock,
          qty: safeQty,
          subtotal: safeQty * latestPrice,
          unavailableReason: "",
          unavailableAt: null,
        };

        if (
          item.unavailableReason ||
          safeQty !== Number(item.qty || 0) ||
          latestStock !== Number(item.stok || 0) ||
          latestPrice !== Number(item.harga_jual || 0)
        ) {
          changed = true;
        }

        return [nextItem];
      });

      if (markedUnavailable) {
        showNotification(
          "warning",
          "Ada produk di keranjang yang stoknya habis atau sudah tidak tersedia."
        );
      }

      return changed ? nextCart : currentCart;
    });
  }, [activeProducts]);

  useEffect(() => {
    if (step === "product") {
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
      return;
    }

    if (paymentGroup === "cash") {
      window.requestAnimationFrame(() => {
        cashInputRef.current?.focus();
      });
    }
  }, [paymentGroup, step]);

  useEffect(
    () => () => {
      if (successTimerRef.current) {
        window.clearTimeout(successTimerRef.current);
      }
    },
    []
  );

  const filteredProducts = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return activeProducts
      .filter((product) => {
        const matchesCategory =
          activeCategory === "semua" ? true : product.kategori === activeCategory;
        const matchesSearch =
          !keyword ||
          getProductDisplayName(product).toLowerCase().includes(keyword) ||
          getProductBrand(product).toLowerCase().includes(keyword) ||
          (product.kode_produk || "").toLowerCase().includes(keyword);

        return matchesCategory && matchesSearch;
      })
      .sort((left, right) => {
        if ((left.stok > 0) !== (right.stok > 0)) {
          return left.stok > 0 ? -1 : 1;
        }

        return getProductDisplayName(left).localeCompare(getProductDisplayName(right), "id", {
          sensitivity: "base",
        });
      });
  }, [activeCategory, activeProducts, search]);
  const renderedProducts = filteredProducts;
  const hiddenProductCount = 0;

  const exactCodeMatch = useMemo(
    () =>
      activeProducts.find(
        (product) =>
          product.stok > 0 &&
          (product.kode_produk || "").toLowerCase() === search.trim().toLowerCase()
      ) || null,
    [activeProducts, search]
  );

  const cartItemCount = useMemo(
    () =>
      cart
        .filter((item) => !item.unavailableReason)
        .reduce((sum, item) => sum + Number(item.qty || 0), 0),
    [cart]
  );

  const cartTotal = useMemo(
    () =>
      cart
        .filter((item) => !item.unavailableReason)
        .reduce((sum, item) => sum + Number(item.subtotal || 0), 0),
    [cart]
  );
  const unavailableCartKey = useMemo(
    () =>
      cart
        .filter((item) => item.unavailableReason)
        .map((item) => `${item.id}:${item.unavailableReason}`)
        .join("|"),
    [cart]
  );
  const hasUnavailableCartItems = Boolean(unavailableCartKey);

  const resolvedPaymentMethod = useMemo(
    () => getResolvedPaymentMethod(paymentGroup, bankWallet, ewalletWallet),
    [bankWallet, ewalletWallet, paymentGroup]
  );

  const resolvedPaymentLabel = useMemo(
    () => getPaymentLabel(paymentGroup, bankWallet, ewalletWallet),
    [bankWallet, ewalletWallet, paymentGroup]
  );

  const selectedWalletBalance = useMemo(
    () =>
      Number(
        walletBalances.find((wallet) => wallet.id === resolvedPaymentMethod)?.balance || 0
      ),
    [resolvedPaymentMethod, walletBalances]
  );

  const bankWalletOptions = useMemo(
    () => customerPaymentPlatforms.filter((platform) => bankWalletIds.includes(platform.value)),
    []
  );

  const ewalletOptions = useMemo(
    () => customerPaymentPlatforms.filter((platform) => ewalletWalletIds.includes(platform.value)),
    []
  );

  const normalizedSplitPayments = useMemo(
    () =>
      splitPayments
        .map((payment) => ({
          method: payment.method,
          amount: getSplitPaymentAmount(payment),
        }))
        .filter((payment) => payment.amount > 0),
    [splitPayments]
  );
  const splitPaidTotal = useMemo(
    () => normalizedSplitPayments.reduce((sum, payment) => sum + payment.amount, 0),
    [normalizedSplitPayments]
  );
  const splitRemaining = Math.max(0, cartTotal - splitPaidTotal);
  const splitOverpay = Math.max(0, splitPaidTotal - cartTotal);
  const isSplitPayment = paymentMode === "split";
  const cashValue = Number(cashReceived || 0);
  const isCashPayment = !isSplitPayment && paymentGroup === "cash";
  const paidTotal = isSplitPayment ? splitPaidTotal : isCashPayment ? cashValue : cartTotal;
  const amountShortage = Math.max(0, cartTotal - paidTotal);
  const cashShortage = isCashPayment && cashValue < cartTotal ? cartTotal - cashValue : 0;
  const cashChange = isCashPayment ? Math.max(0, cashValue - cartTotal) : 0;
  const cashDisplay = getCashInputDisplay(cashReceived, cartTotal);
  const splitPaymentReady =
    !isSplitPayment ||
    (normalizedSplitPayments.length >= 2 && splitPaidTotal === cartTotal && !splitOverpay);
  const checkoutDisabled =
    processing ||
    !cartItemCount ||
    hasUnavailableCartItems ||
    (isSplitPayment ? !splitPaymentReady : isCashPayment && cashShortage > 0);
  const commandPaymentSummary = useMemo(() => {
    if (!isSplitPayment) {
      return {
        cash: paymentGroup === "cash" ? cartTotal : 0,
        qris: paymentGroup === "qris" ? cartTotal : 0,
        transfer: ["transfer_bank", "ewallet"].includes(paymentGroup) ? cartTotal : 0,
      };
    }

    return normalizedSplitPayments.reduce(
      (summary, payment) => {
        if (payment.method === "cash") summary.cash += payment.amount;
        else if (payment.method === "qris") summary.qris += payment.amount;
        else summary.transfer += payment.amount;
        return summary;
      },
      { cash: 0, qris: 0, transfer: 0 }
    );
  }, [cartTotal, isSplitPayment, normalizedSplitPayments, paymentGroup]);
  const commandPaymentStatus = !cartItemCount
    ? "MENUNGGU"
    : amountShortage
      ? "KURANG"
      : (isCashPayment && cashChange > 0) || splitOverpay
        ? "LEBIH"
        : "PAS";
  const commandStatusClass =
    commandPaymentStatus === "PAS"
      ? "brand-badge-success"
      : commandPaymentStatus === "KURANG" || commandPaymentStatus === "MENUNGGU"
        ? "brand-badge-warning"
        : "brand-badge-info";

  const resetCheckoutFields = () => {
    setPaymentMode("single");
    setPaymentGroup("cash");
    setBankWallet("bca");
    setEwalletWallet("dana");
    setCashReceived("");
    setSplitPayments([createSplitPaymentRow("cash"), createSplitPaymentRow("qris")]);
    setNote("");
  };

  const resetSale = () => {
    setCart([]);
    resetCheckoutFields();
  };

  useEffect(() => {
    if (!unavailableCartKey) {
      window.clearTimeout(cartRemovalTimerRef.current);
      return undefined;
    }

    window.clearTimeout(cartRemovalTimerRef.current);
    cartRemovalTimerRef.current = window.setTimeout(() => {
      setCart((currentCart) => {
        const nextCart = currentCart.filter((item) => !item.unavailableReason);

        if (!nextCart.length) {
          setStep("product");
          setPaymentMode("single");
          setPaymentGroup("cash");
          setBankWallet("bca");
          setEwalletWallet("dana");
          setCashReceived("");
          setSplitPayments([createSplitPaymentRow("cash"), createSplitPaymentRow("qris")]);
          setNote("");
        }

        return nextCart;
      });
      showNotification("info", "Item tidak tersedia sudah dihapus dari keranjang.");
    }, CART_UNAVAILABLE_REMOVAL_DELAY_MS);

    return () => window.clearTimeout(cartRemovalTimerRef.current);
  }, [unavailableCartKey]);

  const goToProductStep = () => {
    setStep("product");
  };

  const addToCart = useCallback((product, { refocusSearch = false } = {}) => {
    if (product.stok <= 0) {
      showNotification("warning", `Stok ${getProductDisplayName(product)} sedang habis.`);
      return;
    }

    setCart((currentCart) => {
      const currentItem = currentCart.find((item) => item.id === product.id);

      if (currentItem) {
        if (currentItem.qty >= product.stok) {
          showNotification(
            "warning",
            `Jumlah ${getProductDisplayName(product)} sudah mencapai batas stok.`
          );
          return currentCart;
        }

        return currentCart.map((item) =>
          item.id === product.id
            ? {
                ...item,
                qty: item.qty + 1,
                subtotal: (item.qty + 1) * item.harga_jual,
              }
            : item
        );
      }

      return [
        ...currentCart,
        {
          ...product,
          qty: 1,
          subtotal: Number(product.harga_jual || 0),
        },
      ];
    });

    if (refocusSearch) {
      window.requestAnimationFrame(() => {
        searchInputRef.current?.focus();
      });
    }
  }, []);

  const setCartQty = (productId, nextQty) => {
    setCart((currentCart) =>
      currentCart.flatMap((item) => {
        if (item.id !== productId) return [item];

        const safeQty = Math.max(0, Math.min(Number(nextQty || 0), Number(item.stok || 0)));
        if (safeQty === 0) return [];

        return [
          {
            ...item,
            qty: safeQty,
            subtotal: safeQty * Number(item.harga_jual || 0),
          },
        ];
      })
    );
  };

  const updateSplitPayment = (paymentId, patch) => {
    setSplitPayments((currentPayments) =>
      currentPayments.map((payment) =>
        payment.id === paymentId ? { ...payment, ...patch } : payment
      )
    );
  };

  const removeSplitPayment = (paymentId) => {
    setSplitPayments((currentPayments) =>
      currentPayments.length <= 2
        ? currentPayments
        : currentPayments.filter((payment) => payment.id !== paymentId)
    );
  };

  const addSplitPayment = () => {
    setSplitPayments((currentPayments) => [
      ...currentPayments,
      createSplitPaymentRow("dana"),
    ]);
  };

  const fillSplitRemaining = (paymentId) => {
    const otherTotal = splitPayments.reduce((sum, payment) => {
      if (payment.id === paymentId) return sum;
      return sum + getSplitPaymentAmount(payment);
    }, 0);
    const nextAmount = Math.max(0, cartTotal - otherTotal);

    updateSplitPayment(paymentId, {
      amount: nextAmount ? String(nextAmount) : "",
    });
  };

  const handleContinue = () => {
    if (!cartItemCount) {
      showNotification("warning", "Pilih produk dulu sebelum lanjut checkout.");
      return;
    }

    if (hasUnavailableCartItems) {
      showNotification("warning", "Selesaikan item stok habis atau tunggu item dihapus otomatis.");
      return;
    }

    setStep("checkout");
  };

  const buildTransactionPayload = () => {
    return {
      items: cart.filter((item) => !item.unavailableReason),
      metodeBayar: isSplitPayment ? "split" : resolvedPaymentMethod,
      uangDiterima: isSplitPayment ? splitPaidTotal : isCashPayment ? cashValue : cartTotal,
      payments: isSplitPayment
        ? normalizedSplitPayments
        : [{ method: resolvedPaymentMethod, amount: cartTotal }],
      catatan: note,
    };
  };

  const resolveCheckoutError = (error, printWindow) => {
    if (printWindow) {
      printWindow.close();
    }
    if (String(error?.code || "") === "P0001") {
      resetSale();
      setStep("product");
    }
    showNotification(
      "error",
      getMoneySaveFailureMessage(error, "Gagal menyimpan transaksi.")
    );
  };

  const handleCheckout = async (event) => {
    event.preventDefault();

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      showNotification(
        "warning",
        "Koneksi offline. Transaksi belum disimpan; lanjutkan setelah koneksi kembali."
      );
      return;
    }

    if (!currentShift) {
      showNotification("warning", "Buka shift dulu sebelum menyimpan transaksi.");
      navigate("/shift");
      return;
    }

    if (!cartItemCount) {
      showNotification("warning", "Keranjang masih kosong.");
      setStep("product");
      return;
    }

    const activeProductById = new Map(activeProducts.map((product) => [product.id, product]));
    const blockedProducts = cart.filter((item) => {
      if (item.unavailableReason) return true;
      const latestProduct = activeProductById.get(item.id);
      return !latestProduct || Number(latestProduct.stok || 0) <= 0;
    });

    if (blockedProducts.length) {
      showNotification(
        "warning",
        "Ada produk di keranjang yang stoknya habis atau sudah tidak tersedia."
      );
      setCart((currentCart) =>
        currentCart.map((item) => {
          const latestProduct = activeProductById.get(item.id);
          if (item.unavailableReason) return item;

          if (!latestProduct) {
            return {
              ...item,
              unavailableReason: "deleted",
              unavailableAt: item.unavailableAt || Date.now(),
            };
          }

          if (Number(latestProduct.stok || 0) <= 0) {
            return {
              ...item,
              stok: Number(latestProduct.stok || 0),
              unavailableReason: "out_of_stock",
              unavailableAt: item.unavailableAt || Date.now(),
            };
          }

          return item;
        })
      );
      return;
    }

    if (isCashPayment && cashValue < cartTotal) {
      showNotification("warning", "Uang diterima masih kurang dari total transaksi.");
      return;
    }

    if (isSplitPayment) {
      if (normalizedSplitPayments.length < 2) {
        showNotification("warning", "Split payment perlu minimal dua metode pembayaran.");
        return;
      }

      if (splitPaidTotal !== cartTotal) {
        showNotification("warning", "Total split payment harus sama dengan total transaksi.");
        return;
      }
    }

    if (processingRef.current) {
      return;
    }

    processingRef.current = true;
    const printWindow = openReceiptPrintWindow();

    setProcessing(true);
    try {
      const transaction = await createAccessoryTransaction(buildTransactionPayload());

      window.clearTimeout(successTimerRef.current);
      setSuccessFeedback({
        noTransaksi: transaction.no_transaksi,
        total: Number(transaction.total_bayar || cartTotal),
      });
      setReceiptTransaction(transaction);
      setLastCompletedTransaction(transaction);
      successTimerRef.current = window.setTimeout(() => {
        setSuccessFeedback(null);
      }, 2600);

      resetSale();
      goToProductStep();
      setSearch("");

      showNotification(
        "success",
        `Transaksi ${transaction.no_transaksi} berhasil disimpan.`
      );

      if (printWindow) {
        const printResult = printTransactionReceiptWithStatus(transaction, printWindow);
        if (!printResult.ok) {
          recordOperationalEventSoon({
            eventType: "receipt_print_failed",
            severity: "warning",
            source: "printer",
            sourceId: transaction.id || null,
            details: printResult,
          });
          showNotification("warning", `Transaksi tersimpan, tetapi print gagal. ${printResult.message}`);
        } else {
          recordOperationalEventSoon({
            eventType: "receipt_print_opened",
            severity: "info",
            source: "printer",
            sourceId: transaction.id || null,
            details: printResult,
          });
        }
      } else {
        recordOperationalEventSoon({
          eventType: "receipt_print_blocked",
          severity: "warning",
          source: "printer",
          sourceId: transaction.id || null,
          details: { no_transaksi: transaction.no_transaksi },
        });
        showNotification(
          "warning",
          "Print diblokir browser. Cetak ulang dari struk."
        );
      }
    } catch (error) {
      resolveCheckoutError(error, printWindow);
    } finally {
      processingRef.current = false;
      setProcessing(false);
    }
  };

  const reprintLastTransaction = () => {
    if (!lastCompletedTransaction) return;

    const printWindow = openReceiptPrintWindow();
    const result = printWindow
      ? printTransactionReceiptWithStatus(lastCompletedTransaction, printWindow)
      : { ok: false, message: "Popup print diblokir browser." };

    showNotification(
      result.ok ? "success" : "warning",
      result.ok
        ? `Struk ${lastCompletedTransaction.no_transaksi} siap dicetak ulang.`
        : result.message
    );
  };

  const confirmVoidLastTransaction = async () => {
    if (!voidTarget?.id) return;

    const target = voidTarget;
    setVoidTarget(null);

    try {
      await executeSensitiveAction(
        async () =>
          deleteTransactionHistory({
            source: "aksesoris",
            id: target.id,
            reason: `Pembatalan dari kasir: ${target.no_transaksi || target.id}`,
          }),
        "TRANSACTION.DELETE"
      );
      setLastCompletedTransaction(null);
      showNotification(
        "success",
        `Transaksi ${target.no_transaksi || target.id} dibatalkan. Stok dan saldo sudah dikembalikan.`
      );
    } catch (error) {
      if (isPinActionCancelledError(error)) return;
      showNotification("error", error.message || "Pembatalan transaksi gagal.");
    }
  };

  const handleSearchClear = useCallback(() => {
    setSearch("");
    searchInputRef.current?.focus();
  }, []);

  const handleSearchKeyDown = useCallback(
    (event) => {
      if (event.key === "Enter" && exactCodeMatch) {
        event.preventDefault();
        addToCart(exactCodeMatch, { refocusSearch: true });
        setSearch("");
      }
    },
    [addToCart, exactCodeMatch]
  );

  const hydrateCashierProducts = useCallback(async () => {
    productHydrationRef.current = true;
    setHydratingProducts(true);
    setProductHydrationError("");

    try {
      await refreshProducts();
    } catch (error) {
      const message = error.message || "Gagal memuat produk kasir.";
      console.error("Gagal memuat produk kasir:", error);
      setProductHydrationError(message);
      showNotification("error", message);
    } finally {
      setHydratingProducts(false);
    }
  }, [refreshProducts]);

  useEffect(() => {
    if (productHydrationRef.current || products.length) return undefined;

    void hydrateCashierProducts();
    return undefined;
  }, [hydrateCashierProducts, products.length]);

  const retryCashierProducts = () => {
    productHydrationRef.current = false;
    void hydrateCashierProducts();
  };

  if (hydratingProducts && !products.length) {
    return <LoadingState text="Memuat kasir..." variant="cashier" />;
  }

  if (productHydrationError && !products.length) {
    return (
      <div className="space-y-6">
        <Panel className="p-6">
          <p className="brand-section-label">Kasir POS</p>
          <h1 className="mt-2 text-xl font-bold text-slate-950">
            Produk kasir belum berhasil dimuat
          </h1>
          <p className="mt-3 text-sm leading-6 text-red-700">{productHydrationError}</p>
          <button type="button" onClick={retryCashierProducts} className="brand-button-primary mt-5">
            Coba Lagi
          </button>
        </Panel>
      </div>
    );
  }

  const renderShiftBanner = (
    <Panel
      variant={currentShift ? "strong" : "muted"}
      className={`px-5 py-4 ${currentShift ? "" : "border-amber-200 bg-amber-50/70"}`}
    >
      <button
        type="button"
        onClick={() => setShiftBannerExpanded(!shiftBannerExpanded)}
        className="w-full text-left"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex-1">
            <span className={currentShift ? "brand-badge-success" : "brand-badge-warning"}>
              {currentShift ? "Shift aktif" : "Shift belum aktif"}
            </span>
            {shiftBannerExpanded && (
              <p className="mt-3 text-sm font-semibold text-slate-950">
                {currentShift
                  ? `${selectedCashier?.nama || currentShift.cashier_name || "Kasir"} • ${currentShift.cashier_station || "Station belum dipilih"} • Shift ${currentShift.shift_type || "-"} aktif`
                  : "Transaksi baru bisa disimpan setelah shift dibuka oleh kasir yang bertugas."}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            {!currentShift && shiftBannerExpanded && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/shift");
                }}
                className="brand-button-primary text-sm"
              >
                Buka Shift
              </button>
            )}
            <span className="text-slate-500">{shiftBannerExpanded ? "−" : "+"}</span>
          </div>
        </div>
      </button>
    </Panel>
  );
  const selectionCartRail = (
    <Panel
      variant="strong"
      className="brand-cart-rail flex flex-col p-4 md:sticky md:top-[var(--brand-header-h)] lg:top-24"
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div>
          <p className="brand-section-label">Keranjang</p>
          <p className="mt-1 text-sm font-bold text-slate-950">{cartItemCount} item dipilih</p>
        </div>
        <span className="brand-badge-neutral">{formatRupiah(cartTotal)}</span>
      </div>

      {cart.length ? (
        <div className="brand-scroll-region-y brand-scrollbar mt-3 flex-1 space-y-2 pr-1">
          {cart.map((item) => (
            <div
              key={item.id}
              className={`border-b px-1 pb-3 pt-1 ${
                item.unavailableReason ? "border-rose-200 text-slate-500" : "border-slate-100"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="line-clamp-2 text-sm font-semibold text-slate-950">{item.nama}</p>
                <button
                  type="button"
                  onClick={() => setCartQty(item.id, 0)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-700"
                >
                  Hapus
                </button>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setCartQty(item.id, item.qty - 1)}
                    disabled={Boolean(item.unavailableReason)}
                    className="brand-icon-button brand-icon-button-sm brand-icon-button-muted disabled:opacity-40"
                    aria-label={`Kurangi ${item.nama}`}
                  >
                    -
                  </button>
                  <span className="min-w-[28px] text-center text-sm font-bold text-slate-950">
                    {item.qty}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCartQty(item.id, item.qty + 1)}
                    disabled={Boolean(item.unavailableReason)}
                    className="brand-icon-button brand-icon-button-sm brand-icon-button-primary disabled:opacity-40"
                    aria-label={`Tambah ${item.nama}`}
                  >
                    +
                  </button>
                </div>
                <p className="text-sm font-bold text-slate-950">{formatRupiah(item.subtotal)}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center py-8 text-center text-sm text-slate-500">
          Scan atau pilih produk untuk mulai transaksi.
        </div>
      )}

      <div className="mt-3 border-t border-slate-200 pt-3">
        <div className="flex items-end justify-between gap-3">
          <span className="text-sm font-semibold text-slate-500">Total</span>
          <span className="brand-metric-value">{formatRupiah(cartTotal)}</span>
        </div>
        <button
          type="button"
          className="brand-button-primary mt-3 w-full"
          onClick={handleContinue}
          disabled={!cartItemCount || hasUnavailableCartItems}
        >
          Lanjut Pembayaran
        </button>
      </div>
    </Panel>
  );

  return (
    <div className="space-y-4">
      {renderShiftBanner}

      {step === "product" ? (
        <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_300px] xl:grid-cols-[minmax(0,1fr)_330px]">
          <div className={`min-w-0 space-y-4 ${cartItemCount ? "brand-mobile-cta-offset md:pb-0" : ""}`}>
            <CashierSearchPanel
            ref={searchInputRef}
            search={search}
            exactCodeMatch={exactCodeMatch}
            filteredProductCount={filteredProducts.length}
            cartItemCount={cartItemCount}
            cartTotal={cartTotal}
            categoryOptions={categoryOptions}
            activeCategory={activeCategory}
            onSearchChange={setSearch}
            onSearchClear={handleSearchClear}
            onSearchKeyDown={handleSearchKeyDown}
            onCategoryChange={setActiveCategory}
            />

            {!activeProducts.length ? (
            <div className="brand-empty-state brand-empty-state-with-motion">
              <LottieState
                ariaLabel="Produk belum tersedia"
                size={118}
              />
              <p className="text-lg font-semibold text-slate-950">Belum ada produk aktif</p>
            </div>
            ) : !filteredProducts.length ? (
            <div className="brand-empty-state brand-empty-state-with-motion">
              <LottieState
                ariaLabel="Produk tidak ditemukan"
                size={132}
              />
              <p className="text-lg font-semibold text-slate-950">Produk tidak ditemukan</p>
              <p className="mt-2 max-w-md text-sm leading-7 text-slate-500">
                Tidak ada produk yang cocok.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearch("");
                  setActiveCategory("semua");
                }}
                className="brand-button-secondary mt-5"
              >
                Reset Filter
              </button>
            </div>
            ) : (
              <>
              {hiddenProductCount ? (
                <p className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
                  Menampilkan {renderedProducts.length} dari {filteredProducts.length} produk.
                </p>
              ) : null}
              <div className="brand-scroll-region-y brand-scrollbar md:max-h-[min(62dvh,680px)] md:pr-2">
                <div className="brand-product-grid brand-product-grid-compact">
                {renderedProducts.map((product) => {
                  const inCart = cart.find((item) => item.id === product.id);
                  const isOutOfStock = Number(product.stok || 0) <= 0;
                  const stockDisplay = getStockDisplay(product);

                  return (
                    <button
                      key={product.id}
                      type="button"
                      onClick={() => addToCart(product)}
                      disabled={isOutOfStock}
                      className={`brand-product-card brand-product-card-compact ${
                        isOutOfStock
                          ? "brand-product-card-disabled"
                          : `brand-product-card-available ${
                              inCart ? "brand-product-card-selected" : ""
                            }`
                      }`}
                    >
                      {inCart ? (
                        <span className="absolute right-3 top-3 rounded-md bg-[var(--brand-gold)] px-2.5 py-1 text-[11px] font-bold text-slate-950">
                          x{inCart.qty}
                        </span>
                      ) : null}

                      <div className="flex items-start justify-between gap-3 pr-10">
                        <span className="brand-badge-neutral max-w-full truncate">
                          {getProductBrand(product)}
                        </span>
                      </div>

                      <div className="mt-4 flex-1">
                        <p className="line-clamp-2 min-h-[44px] text-sm font-bold leading-5 text-slate-950">
                          {getProductDisplayName(product)}
                        </p>
                        <p className="mt-2 truncate text-[11px] font-semibold text-slate-500">
                          {product.kode_produk || product.kategori || "Tanpa kode"}
                        </p>
                      </div>

                      <div className="mt-4 space-y-3">
                        <p className="text-base font-bold tracking-tight text-slate-950">
                          {formatRupiah(product.harga_jual)}
                        </p>
                        <div className="brand-product-card-actions">
                          <span className={`${stockDisplay.className} min-h-[32px] px-3 py-1.5`}>
                            {stockDisplay.label}
                          </span>
                          <span
                            className={`brand-mini-action ${
                              isOutOfStock
                                ? "bg-slate-200 text-slate-500"
                                : "bg-[var(--brand-gold)] text-slate-950"
                            }`}
                          >
                            {isOutOfStock ? "Habis" : "Tambah"}
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
                </div>
              </div>
              </>
            )}
          </div>
          <div className="hidden md:block">{selectionCartRail}</div>
        </div>
      ) : (
        <div className="space-y-4">
          <section className="brand-command-strip" aria-label="Cashier command strip">
            <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <p className="brand-section-label shrink-0">Bayar:</p>
                <div className="brand-segmented">
                  {[
                    { value: "cash", label: "CASH" },
                    { value: "qris", label: "QRIS" },
                    { value: "transfer_bank", label: "TRANSFER" },
                  ].map((method) => (
                    <button
                      key={method.value}
                      type="button"
                      onClick={() => {
                        setPaymentMode("single");
                        setPaymentGroup(method.value);
                      }}
                      className={`brand-segmented-button ${
                        !isSplitPayment && paymentGroup === method.value
                          ? "brand-segmented-button-active"
                          : ""
                      }`}
                    >
                      {method.label}
                    </button>
                  ))}
                </div>
                <span className={commandStatusClass}>Status: {commandPaymentStatus}</span>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  form="cashier-checkout-form"
                  disabled={checkoutDisabled}
                  className="brand-button-success"
                >
                  Simpan
                </button>
                <button
                  type="button"
                  onClick={reprintLastTransaction}
                  disabled={!lastCompletedTransaction}
                  className="brand-button-secondary disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Print Ulang
                </button>
                <button
                  type="button"
                  onClick={() => setVoidTarget(lastCompletedTransaction)}
                  disabled={!lastCompletedTransaction || user?.role !== "pemilik"}
                  title={user?.role !== "pemilik" ? "Hanya pemilik yang bisa membatalkan transaksi." : ""}
                  className="brand-button-danger disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Batalkan Transaksi
                </button>
              </div>
            </div>
            <div className="brand-payment-summary mt-4" aria-live="polite">
              <span>Cash=<strong>{formatRupiah(commandPaymentSummary.cash)}</strong></span>
              <span>QRIS=<strong>{formatRupiah(commandPaymentSummary.qris)}</strong></span>
              <span>Transfer=<strong>{formatRupiah(commandPaymentSummary.transfer)}</strong></span>
              <span>Total=<strong>{formatRupiah(cartTotal)}</strong></span>
              <span>Sisa=<strong>{formatRupiah(amountShortage)}</strong></span>
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_340px] xl:grid-cols-[minmax(0,1.18fr)_420px]">
          <Panel variant="accent" className="p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="brand-section-label">Checkout</p>
                <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">
                  Ringkasan Belanja
                </h2>
              </div>
              <button
                type="button"
                onClick={goToProductStep}
                className="brand-button-secondary"
              >
                Kembali ke Produk
              </button>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="brand-subtle-block">
                <p className="brand-section-label">Total item</p>
                <p className="brand-metric-value-lg mt-2">
                  {cartItemCount}
                </p>
              </div>
              <div className="brand-subtle-block">
                <p className="brand-section-label">Total harga</p>
                <p className="brand-metric-value-lg mt-2">
                  {formatRupiah(cartTotal)}
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              {cart.length ? (
                cart.map((item) => {
                  const unavailableMessage = getCartUnavailableMessage(item.unavailableReason);

                  return (
                  <div
                    key={item.id}
                    className={`rounded-lg border px-4 py-4 shadow-[0_6px_16px_rgba(15,23,42,0.04)] ${
                      item.unavailableReason
                        ? "border-rose-200 bg-rose-50/80"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p
                          className={`text-sm font-bold ${
                            item.unavailableReason ? "text-slate-500 line-through" : "text-slate-950"
                          }`}
                        >
                          {item.nama}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-slate-500">
                          {getProductBrand(item)} - {formatRupiah(item.harga_jual)}
                        </p>
                        {unavailableMessage ? (
                          <p className="mt-2 inline-flex rounded-md bg-rose-100 px-2.5 py-1 text-xs font-bold text-rose-700">
                            {unavailableMessage} - akan dihapus otomatis
                          </p>
                        ) : null}
                      </div>
                      <button
                        type="button"
                        onClick={() => setCartQty(item.id, 0)}
                        className="brand-button-danger min-h-[44px] px-3 py-2 text-xs"
                      >
                        Hapus
                      </button>
                    </div>

                    <div className="mt-4 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setCartQty(item.id, item.qty - 1)}
                          disabled={Boolean(item.unavailableReason)}
                          className="brand-icon-button brand-icon-button-md brand-icon-button-muted min-h-[48px] min-w-[48px] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Kurangi ${item.nama}`}
                        >
                          -
                        </button>
                        <span className="min-w-[40px] text-center text-base font-bold text-slate-950">
                          {item.qty}
                        </span>
                        <button
                          type="button"
                          onClick={() => setCartQty(item.id, item.qty + 1)}
                          disabled={Boolean(item.unavailableReason)}
                          className="brand-icon-button brand-icon-button-md brand-icon-button-primary min-h-[48px] min-w-[48px] disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={`Tambah ${item.nama}`}
                        >
                          +
                        </button>
                      </div>
                      <p
                        className={`text-base font-bold ${
                          item.unavailableReason ? "text-slate-500 line-through" : "text-slate-950"
                        }`}
                      >
                        {formatRupiah(item.subtotal)}
                      </p>
                    </div>
                  </div>
                  );
                })
              ) : (
                <div className="brand-empty-state brand-empty-state-with-motion min-h-[260px]">
                  <LottieState
                    ariaLabel="Keranjang kosong"
                    icon="pos"
                    size={138}
                  />
                  <p className="text-base font-semibold text-slate-950">Keranjang masih kosong</p>
                  <p className="mt-2 max-w-sm text-sm leading-7 text-slate-500">
                    Kembali ke daftar produk, lalu pilih item yang akan dibayar pelanggan.
                  </p>
                </div>
              )}
            </div>
          </Panel>

          <Panel variant="success" className="p-5 md:sticky md:top-[184px] md:self-start lg:top-24 sm:p-6">
            <form id="cashier-checkout-form" onSubmit={handleCheckout} className="space-y-5">
              <div className="rounded-lg bg-slate-950 px-5 py-5 text-white shadow-[0_16px_34px_rgba(15,23,42,0.18)]">
                <p className="text-xs font-semibold text-slate-300">
                  Total tagihan
                </p>
                <p className="mt-2 text-3xl font-extrabold tracking-tight">
                  {formatRupiah(cartTotal)}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {cartItemCount} item - struk otomatis disiapkan setelah transaksi tersimpan
                </p>
              </div>


              <div>
                <p className="brand-section-label">Mode pembayaran</p>
                <div className="brand-segmented mt-3 grid w-full grid-cols-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMode("single")}
                    className={`brand-segmented-button ${
                      !isSplitPayment ? "brand-segmented-button-active" : ""
                    }`}
                  >
                    Sekali Bayar
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("split")}
                    className={`brand-segmented-button ${
                      isSplitPayment ? "brand-segmented-button-active" : ""
                    }`}
                  >
                    Split Payment
                  </button>
                </div>
              </div>

              {!isSplitPayment ? (
                <>
                  <PaymentMethodSelector
                    paymentGroup={paymentGroup}
                    onChangePaymentGroup={setPaymentGroup}
                    bankWallet={bankWallet}
                    onChangeBankWallet={setBankWallet}
                    ewalletWallet={ewalletWallet}
                    onChangeEwalletWallet={setEwalletWallet}
                    bankWalletOptions={bankWalletOptions}
                    ewalletOptions={ewalletOptions}
                    cartTotal={cartTotal}
                    selectedWalletBalance={selectedWalletBalance}
                    walletPlatformLabelMap={walletPlatformLabelMap}
                  />

                  {paymentGroup === "cash" ? (
                    <SmartCashInput
                      cartTotal={cartTotal}
                      cashReceived={cashReceived}
                      onChangeCashReceived={setCashReceived}
                      inputRef={cashInputRef}
                    />
                  ) : (
                    <div className="brand-subtle-block text-sm text-slate-600">
                      <p className="font-semibold text-slate-950">{resolvedPaymentLabel}</p>
                      <p className="mt-2">
                        Saldo saat ini:{" "}
                        <span className="font-semibold">{formatRupiah(selectedWalletBalance)}</span>
                      </p>
                      <p className="mt-1">
                        Setelah transaksi masuk:{" "}
                        <span className="font-semibold">
                          {formatRupiah(selectedWalletBalance + cartTotal)}
                        </span>
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <SplitPaymentWidget
                  cartTotal={cartTotal}
                  splitPayments={splitPayments}
                  onUpdatePayment={updateSplitPayment}
                  onAddPayment={addSplitPayment}
                  onRemovePayment={removeSplitPayment}
                  splitPaymentOptions={splitPaymentOptions}
                />
              )}


              {/* Note Field - Always visible */}
              <div>
                <label htmlFor="transaction-note" className="block text-sm font-semibold text-slate-700 mb-2">
                  Catatan Transaksi (Opsional)
                </label>
                <div className="relative">
                  <textarea
                    id="transaction-note"
                    value={note}
                    onChange={(event) => setNote(event.target.value.slice(0, NOTE_MAX_LENGTH))}
                    maxLength={NOTE_MAX_LENGTH}
                    className="brand-textarea pb-8 text-sm"
                    placeholder="Misal: diskon khusus, notes dari pelanggan, dll..."
                    rows="3"
                  />
                  <span
                    className={`pointer-events-none absolute bottom-2 right-3 text-[11px] font-bold ${
                      note.length > NOTE_MAX_LENGTH - 20 ? "text-amber-700" : "text-slate-400"
                    }`}
                  >
                    {note.length}/{NOTE_MAX_LENGTH}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={checkoutDisabled}
                className="brand-button-success w-full disabled:cursor-not-allowed disabled:opacity-60"
              >
                {processing ? "Menyimpan..." : "Bayar & Cetak Struk"}
              </button>

              <button
                type="button"
                onClick={() => {
                  resetCheckoutFields();
                  showNotification("info", "Form pembayaran direset.");
                }}
                className="brand-button-secondary w-full text-xs"
              >
                Reset Pembayaran
              </button>
            </form>
          </Panel>
        </div>
        </div>
      )}

      {/* Mobile Cart Sheet (replaces floating button) */}
      {step === "product" && (
        <CartMobileSheet
          cart={cart}
          cartTotal={cartTotal}
          cartItemCount={cartItemCount}
          onSetQty={setCartQty}
          onContinue={handleContinue}
          disabled={!cartItemCount || hasUnavailableCartItems}
        />
      )}

      {successFeedback ? (
        <div className="pointer-events-none fixed bottom-6 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
          <div className="brand-success-popover brand-panel flex items-center gap-4 border-emerald-200 bg-white px-5 py-4 shadow-[0_18px_42px_rgba(21,128,61,0.16)]">
            <LottieState
              ariaLabel="Transaksi berhasil"
              icon="check"
              size={56}
            />
            <div className="min-w-0">
              <p className="font-semibold text-slate-950">Transaksi tersimpan</p>
              <p className="mt-1 truncate text-sm text-slate-600">
                {successFeedback.noTransaksi} - {formatRupiah(successFeedback.total)}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {receiptTransaction ? (
        <ReceiptModal
          transaction={receiptTransaction}
          onClose={() => setReceiptTransaction(null)}
          onNewTransaction={() => {
            setReceiptTransaction(null);
            setStep("product");
            window.requestAnimationFrame(() => {
              searchInputRef.current?.focus();
            });
          }}
        />
      ) : null}

      <ConfirmModal
        isOpen={Boolean(voidTarget)}
        title="Batalkan transaksi terakhir?"
        message="Hanya gunakan jika transaksi memang perlu dibatalkan."
        target={voidTarget?.no_transaksi || voidTarget?.id}
        consequence="Stok dan saldo dikembalikan. Riwayat transaksi tetap tersimpan."
        requiresPin
        destructive
        confirmLabel="Ya, Batalkan"
        onClose={() => setVoidTarget(null)}
        onConfirm={() => void confirmVoidLastTransaction()}
      />

      <PinConfirmationModal
        isOpen={isPinModalOpen}
        onClose={closePinModal}
        onConfirm={executeConfirmedAction}
        title="PIN untuk batalkan transaksi"
        message={`Verifikasi aksi sensitif: ${actionDescription}`}
      />

      {processing ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loading
            text="Menyimpan transaksi dan menyiapkan struk..."
            size={180}
          />
        </div>
      ) : null}
    </div>
  );
}
