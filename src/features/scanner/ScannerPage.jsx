import { useAuth } from "../../context/AuthContext";
import Button from "../../components/ui/Button";
import { Card, CardHeader, CardTitle, CardContent } from "../../components/ui/Card";
import { QrCode, MapPin, LogOut, ShieldCheck, User, Radio } from "lucide-react";

export default function ScannerPage() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Top Navbar Petugas */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pasar-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            PC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base font-bold text-gray-900 leading-tight">
                UPTD Pasar Cicalengka
              </h1>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
                PETUGAS
              </span>
            </div>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <User className="h-3 w-3" />
              {user?.nama || "Petugas Lapangan"}
            </p>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={LogOut}
          onClick={logout}
          className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
        >
          Keluar
        </Button>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 space-y-4">
        {/* Status Sensor & Kehadiran Card */}
        <Card className="border-pasar-100 bg-gradient-to-br from-pasar-50/70 to-white">
          <CardContent className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-3 w-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xs text-gray-500 uppercase font-semibold tracking-wider">
                  Status Sesi
                </p>
                <p className="text-sm font-bold text-gray-800">
                  Aktif & Siap Menagih
                </p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs text-gray-500 font-mono">
                ID #{user?.id}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Placeholder Kamera Pemindai QR (Persiapan Fase 4) */}
        <Card className="border-2 border-dashed border-pasar-300">
          <CardHeader className="text-center pb-2 border-b-0">
            <div className="mx-auto h-16 w-16 rounded-2xl bg-pasar-100 text-pasar-700 flex items-center justify-center mb-2">
              <QrCode className="h-9 w-9" />
            </div>
            <CardTitle>Pemindai QR Code Lapak Pedagang</CardTitle>
            <p className="text-xs text-gray-500 mt-1">
              Arahkan kamera ke stiker QR terenkripsi yang tertempel di kios pasar
            </p>
          </CardHeader>

          <CardContent className="space-y-4 pt-2">
            {/* Visual Box Frame Kamera */}
            <div className="aspect-square w-full max-w-[280px] mx-auto rounded-2xl bg-gray-900/90 relative overflow-hidden flex flex-col items-center justify-center text-white p-6 shadow-inner">
              <div className="absolute inset-4 border-2 border-pasar-400 rounded-xl opacity-75 animate-pulse pointer-events-none" />
              <Radio className="h-10 w-10 text-pasar-400 mb-2 animate-bounce" />
              <p className="text-sm font-semibold text-center">
                Modul Kamera Scanner
              </p>
              <p className="text-xs text-gray-400 text-center mt-1">
                Akan diaktifkan pada Fase 4 menggunakan pustaka{" "}
                <code className="text-pasar-300">html5-qrcode</code>
              </p>
            </div>

            {/* Geofencing Status */}
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-800">
              <MapPin className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              <div>
                <span className="font-semibold">Sensor GPS (Geofencing):</span>
                <p className="mt-0.5 text-amber-700">
                  Koordinat lintang, bujur, dan radius akurasi akan otomatis
                  ditarik bersamaan saat QR dipindai (Fase 4 & 5).
                </p>
              </div>
            </div>

            <Button
              variant="primary"
              className="w-full"
              size="lg"
              disabled
            >
              Buka Kamera Scanner (Fase 4)
            </Button>
          </CardContent>
        </Card>

        {/* Footer Info Skripsi */}
        <div className="text-center text-xs text-gray-400 flex items-center justify-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-pasar-600" />
          <span>Fase 2 Selesai: Autentikasi Klien & Navigasi Petugas Berhasil</span>
        </div>
      </main>
    </div>
  );
}
