import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const privateNavItems = [
  { to: "/dashboard", label: "Dashboard", icon: "◉" },
  { to: "/workout", label: "Workout", icon: "◉" },
  { to: "/diet", label: "Diet", icon: "◉" },
];

function Navbar() {
  const navigate = useNavigate();
  const { isAuthenticated, logout, isAuthBusy } = useAuth();

  async function handleLogout() {
    await logout();
    navigate("/", { replace: true });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0d0b18]/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4 md:px-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xl font-bold uppercase tracking-[0.16em] text-white transition-all duration-300 hover:scale-105"
        >
          <span className="inline-block h-2 w-2 rounded-full bg-violet-300 shadow-[0_0_16px_rgba(167,139,250,0.9)]" />
          <span className="bg-gradient-to-r from-violet-100 via-violet-300 to-fuchsia-200 bg-clip-text text-transparent">
            FitAI
          </span>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 md:gap-3">
          {isAuthenticated
            ? privateNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] transition-all duration-300 hover:scale-105 md:text-sm",
                      isActive
                        ? "active-glow border-violet-300/55 bg-violet-500/25 text-white"
                        : "border-white/15 bg-white/5 text-violet-100 hover:border-violet-300/60 hover:bg-violet-500/20",
                    ].join(" ")
                  }
                >
                  <span className="text-[10px] text-violet-200">
                    {item.icon}
                  </span>
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
                    "rounded-full border border-violet-300/40 bg-gradient-to-r from-purple-600/90 to-violet-500/90 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:scale-105 hover:opacity-90 md:text-sm",
                    isActive ? "active-glow" : "",
                  ].join(" ")
                }
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className={({ isActive }) =>
                  [
                    "rounded-full border border-violet-300/45 bg-gradient-to-r from-violet-600 to-fuchsia-500 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-white transition-all duration-300 hover:scale-105 hover:opacity-90 md:text-sm",
                    isActive ? "active-glow" : "",
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
              className="rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-[0.14em] text-violet-100 transition-all duration-300 hover:scale-105 hover:border-violet-300/55 hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-70 md:text-sm"
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
