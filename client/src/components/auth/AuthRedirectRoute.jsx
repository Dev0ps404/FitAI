import { Navigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

function AuthRedirectRoute({ children }) {
  const { isAuthenticated, isBootstrapping } = useAuth();

  if (isBootstrapping) {
    return children;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AuthRedirectRoute;
