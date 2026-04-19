import { useMemo, useState } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  Bolt,
  CircleCheckBig,
  CreditCard,
  HeartPulse,
  HelpCircle,
  LoaderCircle,
  Lock,
  Rocket,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { bookingApi } from "../services/fitnessApi";

const PROMO_DISCOUNTS = Object.freeze({
  KINETIC10: 0.1,
  ELITE20: 0.2,
  FIRST15: 0.15,
});

function roundCurrency(value) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Number(parsed.toFixed(2));
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(roundCurrency(value));
}

function formatDateTime(value) {
  if (!value) {
    return "--";
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "--";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(parsed);
}

function getInitials(name) {
  if (!name || typeof name !== "string") {
    return "FA";
  }

  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function normalizeCardNumberInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(.{4})/g, "$1 ").trim();
}

function normalizeExpiryInput(value) {
  const digits = value.replace(/\D/g, "").slice(0, 4);

  if (digits.length <= 2) {
    return digits;
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function isFutureExpiry(value) {
  const match = value.match(/^(0[1-9]|1[0-2])\/(\d{2})$/);

  if (!match) {
    return false;
  }

  const month = Number(match[1]);
  const year = Number(match[2]);
  const now = new Date();
  const currentYear = Number(String(now.getFullYear()).slice(-2));
  const currentMonth = now.getMonth() + 1;

  if (year > currentYear) {
    return true;
  }

  if (year === currentYear) {
    return month >= currentMonth;
  }

  return false;
}

function PaymentPage() {
  const { authUser } = useAuth();
  const queryClient = useQueryClient();

  const [selectedBookingOverride, setSelectedBookingOverride] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [cardholderName, setCardholderName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [cvv, setCvv] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [appliedPromoCode, setAppliedPromoCode] = useState("");
  const [notice, setNotice] = useState("");

  const bookingsQuery = useQuery({
    queryKey: ["bookings", "payment-page"],
    queryFn: () => bookingApi.list({ page: 1, limit: 30 }),
  });

  const bookings = useMemo(
    () => bookingsQuery.data?.bookings || [],
    [bookingsQuery.data?.bookings],
  );

  const payableBookings = useMemo(
    () =>
      bookings.filter(
        (booking) =>
          booking?.status !== "cancelled" && booking?.paymentStatus !== "paid",
      ),
    [bookings],
  );

  const selectedBookingId = useMemo(() => {
    if (
      selectedBookingOverride &&
      payableBookings.some((booking) => booking._id === selectedBookingOverride)
    ) {
      return selectedBookingOverride;
    }

    return payableBookings[0]?._id || "";
  }, [payableBookings, selectedBookingOverride]);

  const selectedBooking = useMemo(
    () =>
      payableBookings.find((booking) => booking._id === selectedBookingId) || null,
    [payableBookings, selectedBookingId],
  );

  const sessionHours = useMemo(() => {
    if (!selectedBooking?.slotStart || !selectedBooking?.slotEnd) {
      return 1;
    }

    const start = new Date(selectedBooking.slotStart).getTime();
    const end = new Date(selectedBooking.slotEnd).getTime();

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
      return 1;
    }

    return Math.max((end - start) / (1000 * 60 * 60), 1);
  }, [selectedBooking]);

  const trainerRate = Math.max(Number(selectedBooking?.trainer?.hourlyRate) || 0, 49.99);
  const subtotal = roundCurrency(sessionHours * trainerRate);

  const promoDiscount =
    appliedPromoCode && PROMO_DISCOUNTS[appliedPromoCode]
      ? PROMO_DISCOUNTS[appliedPromoCode]
      : 0;

  const paymentSummary = useMemo(() => {
    const discount = roundCurrency(subtotal * promoDiscount);
    const taxableAmount = Math.max(0, subtotal - discount);
    const taxes = roundCurrency(taxableAmount * 0.085);
    const processingFee = paymentMethod === "wallet" ? 0 : 1.49;
    const total = roundCurrency(taxableAmount + taxes + processingFee);

    return {
      discount,
      taxes,
      processingFee,
      total,
    };
  }, [paymentMethod, promoDiscount, subtotal]);

  const checkoutMutation = useMutation({
    mutationFn: ({ bookingId, payload }) => bookingApi.pay(bookingId, payload),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ["bookings"] });
      setPromoInput("");
      setAppliedPromoCode("");
      setCardNumber("");
      setExpiryDate("");
      setCvv("");

      const chargedTotal = response?.payment?.total ?? paymentSummary.total;
      setNotice(`Payment completed successfully (${formatCurrency(chargedTotal)}).`);
    },
    onError: (error) => {
      setNotice(getApiErrorMessage(error, "Unable to process payment right now."));
    },
  });

  const selectedTrainerName =
    selectedBooking?.trainer?.user?.name || "Kinetic Performance Coach";

  const selectedPlanTitle = selectedBooking
    ? `${selectedTrainerName} Session`
    : "KINETIC PRO ELITE";

  const scheduleLabel = selectedBooking
    ? `${formatDateTime(selectedBooking.slotStart)} - ${formatDateTime(selectedBooking.slotEnd)}`
    : "No payable booking available";

  const queryErrorMessage = bookingsQuery.error
    ? getApiErrorMessage(bookingsQuery.error, "Unable to load payment details.")
    : "";

  function handleApplyPromoCode() {
    const normalizedCode = promoInput.trim().toUpperCase();

    if (!normalizedCode) {
      setNotice("Enter a promo code before applying.");
      return;
    }

    if (!PROMO_DISCOUNTS[normalizedCode]) {
      setAppliedPromoCode("");
      setNotice("Promo code is invalid.");
      return;
    }

    setAppliedPromoCode(normalizedCode);
    setPromoInput(normalizedCode);
    setNotice(`Promo ${normalizedCode} applied.`);
  }

  function validateCardFields() {
    if (paymentMethod !== "card") {
      return true;
    }

    const trimmedName = cardholderName.trim();
    const digits = cardNumber.replace(/\D/g, "");
    const cvcDigits = cvv.replace(/\D/g, "");

    if (trimmedName.length < 2) {
      setNotice("Please enter a valid cardholder name.");
      return false;
    }

    if (digits.length !== 16) {
      setNotice("Card number must contain exactly 16 digits.");
      return false;
    }

    if (!isFutureExpiry(expiryDate)) {
      setNotice("Expiry must be in MM/YY format and not in the past.");
      return false;
    }

    if (cvcDigits.length < 3 || cvcDigits.length > 4) {
      setNotice("CVC/CVV must be 3 or 4 digits.");
      return false;
    }

    return true;
  }

  function handleConfirmPayment() {
    if (!selectedBooking?._id) {
      setNotice("No unpaid booking found. Create a booking to continue checkout.");
      return;
    }

    if (!validateCardFields()) {
      return;
    }

    setNotice("");

    const cardDigits = cardNumber.replace(/\D/g, "");

    checkoutMutation.mutate({
      bookingId: selectedBooking._id,
      payload: {
        paymentMethod,
        promoCode: appliedPromoCode || undefined,
        cardholderName:
          paymentMethod === "card" ? cardholderName.trim() : undefined,
        cardLast4: paymentMethod === "card" ? cardDigits.slice(-4) : undefined,
      },
    });
  }

  return (
    <div className="bg-[#f9f9fc] text-[#2f3337]">
      <header className="sticky top-0 z-50 bg-[#f9f9fc]/80 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] backdrop-blur-xl">
        <div className="flex w-full items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Link
              to="/dashboard"
              className="rounded-full p-1 text-[#0048e2] transition hover:bg-[#dfe3e8]"
              aria-label="Back to dashboard"
            >
              <ArrowLeft size={20} />
            </Link>
            <span className="font-heading text-2xl font-black tracking-tighter">
              KINETIC
            </span>
          </div>

          <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-[#dee1f9]">
            {authUser?.avatarUrl ? (
              <img
                src={authUser.avatarUrl}
                alt="User Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="text-xs font-bold text-[#0048e2]">
                {getInitials(authUser?.name)}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto grid max-w-7xl grid-cols-1 gap-12 px-6 pb-24 pt-12 lg:grid-cols-12">
        <div className="space-y-12 lg:col-span-7">
          {bookingsQuery.isPending ? (
            <div className="rounded-xl border border-[#aeb2b7]/20 bg-white px-4 py-3 text-sm text-[#5b5f64]">
              Loading checkout details...
            </div>
          ) : null}

          {queryErrorMessage ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {queryErrorMessage}
            </div>
          ) : null}

          {notice ? (
            <div className="rounded-xl border border-[#aeb2b7]/20 bg-white px-4 py-3 text-sm text-[#5b5f64]">
              {notice}
            </div>
          ) : null}

          <section>
            <h2 className="mb-6 font-heading text-2xl font-bold tracking-tight">
              Review your choice
            </h2>

            <div className="flex flex-col items-center gap-8 rounded-xl bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] md:flex-row">
              <div className="flex h-32 w-32 items-center justify-center rounded-xl bg-[#0052fe]/10">
                <Bolt size={48} className="text-[#0048e2]" />
              </div>

              <div className="flex-grow">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#dee1f9] px-3 py-1 text-[10px] font-semibold uppercase tracking-widest text-[#4d5164]">
                    Active Plan
                  </span>
                  <span className="text-sm font-bold uppercase tracking-tight text-[#0048e2]">
                    Elite Performance
                  </span>
                </div>

                <h3 className="font-heading text-xl font-extrabold uppercase">
                  {selectedPlanTitle}
                </h3>
                <p className="mt-2 max-w-md text-sm text-[#5b5f64]">
                  {selectedBooking
                    ? `Trainer session with ${selectedTrainerName}. Booking window: ${scheduleLabel}.`
                    : "Unlimited AI-driven personalized workouts, real-time biometric tracking, and priority coaching insights."}
                </p>

                {payableBookings.length > 1 ? (
                  <div className="mt-4">
                    <label className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                      Select Session
                    </label>
                    <select
                      value={selectedBookingId}
                      onChange={(event) =>
                        setSelectedBookingOverride(event.target.value)
                      }
                      className="w-full rounded-lg border border-[#d7dadf] bg-white px-3 py-2 text-sm font-semibold text-[#2f3337]"
                    >
                      {payableBookings.map((booking) => {
                        const trainerName =
                          booking?.trainer?.user?.name || "Kinetic Coach";

                        return (
                          <option key={booking._id} value={booking._id}>
                            {trainerName} • {formatDateTime(booking.slotStart)}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                ) : null}
              </div>

              <div className="text-right">
                <div className="text-2xl font-heading font-black text-[#0048e2]">
                  {formatCurrency(subtotal)}
                </div>
                <div className="text-xs font-semibold uppercase tracking-wider text-[#5b5f64]">
                  {selectedBooking
                    ? `${roundCurrency(sessionHours)} hour session`
                    : "Per month"}
                </div>
              </div>
            </div>
          </section>

          <section>
            <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-heading text-2xl font-bold tracking-tight">
                Payment method
              </h2>
              <div className="flex items-center gap-2">
                <Lock size={14} className="text-[#5b5f64]" />
                <span className="py-1 text-xs font-semibold uppercase tracking-widest text-[#5b5f64]">
                  Secure Encryption
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <button
                type="button"
                onClick={() => setPaymentMethod("card")}
                className={`rounded-xl p-6 text-left transition ${
                  paymentMethod === "card"
                    ? "border-2 border-[#0048e2] bg-[#dfe3e8]"
                    : "bg-[#f2f3f7] hover:bg-[#e6e8ed]"
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <CreditCard
                    size={20}
                    className={
                      paymentMethod === "card" ? "text-[#0048e2]" : "text-[#5b5f64]"
                    }
                  />
                  {paymentMethod === "card" ? (
                    <CircleCheckBig size={20} className="text-[#0048e2]" />
                  ) : null}
                </div>
                <p className="text-sm font-bold uppercase tracking-wider">Credit Card</p>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod("wallet")}
                className={`rounded-xl p-6 text-left transition ${
                  paymentMethod === "wallet"
                    ? "border-2 border-[#0048e2] bg-[#dfe3e8]"
                    : "bg-[#f2f3f7] hover:bg-[#e6e8ed]"
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <Wallet
                    size={20}
                    className={
                      paymentMethod === "wallet"
                        ? "text-[#0048e2]"
                        : "text-[#5b5f64]"
                    }
                  />
                  {paymentMethod === "wallet" ? (
                    <CircleCheckBig size={20} className="text-[#0048e2]" />
                  ) : null}
                </div>
                <p className="text-sm font-bold uppercase tracking-wider">Digital Wallet</p>
              </button>
            </div>

            <div className="mt-8 space-y-6">
              <div>
                <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={cardholderName}
                  onChange={(event) => setCardholderName(event.target.value)}
                  disabled={paymentMethod !== "card"}
                  placeholder="ALEX STERLING"
                  className="w-full rounded-lg border-none border-b-2 border-[#aeb2b7]/20 bg-white p-4 font-heading font-bold text-[#2f3337] outline-none transition focus:border-[#0048e2] disabled:opacity-50"
                />
              </div>

              <div>
                <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  Card Number
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={(event) =>
                    setCardNumber(normalizeCardNumberInput(event.target.value))
                  }
                  disabled={paymentMethod !== "card"}
                  placeholder="0000 0000 0000 0000"
                  className="w-full rounded-lg border-none border-b-2 border-[#aeb2b7]/20 bg-white p-4 font-heading font-bold tracking-widest outline-none transition focus:border-[#0048e2] disabled:opacity-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={expiryDate}
                    onChange={(event) =>
                      setExpiryDate(normalizeExpiryInput(event.target.value))
                    }
                    disabled={paymentMethod !== "card"}
                    placeholder="MM/YY"
                    className="w-full rounded-lg border-none border-b-2 border-[#aeb2b7]/20 bg-white p-4 font-heading font-bold outline-none transition focus:border-[#0048e2] disabled:opacity-50"
                  />
                </div>

                <div>
                  <label className="mb-2 ml-1 block text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                    CVC / CVV
                  </label>
                  <input
                    type="password"
                    inputMode="numeric"
                    value={cvv}
                    onChange={(event) =>
                      setCvv(event.target.value.replace(/\D/g, "").slice(0, 4))
                    }
                    disabled={paymentMethod !== "card"}
                    placeholder="•••"
                    className="w-full rounded-lg border-none border-b-2 border-[#aeb2b7]/20 bg-white p-4 font-heading font-bold outline-none transition focus:border-[#0048e2] disabled:opacity-50"
                  />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="lg:col-span-5">
          <div className="sticky top-28 rounded-xl bg-[#f2f3f7] p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.04)]">
            <h3 className="mb-8 font-heading text-xl font-extrabold uppercase tracking-tight">
              Order summary
            </h3>

            <div className="mb-10 space-y-6">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#5b5f64]">
                  {selectedBooking ? "Trainer Session" : "Kinetic Pro Elite"}
                </span>
                <span className="font-heading font-bold">{formatCurrency(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#5b5f64]">Processing Fee</span>
                <span className="font-heading font-bold text-[#5b5f64]">
                  {formatCurrency(paymentSummary.processingFee)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#5b5f64]">Taxes</span>
                <span className="font-heading font-bold">
                  {formatCurrency(paymentSummary.taxes)}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-[#5b5f64]">Discount</span>
                <span className="font-heading font-bold text-emerald-700">
                  -{formatCurrency(paymentSummary.discount)}
                </span>
              </div>

              <div className="border-t border-[#aeb2b7]/10 pt-6">
                <label className="mb-3 block text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  Promo Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={promoInput}
                    onChange={(event) => setPromoInput(event.target.value.toUpperCase())}
                    placeholder="ENTER CODE"
                    className="flex-grow rounded-lg border-none border-b-2 border-[#aeb2b7]/20 bg-white p-3 font-heading text-xs font-bold outline-none focus:border-[#0048e2]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyPromoCode}
                    className="rounded-lg bg-[#2f3337] px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-[#f9f9fc] transition hover:bg-[#5b5f64]"
                  >
                    Apply
                  </button>
                </div>
                {appliedPromoCode ? (
                  <p className="mt-2 text-xs font-semibold text-emerald-700">
                    Applied: {appliedPromoCode}
                  </p>
                ) : null}
              </div>

              <div className="flex items-end justify-between border-t border-[#aeb2b7]/10 pt-8">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                    Total Amount
                  </p>
                  <p className="font-heading text-4xl font-black text-[#0048e2]">
                    {formatCurrency(paymentSummary.total)}
                  </p>
                </div>
                <p className="pb-1 text-[10px] font-bold uppercase tracking-widest text-[#5b5f64]">
                  USD
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <button
                type="button"
                onClick={handleConfirmPayment}
                disabled={checkoutMutation.isPending || !selectedBooking}
                className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-r from-[#0048e2] to-[#0052fe] py-5 text-sm font-heading font-black uppercase tracking-widest text-white shadow-xl shadow-[#0048e2]/20 transition hover:opacity-90 active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {checkoutMutation.isPending ? (
                  <>
                    <LoaderCircle size={18} className="animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Confirm and Pay
                    <Rocket size={18} />
                  </>
                )}
              </button>
              <p className="px-4 text-center text-[10px] font-semibold text-[#5b5f64]/70">
                By clicking confirm, you agree to our Terms of Performance and Privacy Policy.
              </p>
            </div>

            <div className="mt-8 flex justify-center gap-6 opacity-40 transition hover:opacity-100">
              <ShieldCheck size={28} className="text-[#2f3337]" />
              <BadgeCheck size={28} className="text-[#2f3337]" />
              <HeartPulse size={28} className="text-[#2f3337]" />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-center gap-3">
            <HelpCircle size={14} className="text-[#0048e2]" />
            <Link
              to="/profile"
              className="text-[10px] font-bold uppercase tracking-widest text-[#0048e2] hover:underline"
            >
              Need help with checkout?
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

export default PaymentPage;