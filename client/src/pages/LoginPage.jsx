import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getGoogleOAuthUrl } from "../services/authApi";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthBusy, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState({ email: "", password: "" });
  const [serverError, setServerError] = useState("");

  function validateForm() {
    const nextErrors = { email: "", password: "" };

    if (!email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
    }

    setFieldErrors(nextErrors);

    return !nextErrors.email && !nextErrors.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    if (!validateForm()) {
      return;
    }

    try {
      await login({ email: email.trim(), password });
      navigate("/", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to login right now."));
    }
  }

  function handleGoogleLogin() {
    window.location.href = getGoogleOAuthUrl();
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9fc] px-6 py-12 text-[#2f3337]">
      <div className="pointer-events-none absolute bottom-[-10%] left-[-5%] h-[35rem] w-[35rem] rounded-full bg-[#ecccfb]/30 blur-3xl" />
      <div className="pointer-events-none absolute right-[-5%] top-[-10%] h-[40rem] w-[40rem] rounded-full bg-[#0052fe]/10 blur-3xl" />

      <section className="z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center">
        <div className="mb-10 text-center">
          <h1 className="font-heading text-4xl font-extrabold tracking-tighter text-[#2f3337]">
            FITAI
          </h1>
          <p className="mt-2 text-sm text-[#5b5f64]">
            Precision performance starts here.
          </p>
        </div>

        <div className="rounded-xl border border-[#aeb2b7]/20 bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] md:p-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-xs uppercase tracking-wider text-[#5b5f64]"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full border-0 border-b-2 border-[#aeb2b7]/40 bg-transparent px-0 py-3 font-medium text-[#2f3337] placeholder:text-[#aeb2b7] focus:border-[#0048e2] focus:ring-0"
                placeholder="name@example.com"
                autoComplete="email"
              />
              {fieldErrors.email ? (
                <p className="text-xs text-rose-600">{fieldErrors.email}</p>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="block text-xs uppercase tracking-wider text-[#5b5f64]"
                >
                  Password
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-[#0048e2] transition hover:underline"
                >
                  Forgot password?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full border-0 border-b-2 border-[#aeb2b7]/40 bg-transparent px-0 py-3 font-medium text-[#2f3337] placeholder:text-[#aeb2b7] focus:border-[#0048e2] focus:ring-0"
                placeholder="********"
                autoComplete="current-password"
              />
              {fieldErrors.password ? (
                <p className="text-xs text-rose-600">{fieldErrors.password}</p>
              ) : null}
            </div>

            {serverError ? (
              <p className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {serverError}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={isAuthBusy}
              className="w-full rounded-xl bg-gradient-to-br from-[#0048e2] to-[#0052fe] py-4 text-lg font-bold text-[#edeeff] shadow-lg shadow-[#0048e2]/20 transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
            >
              {isAuthBusy ? "Logging in..." : "Login"}
            </button>
          </form>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-[#aeb2b7]/25" />
            </div>
            <div className="relative flex justify-center text-xs uppercase tracking-widest">
              <span className="bg-white px-4 text-[#777b80]">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            className="flex w-full items-center justify-center gap-3 rounded-xl bg-[#f2f3f7] py-4 font-semibold text-[#2f3337] transition hover:bg-[#e6e8ed] active:scale-[0.98]"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
            </svg>
            Google
          </button>
        </div>

        <div className="mt-8 text-center text-sm text-[#5b5f64]">
          New to the elite program?
          <Link to="/signup" className="ml-1 font-semibold text-[#0048e2] hover:underline">
            Create an account
          </Link>
        </div>
      </section>

      <footer className="z-10 px-6 py-8 text-center text-xs uppercase tracking-widest text-[#aeb2b7]">
        (c) 2024 FITAI Performance Labs. All rights reserved.
      </footer>
    </main>
  );
}

export default LoginPage;
