import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * Komponen Penjaga Rute (Auth Guard)
 * Mencegah pengguna yang belum login masuk ke halaman khusus,
 * serta memastikan role pengguna (ADMIN / PETUGAS) sesuai hak aksesnya.
 */
export default function ProtectedRoute({ allowedRoles }) {
  const { isAuthenticated, role, isLoading } = useAuth();
  const location = useLocation();

  // Tampilkan layar loading saat sesi sedang dibaca dari storage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-pasar-50 flex flex-col items-center justify-center">
        <Loader2 className="h-8 w-8 text-pasar-600 animate-spin mb-3" />
        <p className="text-sm font-medium text-gray-600">Memverifikasi sesi...</p>
      </div>
    );
  }

  // Jika belum login, redirect ke halaman /login
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Jika ada pembatasan role dan role pengguna tidak terdaftar:
  if (allowedRoles && !allowedRoles.includes(role)) {
    // Alihkan ke halaman yang sesuai dengan perannya
    if (role === "ADMIN") {
      return <Navigate to="/dashboard" replace />;
    } else if (role === "PETUGAS") {
      return <Navigate to="/scanner" replace />;
    }
    return <Navigate to="/login" replace />;
  }

  // Jika lolos semua validasi, tampilkan halaman anak
  return <Outlet />;
}
