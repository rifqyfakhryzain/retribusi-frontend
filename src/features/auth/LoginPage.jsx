import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { User, Lock, Store, ShieldCheck, Zap } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "../../components/ui/Card";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Jika sudah login, langsung arahkan ke halamannya masing-masing
  if (isAuthenticated) {
    return <Navigate to={role === "ADMIN" ? "/dashboard" : "/scanner"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    // Validasi sederhana sisi klien
    if (!username.trim()) {
      setErrorMsg("Username tidak boleh kosong");
      return;
    }
    if (!password) {
      setErrorMsg("Password tidak boleh kosong");
      return;
    }

    try {
      setLoading(true);
      const user = await login(username, password);

      // Routing sesuai role hasil seeder Fase 1
      if (user.role === "ADMIN") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/scanner", { replace: true });
      }
    } catch (err) {
      // Ambil pesan error dari backend Express (misal: "Username tidak ditemukan" / "Password salah")
      const message =
        err.response?.data?.message ||
        err.message ||
        "Terjadi kesalahan saat mencoba login";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  // Helper untuk tombol preset pengujian cepat (Sangat berguna untuk demonstrasi sidang skripsi)
  const setQuickCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pasar-50 via-white to-pasar-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header Identitas Institusi */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-pasar-600 text-white shadow-lg shadow-pasar-600/30">
            <Store className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            e-Retribusi Pasar Cicalengka
          </h1>
          <p className="text-sm text-gray-600 flex items-center justify-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-pasar-600" />
            Sistem Monitoring Penagihan Retribusi Anti-Pungli
          </p>
        </div>

        {/* Card Formulir Login */}
        <Card className="shadow-xl shadow-gray-200/50">
          <CardHeader>
            <CardTitle>Masuk ke Akun Anda</CardTitle>
            <CardDescription>
              Silakan masukkan kredensial akun Petugas atau Admin UPTD
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <Alert
                  variant="error"
                  message={errorMsg}
                  onClose={() => setErrorMsg("")}
                />
              )}

              <Input
                label="Username"
                id="username"
                name="username"
                placeholder="Masukkan username Anda"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={User}
                autoComplete="username"
                autoFocus
              />

              <Input
                label="Password"
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan password Anda"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="primary"
                className="w-full mt-2"
                size="md"
                isLoading={loading}
              >
                Masuk ke Sistem
              </Button>
            </form>
          </CardContent>

          {/* Quick-fill Akun Pengujian (Fase 1 Seeder) */}
          <CardFooter className="flex-col items-start gap-2.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 uppercase tracking-wider">
              <Zap className="h-3.5 w-3.5 text-amber-500" />
              <span>Akun Pengujian Demo (Seeder):</span>
            </div>
            <div className="grid grid-cols-2 gap-2 w-full">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onClick={() => setQuickCredentials("petugas", "petugas123")}
              >
                Petugas Lapangan
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="text-xs justify-start"
                onClick={() =>
                  setQuickCredentials("admin_cicalengka", "admincicalengka")
                }
              >
                Admin UPTD
              </Button>
            </div>
          </CardFooter>
        </Card>

        {/* Footer Skripsi */}
        <p className="text-center text-xs text-gray-500">
          Proposal Skripsi: Riset Awal MVP Penagihan e-Retribusi (Fase 2)
        </p>
      </div>
    </div>
  );
}
