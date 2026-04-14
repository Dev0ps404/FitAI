import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import authApi from "../services/authApi";
import { registerAccessTokenGetter } from "../services/apiClient";

const AuthContext = createContext(null);
const ACCESS_TOKEN_STORAGE_KEY = "fitai_access_token";

function readStoredAccessToken() {
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || "";
}

export function AuthProvider({ children }) {
  const [authUser, setAuthUser] = useState(null);
  const [accessToken, setAccessToken] = useState(readStoredAccessToken);
  const [isAuthBusy, setIsAuthBusy] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const hasBootstrappedRef = useRef(false);

  const persistAccessToken = useCallback((token) => {
    const nextToken = token || "";
    setAccessToken(nextToken);

    if (nextToken) {
      window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, nextToken);
      return;
    }

    window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  }, []);

  const clearSession = useCallback(() => {
    persistAccessToken("");
    setAuthUser(null);
  }, [persistAccessToken]);

  const applyAuthData = useCallback(
    (data) => {
      const nextAccessToken = data?.accessToken || "";
      const nextUser = data?.user || null;

      persistAccessToken(nextAccessToken);
      setAuthUser(nextUser);

      return nextUser;
    },
    [persistAccessToken],
  );

  const hydrateAuthUser = useCallback(async () => {
    const response = await authApi.getMe();
    const nextUser = response?.data?.user || null;

    setAuthUser(nextUser);

    return nextUser;
  }, []);

  const refreshSession = useCallback(async () => {
    const response = await authApi.refreshSession();
    const responseData = response?.data || null;

    if (!responseData?.accessToken) {
      throw new Error("No access token returned from refresh.");
    }

    persistAccessToken(responseData.accessToken);

    if (responseData.user) {
      setAuthUser(responseData.user);
    }

    return responseData;
  }, [persistAccessToken]);

  const login = useCallback(
    async (payload) => {
      setIsAuthBusy(true);

      try {
        const response = await authApi.login(payload);
        applyAuthData(response?.data || null);
        return response;
      } finally {
        setIsAuthBusy(false);
      }
    },
    [applyAuthData],
  );

  const signup = useCallback(
    async (payload) => {
      setIsAuthBusy(true);

      try {
        const response = await authApi.signup(payload);
        applyAuthData(response?.data || null);
        return response;
      } finally {
        setIsAuthBusy(false);
      }
    },
    [applyAuthData],
  );

  const logout = useCallback(
    async ({ allSessions = false } = {}) => {
      setIsAuthBusy(true);

      try {
        if (allSessions) {
          await authApi.logoutAll();
        } else {
          await authApi.logout();
        }
      } finally {
        clearSession();
        setIsAuthBusy(false);
      }
    },
    [clearSession],
  );

  const completeOAuthLogin = useCallback(
    async (oauthAccessToken) => {
      if (!oauthAccessToken) {
        throw new Error("Missing OAuth access token");
      }

      setIsAuthBusy(true);

      try {
        persistAccessToken(oauthAccessToken);
        const user = await hydrateAuthUser();

        if (!user) {
          throw new Error("Unable to load account after OAuth login.");
        }

        return user;
      } catch (error) {
        clearSession();
        throw error;
      } finally {
        setIsAuthBusy(false);
      }
    },
    [clearSession, hydrateAuthUser, persistAccessToken],
  );

  useEffect(() => {
    registerAccessTokenGetter(() => accessToken);
  }, [accessToken]);

  useEffect(() => {
    if (hasBootstrappedRef.current) {
      return;
    }

    hasBootstrappedRef.current = true;
    let isMounted = true;

    async function bootstrap() {
      setIsBootstrapping(true);

      try {
        if (accessToken) {
          await hydrateAuthUser();
        } else {
          const refreshed = await refreshSession();

          if (refreshed?.accessToken) {
            await hydrateAuthUser();
          }
        }
      } catch {
        clearSession();
      } finally {
        if (isMounted) {
          setIsBootstrapping(false);
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, [accessToken, clearSession, hydrateAuthUser, refreshSession]);

  const isAuthenticated = Boolean(accessToken && authUser);

  const value = useMemo(
    () => ({
      authUser,
      accessToken,
      isAuthenticated,
      isAuthBusy,
      isBootstrapping,
      login,
      signup,
      logout,
      refreshSession,
      completeOAuthLogin,
      setAuthUser,
      clearSession,
    }),
    [
      accessToken,
      authUser,
      clearSession,
      completeOAuthLogin,
      isAuthBusy,
      isAuthenticated,
      isBootstrapping,
      login,
      logout,
      refreshSession,
      signup,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
