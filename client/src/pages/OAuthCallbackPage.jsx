import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getDashboardPathForRole } from "../utils/roleRoutes";
import { getApiErrorMessage } from "../services/apiClient";
import PageLoader from "../components/common/PageLoader";

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { completeOAuthLogin } = useAuth();
  const [errorMessage, setErrorMessage] = useState("");
  const accessToken = useMemo(
    () => searchParams.get("accessToken") || "",
    [searchParams],
  );

  useEffect(() => {
    let isMounted = true;

    async function completeFlow() {
      if (!accessToken) {
        setErrorMessage("OAuth login failed: missing access token.");
        return;
      }

      try {
        const user = await completeOAuthLogin(accessToken);

        if (!isMounted) {
          return;
        }

        navigate(getDashboardPathForRole(user?.role), { replace: true });
      } catch (error) {
        if (isMounted) {
          setErrorMessage(getApiErrorMessage(error, "OAuth login failed."));
        }
      }
    }

    completeFlow();

    return () => {
      isMounted = false;
    };
  }, [accessToken, completeOAuthLogin, navigate]);

  if (!errorMessage) {
    return <PageLoader label="Finalizing Google sign in..." />;
  }

  return (
    <section className="glass-card mx-auto max-w-xl p-8 text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-neon-amber">
        OAuth Error
      </p>
      <h1 className="mt-3 font-heading text-3xl font-bold uppercase tracking-[0.08em] text-slate-900">
        Unable To Complete Login
      </h1>
      <p className="mt-4 text-sm text-slate-700">{errorMessage}</p>
      <button
        type="button"
        onClick={() => navigate("/login", { replace: true })}
        className="mt-6 rounded-full border border-neon-cyan bg-neon-cyan/20 px-5 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-neon-cyan"
      >
        Back To Login
      </button>
    </section>
  );
}

export default OAuthCallbackPage;
