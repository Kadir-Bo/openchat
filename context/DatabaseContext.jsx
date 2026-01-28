import { createContext, useContext } from "react";

export const DatabaseContext = createContext(null);
export const useDatabase = () => useContext(DatabaseContext);
export default function DatabaseProvider({ children }) {
  const values = {};
  return (
    <DatabaseContext.Provider value={values}>
      {children}
    </DatabaseContext.Provider>
  );
}
