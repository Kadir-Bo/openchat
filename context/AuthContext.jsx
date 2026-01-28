import { createContext, useContext } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export default function AuthProvider({ children }) {
  const values = {};
  return <AuthContext.Provider value={values}>{children}</AuthContext.Provider>;
}
