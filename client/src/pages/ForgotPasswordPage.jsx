import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link } from "react-router-dom";
import authApi from "../services/authApi";
import { getApiErrorMessage } from "../services/apiClient";

const forgotPasswordSchema = z.object({
  email: z.string().email("Enter a valid email"),
});

function ForgotPasswordPage() {
  const [feedback, setFeedback] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  async function onSubmit(values) {
    setIsSubmitting(true);
    setFeedback("");

    try {
      const response = await authApi.forgotPassword(values);
      setFeedback(
        response?.message ||
          "If your email exists in our system, reset instructions have been sent.",
      );
    } catch (error) {
      setFeedback(
        getApiErrorMessage(error, "Unable to send reset email right now."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl">
      <div className="glass-card p-6 md:p-8">
        <p className="neon-chip mb-5 inline-flex">Account Recovery</p>
        <h1 className="font-heading text-3xl font-bold uppercase tracking-[0.06em] text-slate-900">
          Forgot Password
        </h1>
        <p className="mt-3 text-sm text-slate-700">
          Enter your account email and we will send a secure reset link.
        </p>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label
              className="mb-2 block text-xs uppercase tracking-[0.16em] text-slate-600"
              htmlFor="email"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              className="w-full rounded-xl border border-sky-200 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-neon-cyan"
              {...register("email")}
            />
            {errors.email ? (
              <p className="mt-2 text-xs text-neon-amber">
                {errors.email.message}
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex w-full items-center justify-center rounded-xl border border-neon-cyan bg-neon-cyan/20 px-4 py-3 text-sm font-semibold uppercase tracking-[0.15em] text-neon-cyan transition hover:bg-neon-cyan/30 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>

        {feedback ? (
          <div className="mt-4 rounded-xl border border-sky-200 bg-white/80 px-4 py-3 text-sm text-slate-700">
            {feedback}
          </div>
        ) : null}

        <p className="mt-6 text-sm text-slate-700">
          Remembered your password?{" "}
          <Link to="/login" className="text-neon-cyan hover:text-neon-lime">
            Back to login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default ForgotPasswordPage;
