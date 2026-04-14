import { Navigate, Route, Routes } from "react-router-dom";
import AuthRedirectRoute from "./components/auth/AuthRedirectRoute";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AppShell from "./components/layout/AppShell";
import AiTrainerPage from "./pages/AiTrainerPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import SignupPage from "./pages/SignupPage";
import TrainerDashboardPage from "./pages/TrainerDashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";
import { useAuth } from "./context/AuthContext";
import { getDashboardPathForRole } from "./utils/roleRoutes";

function DashboardRedirect() {
  const { authUser } = useAuth();

  return <Navigate to={getDashboardPathForRole(authUser?.role)} replace />;
}

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route
          path="/login"
          element={
            <AuthRedirectRoute>
              <LoginPage />
            </AuthRedirectRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <AuthRedirectRoute>
              <SignupPage />
            </AuthRedirectRoute>
          }
        />
        <Route
          path="/forgot-password"
          element={
            <AuthRedirectRoute>
              <ForgotPasswordPage />
            </AuthRedirectRoute>
          }
        />
        <Route
          path="/reset-password"
          element={
            <AuthRedirectRoute>
              <ResetPasswordPage />
            </AuthRedirectRoute>
          }
        />
        <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardRedirect />
            </ProtectedRoute>
          }
        />
        <Route
          path="/user/dashboard"
          element={
            <ProtectedRoute allowedRoles={["user"]}>
              <UserDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trainer/dashboard"
          element={
            <ProtectedRoute allowedRoles={["trainer"]}>
              <TrainerDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-trainer"
          element={
            <ProtectedRoute>
              <AiTrainerPage />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
