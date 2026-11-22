import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { User, Lock, Building2, ShieldCheck, Zap } from "lucide-react";
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

  // Jika sudah terotentikasi, alihkan langsung sesuai role
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
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/60 via-slate-50 to-emerald-50/40 flex flex-col justify-between p-4 font-sans text-slate-900">
      <div className="flex-1 flex items-center justify-center py-8">
        <div className="w-full max-w-sm space-y-4">
          {/* Header Identitas Institusi Resmi (Nuansa Hijau UPTD) */}
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-lg bg-emerald-800 text-white font-mono font-bold text-base border border-emerald-600 shadow-sm mb-1">
              <Building2 className="h-6 w-6 text-emerald-100" />
            </div>
            <div>
              <p className="text-[10px] font-mono tracking-wider font-bold text-emerald-800 uppercase">
                PT Niaga Perkasa
              </p>
              <h1 className="text-base font-bold uppercase tracking-tight text-slate-900">
                PASAR CICALENGKA
              </h1>
            </div>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-lg border-t-4 border-t-emerald-700 border-x border-b border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3.5 bg-emerald-50/70 border-b border-emerald-100">
              <h2 className="text-xs font-bold uppercase tracking-wider text-emerald-950">
                Otentikasi Pengguna
              </h2>
              <p className="text-[11px] text-slate-600 mt-0.5">
                Masukkan kredensial akun Petugas atau Administrator UPTD
              </p>
            </div>

            <div className="p-5">
              <form onSubmit={handleSubmit} className="space-y-3.5">
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
                  placeholder="ID Username Anda"
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
                  placeholder="Kata sandi"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  icon={Lock}
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  variant="gov"
                  className="w-full mt-2 font-bold tracking-tight text-xs py-2.5"
                  isLoading={loading}
                >
                  MASUK KE SISTEM
                </Button>
              </form>
            </div>

            {/* Quick Demo Credentials */}
            <div className="px-5 py-3 bg-emerald-50/40 border-t border-emerald-100 text-xs">
              <div className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-800 uppercase tracking-wider mb-2">
                <Zap className="h-3 w-3 text-emerald-600" />
                <span>Kredensial Pengujian Cepat:</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5 font-mono text-[11px]">
                <button
                  type="button"
                  onClick={() => setQuickCredentials("admin_cicalengka", "admincicalengka")}
                  className="p-2 bg-white border border-emerald-200 rounded text-emerald-950 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-left cursor-pointer shadow-2xs"
                >
                  <span className="font-bold block text-emerald-800">ADMIN</span>
                  <span className="text-[10px] text-slate-500">admin_cicalengka</span>
                </button>
                <button
                  type="button"
                  onClick={() => setQuickCredentials("petugas", "petugas123")}
                  className="p-2 bg-white border border-emerald-200 rounded text-emerald-950 hover:bg-emerald-50 hover:border-emerald-300 transition-colors text-left cursor-pointer shadow-2xs"
                >
                  <span className="font-bold block text-emerald-800">PETUGAS</span>
                  <span className="text-[10px] text-slate-500">petugas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="text-center text-[11px] font-mono text-slate-500 py-2">
        E-Retribusi PT Bangun Niaga Perkasa
      </footer>
    </div>
  );
}
