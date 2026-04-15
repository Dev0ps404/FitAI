import { Navigate, Route, Routes } from "react-router-dom";
import AuthRedirectRoute from "./components/auth/AuthRedirectRoute";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import Diet from "./pages/Diet";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Workout from "./pages/Workout";

function App() {
  return (
    <div className="relative min-h-screen overflow-x-clip text-white">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="ambient-blob absolute -left-16 top-14 h-44 w-44 rounded-full bg-violet-500/35 blur-3xl" />
        <div className="ambient-blob absolute right-0 top-24 h-56 w-56 rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="ambient-blob absolute bottom-10 left-1/3 h-40 w-40 rounded-full bg-violet-400/30 blur-3xl" />
      </div>

      <Navbar />

      <main className="subtle-fade-in mx-auto w-full max-w-6xl px-4 pb-12 pt-2 md:px-8">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route
            path="/login"
            element={
              <AuthRedirectRoute>
                <Login />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthRedirectRoute>
                <Signup />
              </AuthRedirectRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/workout"
            element={
              <ProtectedRoute>
                <Workout />
              </ProtectedRoute>
            }
          />
          <Route
            path="/diet"
            element={
              <ProtectedRoute>
                <Diet />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <Footer />
    </div>
  );
}

export default App;
