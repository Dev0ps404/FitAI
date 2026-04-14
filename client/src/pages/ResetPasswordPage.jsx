import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import authApi from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

const resetPasswordSchema = z
  .object({
    newPassword: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Add one uppercase letter")
      .regex(/[a-z]/, "Add one lowercase letter")
      .regex(/[0-9]/, "Add one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((value) => value.newPassword === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = useMemo(() => searchParams.get("token") || "", [searchParams]);
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(values) {
    if (!token) {
      setFeedback(
        "Invalid reset link. Please request a new password reset email.",
      );
      return;
    }

    setIsSubmitting(true);
    setFeedback("");

    try {
      const response = await authApi.resetPassword({
        token,
        newPassword: values.newPassword,
      });

      setFeedback(response?.message || "Password updated successfully.");
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (error) {
      setFeedback(getApiErrorMessage(error, "Unable to reset password."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-5 inline-flex">Secure Reset</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.06em] text-white">
          Set New Password
        </h1>
        <p className="mt-3 text-sm text-slate-300">
          Create a strong password to protect your FitAI account.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-400"
              htmlFor="newPassword"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              autoComplete="new-password"
              className="w-full rounded-xl border border-slate-700 bg-slate-900/60 px-4 py-3 text-sm text-white outline-none transition focus:border-neon-cyan"
              {...register("newPassword")}
            />
            {errors.newPassword ? (
              <p className="mt-2 text-xs text-neon-amber">
                {errors.newPassword.message}
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl border border-neon-cyan bg-neon-cyan/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-neon-cyan transition hover:bg-neon-cyan/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Updating..." : "Update Password"}
          </button>
        </form>

        {feedback ? (
          <div className="mt-4 rounded-xl border border-slate-700 bg-slate-900/40 px-4 py-3 text-sm text-slate-200">
            {feedback}
          </div>
        ) : null}

        <p className="mt-6 text-sm text-slate-300">
          <Link to="/login" className="text-neon-cyan hover:text-neon-lime">
            Return to login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default ResetPasswordPage;
