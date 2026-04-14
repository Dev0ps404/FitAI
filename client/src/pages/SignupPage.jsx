import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const signupSchema = z
  .object({
    name: z.string().trim().min(2, "Name must be at least 2 characters"),
    email: z.string().email("Enter a valid email"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Add one uppercase letter")
      .regex(/[a-z]/, "Add one lowercase letter")
      .regex(/[0-9]/, "Add one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    role: z.enum(["user", "trainer"]),
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function SignupPage() {
  const navigate = useNavigate();
  const { signup, isAuthBusy } = useAuth();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      role: "user",
    },
  });

  async function onSubmit(values) {
    setServerError("");

    try {
      const response = await signup({
        name: values.name,
        email: values.email,
        password: values.password,
        role: values.role,
      });

      const userRole = response?.data?.user?.role || values.role;
      navigate(getDashboardPathForRole(userRole), { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to create account."));
    }
  }

  return (
    <section className="mx-auto w-full max-w-2xl">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-5 inline-flex">Start Tracking</p>
        <h1 className="font-heading text-4xl font-bold uppercase tracking-[0.06em] text-white">
          Create FitAI Account
        </h1>
        <p className="mt-3 text-sm text-slate-300 md:text-base">
          Join as a user or trainer and unlock personalized fitness workflows.
        </p>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400"
              htmlFor="name"
            >
              Full Name
            </label>
            <input
              id="name"
              autoComplete="name"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan"
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-2 text-xs text-neon-amber">
                {errors.name.message}
              </p>
            ) : null}
          </div>

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

          <div className="grid gap-4 md:grid-cols-2">
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
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan"
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-2 text-xs text-neon-amber">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
            <div>
              <label
                className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                autoComplete="new-password"
                className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="mt-2 text-xs text-neon-amber">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs uppercase tracking-[0.16em] text-slate-400">
              Account Type
            </p>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">
                <input type="radio" value="user" {...register("role")} />
                User
              </label>
              <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-slate-700 bg-slate-900/50 px-4 py-3 text-sm text-slate-200">
                <input type="radio" value="trainer" {...register("role")} />
                Trainer
              </label>
            </div>
            {errors.role ? (
              <p className="mt-2 text-xs text-neon-amber">
                {errors.role.message}
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
            <UserPlus size={16} />
            {isAuthBusy ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{" "}
          <Link to="/login" className="text-neon-cyan hover:text-neon-lime">
            Login now
          </Link>
        </p>
      </div>
    </section>
  );
}

export default SignupPage;
