import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Home from './pages/Home';
import AreaBoard from './pages/AreaBoard';
import History from './pages/History';
import Indicators from './pages/Indicators';
import Profile from './pages/Profile';
import Users from './pages/Users';
import AccessDenied from './pages/AccessDenied';
import DesignSystem from './pages/DesignSystem';

/** Sin sesión no se entra a ninguna vista de la aplicación. */
function Protegido({ children }) {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-paper">
        <p className="text-base text-slate">Cargando OrgTask…</p>
      </div>
    );
  }
  if (!profile) return <Navigate to="/ingresar" replace />;
  return children;
}

/** Con sesión abierta, la pantalla de ingreso no tiene sentido. */
function SoloSinSesion({ children }) {
  const { profile, loading } = useAuth();
  if (loading) return null;
  if (profile) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route
            path="/ingresar"
            element={
              <SoloSinSesion>
                <Login />
              </SoloSinSesion>
            }
          />

          <Route
            element={
              <Protegido>
                <AppLayout />
              </Protegido>
            }
          >
            <Route path="/" element={<Home />} />
            <Route path="/area/:slug" element={<AreaBoard />} />
            <Route path="/historico" element={<History />} />
            <Route path="/indicadores" element={<Indicators />} />
            <Route path="/perfil" element={<Profile />} />
            <Route path="/usuarios" element={<Users />} />
            <Route
              path="*"
              element={<AccessDenied motivo="Esta dirección no corresponde a ninguna vista." />}
            />
          </Route>

          {/* Referencia del sistema de diseño, fuera de la aplicación */}
          <Route path="/sistema-de-diseno" element={<DesignSystem />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
