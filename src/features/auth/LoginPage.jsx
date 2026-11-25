import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import {
  User,
  Lock,
  Building2,
  ShieldCheck,
  MapPin,
  Activity,
  ArrowRight,
  Zap,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Alert from "../../components/ui/Alert";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, isAuthenticated, role } = useAuth();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Jika sudah login, alihkan langsung sesuai role
  if (isAuthenticated) {
    return <Navigate to={role === "ADMIN" ? "/dashboard" : "/scanner"} replace />;
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!username.trim()) {
      setErrorMsg("Username ID wajib diisi");
      return;
    }
    if (!password) {
      setErrorMsg("Password wajib diisi");
      return;
    }

    try {
      setLoading(true);
      const user = await login(username, password);

      if (user.role === "ADMIN") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/scanner", { replace: true });
      }
    } catch (err) {
      const message =
        err.response?.data?.message ||
        err.message ||
        "Gagal melakukan otentikasi ke server";
      setErrorMsg(message);
    } finally {
      setLoading(false);
    }
  };

  const setQuickCredentials = (u, p) => {
    setUsername(u);
    setPassword(p);
    setErrorMsg("");
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-sans text-slate-900">
      {/* ========================================================= */}
      {/* Panel Kiri: Identitas Resmi & Pilar Keamanan (Desktop 55%) */}
      {/* ========================================================= */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] bg-emerald-950 text-emerald-50 flex-col justify-between p-12 xl:p-16 border-r border-emerald-900 relative overflow-hidden">
        {/* Subtle geometric line overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#064e3b15_1px,transparent_1px),linear-gradient(to_bottom,#064e3b15_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Header Instansi */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="h-11 w-11 rounded-lg bg-emerald-900 text-emerald-300 border border-emerald-800 flex items-center justify-center">
              <Building2 className="h-6 w-6 stroke-[1.75]" />
            </div>
            <div>
              <p className="text-xs font-mono font-semibold tracking-wider text-emerald-400 uppercase">
                UPTD Pasar Cicalengka
              </p>
              <p className="text-sm text-emerald-200/80 font-medium">
                Dinas Perindustrian dan Perdagangan
              </p>
            </div>
          </div>

          <div className="max-w-lg mt-8">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-mono bg-emerald-900/80 text-emerald-200 border border-emerald-800 mb-4">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Sistem Anti-Pungli & Keamanan Terintegrasi
            </div>
            <h1 className="text-3xl xl:text-4xl font-bold text-white tracking-tight leading-tight">
              Sistem Monitoring Retribusi Pasar Cicalengka
            </h1>
            <p className="text-sm text-emerald-200/90 mt-3 leading-relaxed">
              Platform tata kelola penerimaan retribusi harian berbasis validasi spasial satelit
              dan token kriptografis HMAC-SHA256 untuk transparansi operasional pasar rakyat.
            </p>
          </div>
        </div>

        {/* 3 Pilar Arsitektur Keamanan */}
        <div className="relative z-10 my-10 space-y-4 max-w-lg">
          <div className="p-4 rounded-lg bg-emerald-900/40 border border-emerald-800/80 flex items-start gap-3.5">
            <div className="h-8 w-8 rounded-md bg-emerald-800/80 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-700/60 mt-0.5">
              <ShieldCheck className="h-4 w-4 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white tracking-wide">
                Kriptografi QR HMAC-SHA256
              </h2>
              <p className="text-xs text-emerald-300/80 mt-0.5 leading-relaxed">
                Setiap stiker lapak ditandatangani secara matematis untuk mencegah pemalsuan,
                duplikasi, dan tiket fiktif.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-emerald-900/40 border border-emerald-800/80 flex items-start gap-3.5">
            <div className="h-8 w-8 rounded-md bg-emerald-800/80 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-700/60 mt-0.5">
              <MapPin className="h-4 w-4 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white tracking-wide">
                Geofencing Ray-Casting & Audit Satelit
              </h2>
              <p className="text-xs text-emerald-300/80 mt-0.5 leading-relaxed">
                Verifikasi perimeter poligon fisik pasar secara otomatis guna menjamin transaksi
                hanya disahkan di lokasi lapak pedagang.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-emerald-900/40 border border-emerald-800/80 flex items-start gap-3.5">
            <div className="h-8 w-8 rounded-md bg-emerald-800/80 text-emerald-300 flex items-center justify-center shrink-0 border border-emerald-700/60 mt-0.5">
              <Activity className="h-4 w-4 stroke-[1.75]" />
            </div>
            <div>
              <h2 className="text-xs font-semibold text-white tracking-wide">
                Audit Real-Time WebSockets
              </h2>
              <p className="text-xs text-emerald-300/80 mt-0.5 leading-relaxed">
                Pembaruan buku kas seketika (&lt; 20ms) dan pendeteksian anomali transaksi
                secara otomatis ke konsol pimpinan UPTD.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Panel Kiri */}
        <div className="relative z-10 pt-6 border-t border-emerald-900 text-xs font-mono text-emerald-400/80 flex items-center justify-between">
          <span>Versi Sistem 2.1 (GovTech Edition)</span>
          <span>Hak Cipta UPTD Pasar Cicalengka</span>
        </div>
      </div>

      {/* ========================================================= */}
      {/* Panel Kanan: Form Otentikasi Pengguna                     */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 bg-white lg:bg-slate-50 min-h-screen lg:min-h-0">
        {/* Mobile Header Branding */}
        <div className="lg:hidden mb-6 flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-emerald-950 text-emerald-300 flex items-center justify-center border border-emerald-800">
            <Building2 className="h-5 w-5 stroke-[1.75]" />
          </div>
          <div>
            <h1 className="text-xs font-mono font-bold uppercase text-emerald-800">
              UPTD PASAR CICALENGKA
            </h1>
            <p className="text-sm font-semibold text-slate-900">
              Sistem Monitoring Retribusi
            </p>
          </div>
        </div>

        {/* Centered Form Wrapper */}
        <div className="flex-1 flex items-center justify-center py-4 sm:py-8">
          <div className="w-full max-w-sm bg-white rounded-lg border border-slate-200 lg:shadow-xs p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Masuk ke Sistem
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Gunakan kredensial resmi Administrator UPTD atau Petugas Lapangan.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {errorMsg && (
                <Alert
                  variant="error"
                  message={errorMsg}
                  onClose={() => setErrorMsg("")}
                />
              )}

              <Input
                label="Username / ID Petugas"
                id="username"
                name="username"
                placeholder="Masukkan username ID"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                icon={User}
                autoComplete="username"
                autoFocus
                required
              />

              <Input
                label="Kata Sandi"
                id="password"
                name="password"
                type="password"
                placeholder="Masukkan kata sandi"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                icon={Lock}
                autoComplete="current-password"
                required
              />

              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold text-sm h-11"
                isLoading={loading}
              >
                Masuk ke Aplikasi
              </Button>
            </form>

            {/* Quick Demo Credentials */}
            <div className="border-t border-slate-200 pt-5 mt-6">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-2.5">
                <Zap className="h-3.5 w-3.5 text-emerald-600 stroke-[1.75]" />
                <span className="font-medium">Akses Cepat Pengujian:</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setQuickCredentials("admin_cicalengka", "admincicalengka")}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-left hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors cursor-pointer group"
                >
                  <span className="text-xs font-semibold text-slate-800 block group-hover:text-emerald-800">
                    Admin UPTD
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    admin_cicalengka
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setQuickCredentials("petugas", "petugas123")}
                  className="p-2.5 bg-slate-50 border border-slate-200 rounded-md text-left hover:bg-emerald-50/50 hover:border-emerald-300 transition-colors cursor-pointer group"
                >
                  <span className="text-xs font-semibold text-slate-800 block group-hover:text-emerald-800">
                    Petugas Lapangan
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    petugas
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-slate-400 py-3">
          Sistem Monitoring e-Retribusi &bull; UPTD Pasar Cicalengka
        </div>
      </div>
    </div>
  );
}
