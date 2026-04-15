import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getApiErrorMessage } from "../services/apiClient";

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
  })
  .refine((value) => value.password === value.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  });

function Signup() {
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
    },
  });

  async function onSubmit(values) {
    setServerError("");

    try {
      await signup({
        name: values.name,
        email: values.email,
        password: values.password,
        role: "user",
      });

      navigate("/dashboard", { replace: true });
    } catch (error) {
      setServerError(getApiErrorMessage(error, "Unable to create account."));
    }
  }

  return (
    <section className="mx-auto w-full max-w-xl py-8 md:py-12">
      <div className="panel-card">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-lime-300">
          Join FitAI
        </p>
        <h1 className="text-3xl font-bold uppercase tracking-[0.07em] text-zinc-100 md:text-4xl">
          Create Account
        </h1>

        <form className="mt-7 space-y-4" onSubmit={handleSubmit(onSubmit)}>
          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
              Full Name
            </label>
            <input
              autoComplete="name"
              className="input-control"
              {...register("name")}
            />
            {errors.name ? (
              <p className="mt-2 text-xs text-rose-300">
                {errors.name.message}
              </p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
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

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
                Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="input-control"
                {...register("password")}
              />
              {errors.password ? (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.password.message}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-2 block text-xs uppercase tracking-[0.14em] text-zinc-400">
                Confirm Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                className="input-control"
                {...register("confirmPassword")}
              />
              {errors.confirmPassword ? (
                <p className="mt-2 text-xs text-rose-300">
                  {errors.confirmPassword.message}
                </p>
              ) : null}
            </div>
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
            {isAuthBusy ? "Creating account..." : "Signup"}
          </button>
        </form>

        <p className="mt-6 text-sm text-zinc-300">
          Already have an account?{" "}
          <Link to="/login" className="text-lime-300 hover:text-lime-200">
            Login
          </Link>
        </p>
      </div>
    </section>
  );
}

export default Signup;
