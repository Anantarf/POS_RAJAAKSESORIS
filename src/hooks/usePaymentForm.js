import { useState, useMemo, useCallback } from "react";
import { normalizePaymentSplit } from "../features/cashier/utils/paymentCalculations";

export function usePaymentForm(cartTotal, defaultPaymentMethod = "tunai") {
  const [paymentGroup, setPaymentGroup] = useState(defaultPaymentMethod);
  const [paymentMode, setPaymentMode] = useState("single");
  const [splitPayments, setSplitPayments] = useState([]);
  const [cashReceived, setCashReceived] = useState("");
  const [note, setNote] = useState("");

  const isSplitPayment = useMemo(() => paymentMode === "split", [paymentMode]);
  const isCashPayment = useMemo(() => paymentGroup === "tunai" || isSplitPayment, [paymentGroup, isSplitPayment]);

  const normalizedSplitPayments = useMemo(
    () => splitPayments.map((split) => normalizePaymentSplit(split)).filter(Boolean),
    [splitPayments]
  );

  const splitPaidTotal = useMemo(
    () => normalizedSplitPayments.reduce((sum, split) => sum + Number(split.amount || 0), 0),
    [normalizedSplitPayments]
  );

  const cashValue = useMemo(() => Number(cashReceived || 0), [cashReceived]);
  const cashChange = useMemo(() => Math.max(0, cashValue - cartTotal), [cashValue, cartTotal]);
  const isShortage = useMemo(() => isCashPayment && cashValue < cartTotal, [isCashPayment, cashValue, cartTotal]);

  const updateSplitPayment = useCallback((index, updates) => {
    setSplitPayments((current) =>
      current.map((split, i) => (i === index ? { ...split, ...updates } : split))
    );
  }, []);

  const addSplitPayment = useCallback((method = "tunai", amount = 0) => {
    setSplitPayments((current) => [...current, { method, amount }]);
  }, []);

  const fillSplitRemaining = useCallback(() => {
    if (!isSplitPayment || normalizedSplitPayments.length === 0) return;

    const remaining = Math.max(0, cartTotal - splitPaidTotal);
    if (remaining <= 0) return;

    setSplitPayments((current) =>
      current.map((split, i) =>
        i === current.length - 1
          ? { ...split, amount: Number(split.amount || 0) + remaining }
          : split
      )
    );
  }, [isSplitPayment, normalizedSplitPayments, cartTotal, splitPaidTotal]);

  const resetPaymentForm = useCallback(() => {
    setPaymentGroup(defaultPaymentMethod);
    setPaymentMode("single");
    setSplitPayments([]);
    setCashReceived("");
    setNote("");
  }, [defaultPaymentMethod]);

  return {
    paymentGroup,
    setPaymentGroup,
    paymentMode,
    setPaymentMode,
    splitPayments,
    setSplitPayments,
    cashReceived,
    setCashReceived,
    note,
    setNote,
    isSplitPayment,
    isCashPayment,
    normalizedSplitPayments,
    splitPaidTotal,
    cashValue,
    cashChange,
    isShortage,
    updateSplitPayment,
    addSplitPayment,
    fillSplitRemaining,
    resetPaymentForm,
  };
}
