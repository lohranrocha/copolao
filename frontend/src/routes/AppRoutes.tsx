import { Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "../components/AppLayout";
import { ProtectedRoute } from "../components/ProtectedRoute";
import { AdminPage } from "../pages/AdminPage";
import { AllPredictionsPage } from "../pages/AllPredictionsPage";
import { DashboardPage } from "../pages/DashboardPage";
import { HomePage } from "../pages/HomePage";
import { LoginPage, RegisterPage } from "../pages/LoginPage";
import { MatchesPage } from "../pages/MatchesPage";
import { MyPredictionsPage } from "../pages/MyPredictionsPage";
import { PaymentPage } from "../pages/PaymentPage";
import { ProfilePage } from "../pages/ProfilePage";
import { RankingPage } from "../pages/RankingPage";
import { RulesPage } from "../pages/RulesPage";

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/cadastro" element={<RegisterPage />} />
      <Route path="/pagamento/:paymentId" element={<PaymentPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/jogos" element={<MatchesPage />} />
          <Route path="/palpites" element={<MyPredictionsPage />} />
          <Route path="/todos-palpites" element={<AllPredictionsPage />} />
          <Route path="/ranking" element={<RankingPage />} />
          <Route path="/regras" element={<RulesPage />} />
          <Route path="/perfil" element={<ProfilePage />} />
          <Route element={<ProtectedRoute adminOnly />}>
            <Route path="/admin" element={<AdminPage />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
