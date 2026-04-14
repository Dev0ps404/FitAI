import {
  Dumbbell,
  Flame,
  Home,
  LayoutDashboard,
  LogIn,
  LogOut,
  ShieldCheck,
  UserPlus,
  UserRound,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDashboardPathForRole, getRoleLabel } from "../../utils/roleRoutes";

const baseNavItems = [
  {
    to: "/",
    label: "Home",
    icon: Home,
  },
  {
    to: "/ai-trainer",
    label: "AI Coach",
    icon: Flame,
    requiresAuth: true,
  },
];

const roleNavItems = [
  {
    to: "/user/dashboard",
    label: "User",
    icon: UserRound,
    role: "user",
  },
  {
    to: "/trainer/dashboard",
    label: "Trainer",
    icon: Dumbbell,
    role: "trainer",
  },
  {
    to: "/admin/dashboard",
    label: "Admin",
    icon: ShieldCheck,
    role: "admin",
  },
];

function AppShell({ children }) {
  const { authUser, isAuthenticated, isAuthBusy, logout } = useAuth();

  const navItems = baseNavItems.filter(
    (item) => !item.requiresAuth || isAuthenticated,
  );

  if (isAuthenticated) {
    const dashboardPath = getDashboardPathForRole(authUser?.role);

    navItems.push({
      to: dashboardPath,
      label: "Dashboard",
      icon: LayoutDashboard,
    });

    const roleMatch = roleNavItems.find((item) => item.role === authUser?.role);

    if (roleMatch && roleMatch.to !== dashboardPath) {
      navItems.push(roleMatch);
    }
  }

  async function handleLogout() {
    await logout();
  }

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 md:px-8 md:py-8">
      <header className="glass-card mb-6 flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <span className="rounded-xl border border-neon-cyan/70 bg-neon-cyan/10 px-3 py-2 font-heading text-lg font-bold tracking-wide text-neon-cyan shadow-neon">
            FitAI
          </span>
          <span className="text-xs uppercase tracking-[0.22em] text-slate-600">
            Smart Gym Platform
          </span>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {navItems.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition md:text-sm",
                  isActive
                    ? "border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-neon"
                    : "border-sky-200 bg-white/80 text-slate-700 hover:border-sky-400",
                ].join(" ")
              }
            >
              {label}
            </NavLink>
          ))}

          {!isAuthenticated ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition md:text-sm",
                    isActive
                      ? "border-neon-cyan bg-neon-cyan/20 text-neon-cyan"
                      : "border-sky-200 bg-white/80 text-slate-700 hover:border-sky-400",
                  ].join(" ")
                }
              >
                <LogIn size={14} />
                Login
              </NavLink>

              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition md:text-sm",
                    isActive
                      ? "border-neon-lime bg-neon-lime/20 text-neon-lime"
                      : "border-sky-200 bg-white/80 text-slate-700 hover:border-sky-400",
                  ].join(" ")
                }
              >
                <UserPlus size={14} />
                Signup
              </NavLink>
            </>
          ) : null}

          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isAuthBusy}
              className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-white/80 px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 transition hover:border-sky-400 disabled:cursor-not-allowed disabled:opacity-70 md:text-sm"
            >
              <LogOut size={14} />
              Logout
            </button>
          ) : null}
        </nav>
      </header>

      {isAuthenticated ? (
        <div className="mb-5 flex items-center justify-between rounded-xl border border-sky-200/90 bg-white/80 px-4 py-3 text-xs uppercase tracking-[0.14em] text-slate-600">
          <span>{authUser?.name || "FitAI User"}</span>
          <span className="text-neon-cyan">{getRoleLabel(authUser?.role)}</span>
        </div>
      ) : null}

      <main className="flex-1">{children}</main>

      <footer className="mt-8 border-t border-sky-200/90 pt-5 text-center text-xs tracking-[0.14em] text-slate-600">
        FITAI STEP 3 FRONTEND ACTIVE
      </footer>
    </div>
  );
}

export default AppShell;
