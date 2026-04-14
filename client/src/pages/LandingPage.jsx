import ModulePreviewCard from "../components/common/ModulePreviewCard";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathForRole } from "../utils/roleRoutes";

const modulePreview = [
  {
    title: "Role Dashboards",
    description:
      "User, trainer, and admin interfaces are now connected to live backend APIs with access control.",
    status: "Frontend Live",
  },
  {
    title: "Secure Auth Flows",
    description:
      "Signup, login, Google OAuth callback, forgot password, and reset password are fully wired.",
    status: "Auth",
  },
  {
    title: "AI Coach Console",
    description:
      "Session-based AI chat and recommendation retrieval are integrated in the frontend experience.",
    status: "AI + Data",
  },
];

function LandingPage() {
  const { isAuthenticated, authUser } = useAuth();

  return (
    <section className="space-y-10">
      <div className="glass-card overflow-hidden p-6 md:p-10">
        <p className="neon-chip mb-5 inline-flex">Step 3 Frontend</p>
        <h1 className="max-w-3xl font-heading text-4xl font-bold uppercase tracking-[0.07em] text-slate-900 md:text-6xl">
          FitAI Dashboards, Authentication, And AI Experience
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-relaxed text-slate-700 md:text-base">
          Frontend is now connected to your production backend modules for
          workouts, nutrition, progress analytics, bookings, trainer approvals,
          notifications, and AI conversations.
        </p>

        <div className="mt-7 flex flex-wrap gap-3">
          {isAuthenticated ? (
            <Link
              to={getDashboardPathForRole(authUser?.role)}
              className="rounded-full border border-neon-cyan bg-neon-cyan/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-cyan transition hover:bg-neon-cyan/30 md:text-sm"
            >
              Open Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-neon-cyan bg-neon-cyan/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-cyan transition hover:bg-neon-cyan/30 md:text-sm"
              >
                Login
              </Link>
              <Link
                to="/signup"
                className="rounded-full border border-neon-lime bg-neon-lime/20 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-neon-lime transition hover:bg-neon-lime/30 md:text-sm"
              >
                Create Account
              </Link>
            </>
          )}
          <Link
            to="/ai-trainer"
            className="rounded-full border border-sky-300 bg-white/80 px-5 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-sky-400 md:text-sm"
          >
            Explore AI Coach
          </Link>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        {modulePreview.map((item) => (
          <ModulePreviewCard key={item.title} {...item} />
        ))}
      </div>
    </section>
  );
}

export default LandingPage;
