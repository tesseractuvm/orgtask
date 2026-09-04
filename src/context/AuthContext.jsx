import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authService as auth } from '../services';

const AuthContext = createContext(null);

// Marca de "estoy probando como otra persona". Vive en sessionStorage y no en
// localStorage a propósito: se borra al cerrar la pestaña, así nadie se queda
// suplantando a alguien sin darse cuenta días después.
const CLAVE_PRUEBA = 'orgtask.probandoComo';

function leerPrueba() {
  try {
    const guardado = window.sessionStorage.getItem(CLAVE_PRUEBA);
    return guardado ? JSON.parse(guardado) : null;
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [probandoComo, setProbandoComo] = useState(leerPrueba);

  // Al abrir la aplicación se recupera la sesión guardada, si existe
  useEffect(() => {
    auth
      .getSession()
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, []);

  const olvidarPrueba = useCallback(() => {
    try {
      window.sessionStorage.removeItem(CLAVE_PRUEBA);
    } catch {
      // Sin sessionStorage no hay marca que borrar
    }
    setProbandoComo(null);
  }, []);

  const signIn = useCallback(
    async (email, password) => {
      const perfil = await auth.signInWithPassword({ email, password });
      olvidarPrueba();
      setProfile(perfil);
      return perfil;
    },
    [olvidarPrueba]
  );

  const signOut = useCallback(async () => {
    await auth.signOut();
    olvidarPrueba();
    setProfile(null);
  }, [olvidarPrueba]);

  const renameProfile = useCallback(
    async (fullName) => {
      const actualizado = await auth.updateProfileName(profile.id, fullName);
      setProfile(actualizado);
      return actualizado;
    },
    [profile]
  );

  const changePassword = useCallback(async (newPassword) => {
    await auth.updatePassword(newPassword);
  }, []);

  /**
   * Entra como otra persona. La sesión que queda abierta es de esa persona, así
   * que los permisos se comprueban con su identidad y la prueba es real.
   */
  const impersonate = useCallback(
    async (destino) => {
      const quienEra = profile;
      const perfil = await auth.startImpersonation({ profileId: destino.id, actor: profile });

      const marca = {
        adminName: quienEra.fullName,
        adminEmail: quienEra.email,
        targetName: perfil.fullName,
      };
      try {
        window.sessionStorage.setItem(CLAVE_PRUEBA, JSON.stringify(marca));
      } catch {
        // Si no se puede guardar la marca, la prueba funciona igual: solo se
        // pierde el aviso de que estás actuando como otra persona.
      }
      setProbandoComo(marca);
      setProfile(perfil);
      return perfil;
    },
    [profile]
  );

  const value = useMemo(
    () => ({
      profile,
      loading,
      signIn,
      signOut,
      renameProfile,
      changePassword,
      impersonate,
      probandoComo,
    }),
    [profile, loading, signIn, signOut, renameProfile, changePassword, impersonate, probandoComo]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return context;
}
