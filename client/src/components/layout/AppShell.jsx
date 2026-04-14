import { Dumbbell, Flame, ShieldCheck, UserRound } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

const navItems = [
  {
    to: "/user/dashboard",
    label: "User",
    icon: UserRound,
  },
  {
    to: "/trainer/dashboard",
    label: "Trainer",
    icon: Dumbbell,
  },
  {
    to: "/admin/dashboard",
    label: "Admin",
    icon: ShieldCheck,
  },
  {
    to: "/ai-trainer",
    label: "AI Coach",
    icon: Flame,
  },
];

function AppShell({ children }) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 md:px-8 md:py-8">
      <header className="glass-card mb-6 flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between md:px-6">
        <Link to="/" className="inline-flex items-center gap-3">
          <span className="rounded-xl border border-neon-cyan/70 bg-neon-cyan/10 px-3 py-2 font-heading text-lg font-bold tracking-wide text-neon-cyan shadow-neon">
            FitAI
          </span>
          <span className="text-xs uppercase tracking-[0.22em] text-slate-400">
            Smart Gym Platform
          </span>
        </Link>

        <nav className="flex flex-wrap gap-2">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                [
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition md:text-sm",
                  isActive
                    ? "border-neon-cyan bg-neon-cyan/20 text-neon-cyan shadow-neon"
                    : "border-slate-700 bg-slate-900/40 text-slate-300 hover:border-slate-500",
                ].join(" ")
              }
            >
              <Icon size={14} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="mt-8 border-t border-slate-800 pt-5 text-center text-xs tracking-[0.14em] text-slate-500">
        FITAI STEP 1 SETUP READY
      </footer>
    </div>
  );
}

export default AppShell;
