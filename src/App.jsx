import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./features/auth/LoginPage";
import ScannerPage from "./features/scanner/ScannerPage";
import DashboardPage from "./features/dashboard/DashboardPage";

/**
 * Pengarah Rute Root (/)
 * Mengarahkan pengguna secara cerdas sesuai status login & role
 */
function RootRedirect() {
  const { isAuthenticated, role, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (role === "ADMIN") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Navigate to="/scanner" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Halaman Login (Publik) */}
          <Route path="/login" element={<LoginPage />} />

          {/* Halaman Pemindai QR (Khusus Role PETUGAS) */}
          <Route element={<ProtectedRoute allowedRoles={["PETUGAS"]} />}>
            <Route path="/scanner" element={<ScannerPage />} />
          </Route>

          {/* Halaman Dasbor UPTD (Khusus Role ADMIN) */}
          <Route element={<ProtectedRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/dashboard" element={<DashboardPage />} />
          </Route>

          {/* Rute Default & Fallback */}
          <Route path="/" element={<RootRedirect />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
