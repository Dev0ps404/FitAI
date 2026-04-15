import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const privateNavItems = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/workout", label: "Workout" },
  { to: "/diet", label: "Diet" },
];

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAuthBusy } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-lime-400/20 bg-black/70 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          to="/"
          className="text-xl font-bold uppercase tracking-[0.16em] text-lime-300"
        >
          FitAI
        </Link>

        <nav className="flex flex-wrap items-center gap-2 md:gap-3">
          {isAuthenticated
            ? privateNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition md:text-sm",
                      isActive
                        ? "border-lime-300 bg-lime-400/20 text-lime-200"
                        : "border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:border-lime-400/50",
                    ].join(" ")
                  }
                >
                  {item.label}
                </NavLink>
              ))
            : null}

          {!isAuthenticated ? (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  [
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition md:text-sm",
                    isActive
                      ? "border-lime-300 bg-lime-400/20 text-lime-200"
                      : "border-zinc-700 bg-zinc-900/80 text-zinc-200 hover:border-lime-400/50",
                  ].join(" ")
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  [
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition md:text-sm",
                    isActive
                      ? "border-lime-300 bg-lime-400/20 text-lime-200"
                      : "border-lime-500/50 bg-lime-500/10 text-lime-200 hover:bg-lime-400/20",
                  ].join(" ")
                }
              >
                Signup
              </NavLink>
            </>
          ) : (
            <button
              type="button"
              disabled={isAuthBusy}
              onClick={handleLogout}
              className="rounded-full border border-zinc-700 bg-zinc-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-zinc-200 transition hover:border-lime-400/50 disabled:cursor-not-allowed disabled:opacity-70 md:text-sm"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Navbar;
