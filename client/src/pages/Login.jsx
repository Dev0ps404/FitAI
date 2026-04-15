import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

function Login() {
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
      await login(values);
      const fromPath = location.state?.from;

      if (typeof fromPath === "string" && fromPath.startsWith("/")) {
        navigate(fromPath, { replace: true });
        return;
      }

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to login right now."));
    }
  }

  return (
    <section className="mx-auto flex min-h-[72vh] w-full max-w-xl items-center py-8 md:py-12">
      <div className="panel-card subtle-fade-in w-full">
        <p className="neon-chip mb-4 inline-flex">Welcome Back</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.07em] text-white md:text-4xl">
          Login to FitAI
        </h1>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-violet-200/75">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              className="input-control"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-2 text-xs text-rose-300">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-violet-200/75">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              className="input-control"
              {...register("password")}
            />
            {errors.password ? (
              <p className="mt-2 text-xs text-rose-300">
                {errors.password.message}
              </p>
            ) : null}
          </div>

          {serverError ? (
            <p className="rounded-xl border border-rose-400/30 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
              {serverError}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isAuthBusy}
            className="primary-btn w-full"
          >
            {isAuthBusy ? "Signing in..." : "Login"}
          </button>
        </form>

        <p className="mt-6 text-sm text-violet-100/80">
          No account yet?{" "}
          <Link
            to="/signup"
            className="font-semibold text-violet-300 transition hover:text-violet-200"
          >
            Create one
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Login;
