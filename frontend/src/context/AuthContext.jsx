import { createContext, useContext, useMemo, useState } from "react";
import { loginApi } from "../api/service";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        try {
            const raw = localStorage.getItem("user");
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    });

    const login = async ({ username, password }) => {
        localStorage.removeItem("token");
        const res = await loginApi({ username, password });
        const data = res.data;
        const next = {
            username: data.username,
            fullName: data.fullName,
            role: data.role,
            permissions: data.permissions || [],
        };
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(next));
        setUser(next);
        return next;
    };

    const logout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setUser(null);
    };

<<<<<<< Updated upstream
  const updateUser = (updates) => {
    const next = { ...user, ...updates };
    localStorage.setItem('user', JSON.stringify(next));
    setUser(next);
    return next;
  };

  const value = useMemo(() => ({ user, login, logout, updateUser }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
=======
    const value = useMemo(() => ({ user, login, logout }), [user]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
>>>>>>> Stashed changes
}

export const useAuth = () => useContext(AuthContext);
