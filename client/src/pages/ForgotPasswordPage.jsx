import { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import authApi from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function ForgotPasswordPage() {
  const { isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldError, setFieldError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  function validateEmail() {
    const trimmedEmail = email.trim();

    if (!trimmedEmail) {
      setFieldError("Email is required.");
      return false;
    }

    if (!EMAIL_PATTERN.test(trimmedEmail)) {
      setFieldError("Enter a valid email address.");
      return false;
    }

    setFieldError("");
    return true;
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setServerError("");
    setSuccessMessage("");

    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await authApi.forgotPassword({ email: email.trim() });
      setSuccessMessage(
        response?.message ||
          "If the email exists, a password reset link has been sent.",
      );
    } catch (error) {
      setServerError(
        getApiErrorMessage(error, "Unable to send reset link right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-[#f9f9fc] font-body text-[#2f3337]">
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-6 py-8">
        <div className="font-heading text-3xl font-extrabold tracking-tighter text-[#2f3337]">
          FITAI
        </div>
      </header>

      <section className="flex flex-grow items-center justify-center px-4">
        <div className="w-full max-w-[440px] flex-col items-center">
          <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-full bg-[#dee1f9]">
            <LockKeyhole className="h-9 w-9 text-[#0048e2]" />
          </div>

          <div className="mb-10 text-center">
            <h1 className="mb-3 font-heading text-3xl font-extrabold tracking-tight text-[#2f3337]">
              Forgot Password?
            </h1>
            <p className="mx-auto max-w-[320px] text-base text-[#5b5f64]">
              Enter your email address and we will send you instructions to
              reset your password.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="forgot-email"
                className="block px-1 text-xs font-semibold uppercase tracking-widest text-[#5b5f64]"
              >
                Email Address
              </label>

              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail className="h-5 w-5 text-[#777b80]" />
                </div>

                <input
                  id="forgot-email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-xl border-none bg-white py-4 pl-12 pr-4 text-base text-[#2f3337] outline-none ring-1 ring-[#aeb2b7]/20 transition-all focus:bg-[#dfe3e8] focus:ring-2 focus:ring-[#0048e2]"
                  placeholder="name@example.com"
                  autoComplete="email"
                />
              </div>

              {fieldError ? (
                <p className="text-xs text-rose-600">{fieldError}</p>
              ) : null}
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
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-[#0048e2] to-[#0052fe] px-6 py-4 font-heading text-lg font-bold text-white shadow-[0px_20px_40px_rgba(0,72,226,0.15)] transition-all active:scale-95 disabled:opacity-70"
            >
              <span>{isSubmitting ? "Sending..." : "Send Reset Link"}</span>
              <ArrowRight className="h-5 w-5" />
            </button>
          </form>

          <div className="mt-10">
            <Link
              to="/login"
              className="group flex items-center gap-2 text-sm font-semibold text-[#5b5f64] transition-colors hover:text-[#0048e2]"
            >
              <ArrowLeft className="h-5 w-5 transition-transform group-hover:-translate-x-1" />
              Back to Login
            </Link>
          </div>
        </div>
      </section>

      <div className="pointer-events-none fixed -z-10 right-[-10%] top-[-10%] h-[40%] w-[40%] rounded-full bg-[#0048e2]/5 blur-[120px]" />
      <div className="pointer-events-none fixed -z-10 bottom-[-5%] left-[-5%] h-[30%] w-[30%] rounded-full bg-[#6f567d]/5 blur-[100px]" />
    </main>
  );
}

export default ForgotPasswordPage;
