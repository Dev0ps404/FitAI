import { Navigate, Route, Routes } from "react-router-dom";
import AppShell from "./components/layout/AppShell";
import AiTrainerPage from "./pages/AiTrainerPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import LandingPage from "./pages/LandingPage";
import NotFoundPage from "./pages/NotFoundPage";
import TrainerDashboardPage from "./pages/TrainerDashboardPage";
import UserDashboardPage from "./pages/UserDashboardPage";

function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/user/dashboard" element={<UserDashboardPage />} />
        <Route path="/trainer/dashboard" element={<TrainerDashboardPage />} />
        <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
        <Route path="/ai-trainer" element={<AiTrainerPage />} />
        <Route path="/home" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </AppShell>
  );
}

export default App;
