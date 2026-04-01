import { createContext, useContext, useState, useEffect } from "react";
import { auth, db } from "../firebase/config";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

const ACtx = createContext();

export const useAuth = () => useContext(ACtx);

export const AuthProvider = ({ children }) => {
  const [u, setU] = useState(null);
  const [pr, setPr] = useState(null);
  const [l, setL] = useState(true);

  useEffect(() => {
    const un = onAuthStateChanged(auth, async (usr) => {
      if (usr) {
        setU(usr);
        try {
          const d = await getDoc(doc(db, "users", usr.uid));
          if (d.exists()) {
            setPr(d.data());
          }
        } catch (err) {}
      } else {
        setU(null);
        setPr(null);
      }
      setL(false);
    });
    return un;
  }, []);

  const lo = () => signOut(auth);

  return (
    <ACtx.Provider value={{ user: u, profile: pr, loading: l, logout: lo }}>
      {children}
    </ACtx.Provider>
  );
};