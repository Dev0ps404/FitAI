import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Dumbbell, Sparkles, UserRound } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getGoogleOAuthUrl } from "../services/authApi";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const UPPERCASE_PATTERN = /[A-Z]/;
const LOWERCASE_PATTERN = /[a-z]/;
const NUMBER_PATTERN = /\d/;

function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthBusy, isAuthenticated } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("user");
  const [fieldErrors, setFieldErrors] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });
  const [serverError, setServerError] = useState("");

  function validateForm() {
    const nextErrors = {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "",
    };

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();

    if (trimmedName.length < 2) {
      nextErrors.name = "Full name must be at least 2 characters.";
    }

    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!EMAIL_PATTERN.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!password) {
      nextErrors.password = "Password is required.";
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
      nextErrors.confirmPassword = "Confirm your password.";
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    if (!["user", "trainer"].includes(role)) {
      nextErrors.role = "Select a valid profile path.";
    }

    setFieldErrors(nextErrors);

    return !Object.values(nextErrors).some(Boolean);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setServerError("");

    if (!validateForm()) {
      return;
    }

    try {
      await signup({
        name: name.trim(),
        email: email.trim(),
        password,
        role,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to signup right now."));
    }
  }

  function handleGoogleSignup() {
    window.location.href = getGoogleOAuthUrl();
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-[#f9f9fc] pb-12 pt-24 text-[#2f3337]">
      <header className="fixed inset-x-0 top-0 z-50 bg-[#f9f9fc]/80 backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="font-heading text-2xl font-extrabold tracking-tighter text-[#2f3337]">
              FITAI
            </span>
          </div>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              to="/"
              className="text-sm font-semibold text-[#2f3337]/60 transition-colors hover:text-[#0052FF]"
            >
              Features
            </Link>
            <Link
              to="/"
              className="text-sm font-semibold text-[#2f3337]/60 transition-colors hover:text-[#0052FF]"
            >
              Science
            </Link>
            <Link
              to="/"
              className="text-sm font-semibold text-[#2f3337]/60 transition-colors hover:text-[#0052FF]"
            >
              Community
            </Link>
          </nav>

          <Link
            to="/login"
            className="rounded-xl px-5 py-2 text-sm font-bold text-[#0052FF] transition-all duration-200 hover:bg-[#dfe3e8] active:scale-95"
          >
            Log in instead
          </Link>
        </div>
      </header>

      <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full bg-[#0048e2]/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-[#6f567d]/5 blur-3xl" />

      <section className="relative mx-auto flex w-full max-w-5xl flex-grow items-center justify-center px-6">
        <div className="grid w-full grid-cols-1 items-center gap-12 lg:grid-cols-12">
          <aside className="hidden space-y-8 lg:col-span-5 lg:block">
            <div className="space-y-4">
              <span className="inline-block rounded-full bg-[#dee1f9] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4d5164]">
                Precision Fitness
              </span>

              <h1 className="font-heading text-5xl font-extrabold leading-tight tracking-[-0.02em] text-[#2f3337]">
                Your journey to
                <br />
                <span className="italic text-[#0048e2]">elite performance</span>
                <br />
                starts here.
              </h1>

              <p className="max-w-md leading-relaxed text-[#5b5f64]">
                Join the next generation of data-driven athletes and trainers.
                FITAI bridges biological metrics and actionable training
                intelligence.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2 rounded-3xl bg-[#f2f3f7] p-6">
                <Sparkles size={18} className="text-[#0048e2]" />
                <h3 className="font-heading text-sm font-bold">
                  Real-time Biometrics
                </h3>
              </div>

              <div className="space-y-2 rounded-3xl bg-[#f2f3f7] p-6">
                <Dumbbell size={18} className="text-[#6f567d]" />
                <h3 className="font-heading text-sm font-bold">
                  AI Optimization
                </h3>
              </div>
            </div>
          </aside>

          <section className="lg:col-span-7">
            <div className="rounded-[2rem] border border-[#aeb2b7]/10 bg-white p-8 shadow-[0px_20px_40px_rgba(47,51,55,0.06)] lg:p-12">
              <div className="flex flex-col gap-8">
                <div className="space-y-2">
                  <h2 className="font-heading text-3xl font-bold tracking-[-0.02em]">
                    Create Account
                  </h2>
                  <p className="text-[#5b5f64]">
                    Elevate your potential. Precision at every step.
                  </p>
                </div>

                <div className="flex gap-2">
                  <div className="h-1 w-12 rounded-full bg-[#0048e2]" />
                  <div className="h-1 w-12 rounded-full bg-[#dfe3e8]" />
                  <div className="h-1 w-12 rounded-full bg-[#dfe3e8]" />
                </div>

                <div className="space-y-3">
                  <span className="text-xs font-semibold uppercase tracking-widest text-[#5b5f64]">
                    Select Your Profile Path
                  </span>

                  <div className="grid grid-cols-2 rounded-2xl bg-[#f2f3f7] p-1.5">
                    <button
                      type="button"
                      onClick={() => setRole("user")}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition-all active:scale-95 ${
                        role === "user"
                          ? "bg-white text-[#0048e2] shadow-sm"
                          : "text-[#5b5f64] hover:text-[#2f3337]"
                      }`}
                    >
                      <UserRound size={18} />
                      Athlete
                    </button>

                    <button
                      type="button"
                      onClick={() => setRole("trainer")}
                      className={`flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold transition-all active:scale-95 ${
                        role === "trainer"
                          ? "bg-white text-[#0048e2] shadow-sm"
                          : "text-[#5b5f64] hover:text-[#2f3337]"
                      }`}
                    >
                      <Dumbbell size={18} />
                      Trainer
                    </button>
                  </div>

                  {fieldErrors.role ? (
                    <p className="text-xs text-rose-600">{fieldErrors.role}</p>
                  ) : null}
                </div>

                <form className="space-y-6" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label
                        htmlFor="name"
                        className="ml-1 text-xs font-bold uppercase tracking-widest text-[#2f3337]/70"
                      >
                        Full Name
                      </label>
                      <input
                        id="name"
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full rounded-xl border-none bg-[#f2f3f7] px-5 py-4 text-[#2f3337] placeholder:text-[#5b5f64]/40 outline-none transition-all focus:bg-[#dfe3e8] focus:ring-2 focus:ring-[#0048e2]/20"
                        placeholder="Alex Rivers"
                        autoComplete="name"
                      />
                      {fieldErrors.name ? (
                        <p className="text-xs text-rose-600">
                          {fieldErrors.name}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="email"
                        className="ml-1 text-xs font-bold uppercase tracking-widest text-[#2f3337]/70"
                      >
                        Email Address
                      </label>
                      <input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        className="w-full rounded-xl border-none bg-[#f2f3f7] px-5 py-4 text-[#2f3337] placeholder:text-[#5b5f64]/40 outline-none transition-all focus:bg-[#dfe3e8] focus:ring-2 focus:ring-[#0048e2]/20"
                        placeholder="alex@performance.ai"
                        autoComplete="email"
                      />
                      {fieldErrors.email ? (
                        <p className="text-xs text-rose-600">
                          {fieldErrors.email}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="password"
                        className="ml-1 text-xs font-bold uppercase tracking-widest text-[#2f3337]/70"
                      >
                        Password
                      </label>
                      <input
                        id="password"
                        type="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        className="w-full rounded-xl border-none bg-[#f2f3f7] px-5 py-4 text-[#2f3337] placeholder:text-[#5b5f64]/40 outline-none transition-all focus:bg-[#dfe3e8] focus:ring-2 focus:ring-[#0048e2]/20"
                        placeholder="********"
                        autoComplete="new-password"
                      />
                      {fieldErrors.password ? (
                        <p className="text-xs text-rose-600">
                          {fieldErrors.password}
                        </p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="confirm-password"
                        className="ml-1 text-xs font-bold uppercase tracking-widest text-[#2f3337]/70"
                      >
                        Confirm Password
                      </label>
                      <input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(event.target.value)
                        }
                        className="w-full rounded-xl border-none bg-[#f2f3f7] px-5 py-4 text-[#2f3337] placeholder:text-[#5b5f64]/40 outline-none transition-all focus:bg-[#dfe3e8] focus:ring-2 focus:ring-[#0048e2]/20"
                        placeholder="********"
                        autoComplete="new-password"
                      />
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

                  <button
                    type="submit"
                    disabled={isAuthBusy}
                    className="w-full rounded-2xl bg-gradient-to-br from-[#0048e2] to-[#0052fe] py-5 text-lg font-bold text-white shadow-[0_10px_30px_-10px_rgba(0,72,226,0.3)] transition-all hover:brightness-110 active:scale-[0.98] disabled:opacity-70"
                  >
                    {isAuthBusy ? "Creating account..." : "Sign Up"}
                  </button>
                </form>

                <div className="space-y-6">
                  <div className="relative flex items-center">
                    <div className="flex-grow border-t border-[#aeb2b7]/20" />
                    <span className="mx-4 flex-shrink text-xs font-semibold uppercase tracking-widest text-[#5b5f64]">
                      or continue with
                    </span>
                    <div className="flex-grow border-t border-[#aeb2b7]/20" />
                  </div>

                  <button
                    type="button"
                    onClick={handleGoogleSignup}
                    className="flex w-full items-center justify-center gap-3 rounded-2xl border border-[#aeb2b7]/20 bg-white py-4 font-semibold transition-colors hover:bg-[#f2f3f7] active:scale-[0.98]"
                  >
                    <img
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuDa8j8sXjGvITzHXtgwZ92drFJiK3dIaFN1trCWu6K3uejvNPVctEisZ5iwafqyvAyMyGfhTS80DMXyZZsrhO4s5cLE1PDlcOBKEzpUi1nikSabQhvYp0GdadXTuxCg8c2juYliml4qIKg4RxKnZcynFf9FdlNMJuX2KRH4HgteZCKxgyzdAKW2ILo2tEEDI91dFCCYWn9wFilVdtyccxXvQKMiN6akVS4o6veiJkDyKBAh5Wt5l0DhnFuK_Ir2_3AAyjw_Xl1gZE8"
                      alt="Google"
                      className="h-5 w-5"
                    />
                    Google
                  </button>
                </div>

                <p className="px-4 text-center text-[11px] leading-relaxed text-[#5b5f64]/60">
                  By clicking Sign Up, you agree to our
                  <a href="#" className="ml-1 font-semibold underline">
                    Terms of Service
                  </a>
                  and
                  <a href="#" className="ml-1 font-semibold underline">
                    Privacy Policy
                  </a>
                  .
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>

      <div className="pointer-events-none fixed inset-0 -z-10 opacity-40">
        <div className="absolute left-[10%] top-[20%] h-64 w-64 rounded-full border-[40px] border-[#0052fe]/5" />
        <div className="absolute bottom-[10%] right-[15%] h-80 w-80 rotate-12 rounded-[4rem] border-[60px] border-[#ecccfb]/10" />
      </div>
    </main>
  );
}

export default SignupPage;
