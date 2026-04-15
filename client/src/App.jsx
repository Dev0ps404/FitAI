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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <Navbar />

      <main className="mx-auto w-full max-w-6xl px-4 md:px-8">
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
