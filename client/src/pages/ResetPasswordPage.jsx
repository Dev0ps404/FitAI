import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Lock, ShieldCheck } from "lucide-react";
import { Link, Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import authApi from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const NUMBER_PATTERN = /\d/;

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isAuthenticated } = useAuth();

  const token = searchParams.get("token")?.trim() || "";
  const hasValidToken = token.length >= 10;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    token: "",
    password: "",
    confirmPassword: "",
  });
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const tokenPreviewDigits = useMemo(() => {
    const tokenHead = token.slice(0, 6).toUpperCase();
    const preview = tokenHead.padEnd(6, "\u2022");
    return preview.split("").slice(0, 6);
  }, [token]);

  useEffect(() => {
    if (!successMessage) {
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      navigate("/login", { replace: true });
    }, 1800);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [navigate, successMessage]);

  function validateForm() {
    const nextErrors = {
      token: "",
      password: "",
      confirmPassword: "",
    };

    if (!hasValidToken) {
      nextErrors.token =
        "Reset token is missing or invalid. Open the latest reset link from your email.";
    }

    if (!password) {
      nextErrors.password = "New password is required.";
    } else if (password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters.";
    } else if (!UPPERCASE_PATTERN.test(password)) {
      nextErrors.password = "Password must include an uppercase letter.";
    } else if (!LOWERCASE_PATTERN.test(password)) {
      nextErrors.password = "Password must include a lowercase letter.";
    } else if (!NUMBER_PATTERN.test(password)) {
      nextErrors.password = "Password must include a number.";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Confirm your new password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    setFieldErrors(nextErrors);
    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setServerError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.resetPassword({
        token,
        newPassword: password,
      });

      setSuccessMessage(
        response?.message || "Password reset successfully. Redirecting...",
      );
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, "Unable to reset password right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f9f9fc] p-6 font-body text-[#2f3337]">
      <div className="pointer-events-none absolute right-[-5%] top-[-10%] h-[60%] w-[40%] rounded-full bg-[#0052fe]/5 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-5%] left-[-10%] h-[50%] w-[30%] rounded-full bg-[#ecccfb]/20 blur-[100px]" />

      <section className="relative z-10 w-full max-w-xl">
        <div className="mb-12 text-center">
          <span className="font-headline text-4xl font-extrabold tracking-tighter text-[#2f3337]">
            FITAI
          </span>
          <p className="mt-4 font-medium text-[#5b5f64]">
            Security Verification
          </p>
        </div>

        <div className="rounded-3xl border border-[#aeb2b7]/10 bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] md:p-12">
          <div className="mb-10 flex items-center justify-between">
            <div className="flex flex-1 items-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0052fe] text-sm font-bold text-white">
                1
              </div>
              <div className="mx-2 h-1 flex-1 rounded-full bg-[#0052fe]/20">
                <div className="h-full w-1/2 rounded-full bg-[#0052fe]" />
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#dfe3e8] text-sm font-bold text-[#5b5f64]">
                2
              </div>
            </div>
          </div>

          <header className="space-y-2">
            <h1 className="font-headline text-3xl font-extrabold tracking-tight text-[#2f3337]">
              Reset Password
            </h1>
            <p className="leading-relaxed text-[#5b5f64]">
              Enter a strong new password. Your reset link is verified from
              email.
            </p>
          </header>

          <form className="mt-8 space-y-8" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <label className="block text-xs font-semibold uppercase tracking-wider text-[#5b5f64]">
                Verification Code
              </label>
              <div className="flex justify-between gap-2 md:gap-4">
                {tokenPreviewDigits.map((digit, index) => (
                  <input
                    // Token comes from secure URL; this preview mirrors design while keeping flow server-driven.
                    key={`token-digit-${index}`}
                    type="text"
                    readOnly
                    value={digit}
                    className="h-16 w-12 rounded-xl border-none bg-[#f2f3f7] text-center font-headline text-2xl font-bold text-[#2f3337] outline-none transition-all focus:ring-0 md:h-20 md:w-16"
                  />
                ))}
              </div>
              <div className="flex items-center justify-between px-1">
                <span className="text-xs text-[#5b5f64]">
                  Token attached from reset link
                </span>
                <Link
                  to="/forgot-password"
                  className="text-xs font-semibold text-[#0048e2] transition-colors hover:text-[#0042d3]"
                >
                  Request New Link
                </Link>
              </div>
              {fieldErrors.token ? (
                <p className="text-xs text-rose-600">{fieldErrors.token}</p>
              ) : null}
            </div>

            <div className="space-y-6 pt-4">
              <div className="space-y-2">
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5b5f64]"
                >
                  New Password
                </label>
                <div className="group relative">
                  <Lock className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aeb2b7] transition-colors group-focus-within:text-[#0048e2]" />
                  <input
                    id="new-password"
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="w-full rounded-xl border-none bg-[#f2f3f7] py-4 pl-12 pr-4 outline-none transition-all focus:bg-[#dfe3e8] focus:ring-0"
                    placeholder="********"
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.password ? (
                  <p className="text-xs text-rose-600">
                    {fieldErrors.password}
                  </p>
                ) : null}
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="confirm-password"
                  className="block text-xs font-semibold uppercase tracking-wider text-[#5b5f64]"
                >
                  Confirm New Password
                </label>
                <div className="group relative">
                  <ShieldCheck className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#aeb2b7] transition-colors group-focus-within:text-[#0048e2]" />
                  <input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border-none bg-[#f2f3f7] py-4 pl-12 pr-4 outline-none transition-all focus:bg-[#dfe3e8] focus:ring-0"
                    placeholder="********"
                    autoComplete="new-password"
                  />
                </div>
                {fieldErrors.confirmPassword ? (
                  <p className="text-xs text-rose-600">
                    {fieldErrors.confirmPassword}
                  </p>
                ) : null}
              </div>
            </div>

            {serverError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverError}
              </p>
            ) : null}

            {successMessage ? (
              <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting || !hasValidToken}
              className="flex w-full items-center justify-center gap-3 rounded-xl bg-gradient-to-br from-[#0048e2] to-[#0052fe] py-5 font-headline text-lg font-bold text-[#edeeff] transition-all hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>
        </div>

        <div className="mt-8 text-center text-sm text-[#5b5f64]">
          Secured by FITAI Advanced Cryptography.
          <Link to="/login" className="ml-1 font-semibold text-[#0048e2]">
            Back to Login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default ResetPasswordPage;
