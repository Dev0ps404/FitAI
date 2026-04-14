import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { LogIn } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getGoogleOAuthUrl } from "../services/authApi";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthBusy } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values) {
    setServerError("");

    try {
      const response = await login(values);
      const userRole = response?.data?.user?.role || "user";
      const fromPath = location.state?.from;

      if (typeof fromPath === "string" && fromPath.startsWith("/")) {
        navigate(fromPath, { replace: true });
        return;
      }

      navigate(getDashboardPathForRole(userRole), { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to login right now."));
    }
  }

  function handleGoogleLogin() {
    window.location.href = getGoogleOAuthUrl();
  }

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-5 inline-flex">Welcome Back</p>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-[0.06em] text-white">
          Login To FitAI
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Access your workouts, AI coach sessions, and role-based dashboard.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-2 text-xs text-neon-amber">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label
              className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400"
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-2 text-xs text-neon-amber">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {serverError ? (
            <div className="rounded-xl border border-neon-amber/40 bg-neon-amber/10 px-4 py-3 text-sm text-neon-amber">
              {serverError}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isAuthBusy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-neon-cyan bg-neon-cyan/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-neon-cyan transition hover:bg-neon-cyan/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <LogIn size={16} />
            {isAuthBusy ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-4 inline-flex w-full items-center justify-center rounded-xl border border-slate-600 bg-slate-900/50 px-4 py-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-200 transition hover:border-slate-500"
        >
          Continue With Google
        </button>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm text-slate-300">
          <Link
            to="/forgot-password"
            className="text-neon-cyan hover:text-neon-lime"
          >
            Forgot password?
          </Link>
          <p>
            New here?{" "}
            <Link to="/signup" className="text-neon-lime hover:text-neon-cyan">
              Create account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

export default LoginPage;
