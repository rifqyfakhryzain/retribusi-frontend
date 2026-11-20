import { createContext, useContext, useState, useEffect } from "react";
import authService from "../services/authService";

const AuthContext = createContext(null);

/**
 * Helper untuk memeriksa apakah token JWT sudah kedaluwarsa secara mandiri di sisi klien
 */
function isTokenExpired(token) {
  try {
    const payloadBase64 = token.split(".")[1];
    if (!payloadBase64) return true;
    // Base64URL decode
    const base64 = payloadBase64.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const decoded = JSON.parse(jsonPayload);
    if (!decoded.exp) return false;
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Periksa apakah token & data user sudah tersimpan saat aplikasi pertama dibuka
  useEffect(() => {
    try {
      const storedToken = authService.getToken();
      const storedUser = authService.getUser();

      if (storedToken && storedUser) {
        if (isTokenExpired(storedToken)) {
          console.warn("Sesi lokal telah kedaluwarsa. Menghapus sesi...");
          authService.clearSession();
          setToken(null);
          setUser(null);
        } else {
          setToken(storedToken);
          setUser(storedUser);
        }
      }
    } catch (error) {
      console.error("Gagal membaca sesi lokal:", error);
      authService.clearSession();
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fungsi Login
   */
  const login = async (username, password) => {
    const res = await authService.login(username, password);
    const { token: receivedToken, user: receivedUser } = res.data;

    // Simpan ke state React
    setToken(receivedToken);
    setUser(receivedUser);

    // Simpan ke penyimpanan lokal browser (localStorage)
    authService.saveSession(receivedToken, receivedUser);

    return receivedUser;
  };

  /**
   * Fungsi Logout
   */
  const logout = () => {
    setToken(null);
    setUser(null);
    authService.clearSession();
  };

  const value = {
    user,
    token,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isLoading,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Custom Hook untuk memudahkan penggunaan AuthContext di komponen manapun
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth harus digunakan di dalam AuthProvider");
  }
  return context;
}
