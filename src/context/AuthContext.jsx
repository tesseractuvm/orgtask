import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as auth from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Al abrir la aplicación se recupera la sesión guardada, si existe
  useEffect(() => {
    auth
      .getSession()
      .then(setProfile)
      .finally(() => setLoading(false));
  }, []);

  const signIn = useCallback(async (email, password) => {
    const perfil = await auth.signInWithPassword({ email, password });
    setProfile(perfil);
    return perfil;
  }, []);

  const signOut = useCallback(async () => {
    await auth.signOut();
    setProfile(null);
  }, []);

  const renameProfile = useCallback(
    async (fullName) => {
      const actualizado = await auth.updateProfileName(profile.id, fullName);
      setProfile(actualizado);
      return actualizado;
    },
    [profile]
  );

  const value = useMemo(
    () => ({ profile, loading, signIn, signOut, renameProfile }),
    [profile, loading, signIn, signOut, renameProfile]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
