import { useEffect } from 'react';
import userSessionStore from './store';
import Books from './components/Books';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import Authorize from './pages/Authorize';
import AuthSignedIn from './pages/AuthSignedIn';
import Nav from './components/Nav';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getMe, logout } from './lib/api';

import './styles/App.css';

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = userSessionStore();
  return isLoggedIn ? <>{children}</> : <Navigate to="/authorize" replace />;
}

function App() {
  const { isLoggedIn, expiresAt, checking, setIsLoggedIn, setExpiresAt, setChecking } =
    userSessionStore();

  useEffect(() => {
    // AuthSignedIn handles its own getMe() call after the OAuth callback
    if (window.location.pathname === '/auth-signed-in') {
      setChecking(false);
      return;
    }
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    getMe(controller.signal)
      .then((me) => {
        setIsLoggedIn(!!me);
        setExpiresAt(me?.expiresAt ?? null);
      })
      .catch((err) => {
        if (err?.name === 'AbortError') return;
        setIsLoggedIn(false);
        setExpiresAt(null);
      })
      .finally(() => {
        clearTimeout(timeout);
        if (!controller.signal.aborted) setChecking(false);
      });
    return () => {
      controller.abort();
      clearTimeout(timeout);
    };
  }, [setIsLoggedIn, setExpiresAt, setChecking]);

  useEffect(() => {
    if (!isLoggedIn || !expiresAt) return;
    const ms = expiresAt - Date.now();
    if (ms <= 0) { logout(); return; }
    const timer = setTimeout(logout, ms);
    return () => clearTimeout(timer);
  }, [isLoggedIn, expiresAt]);

  if (checking) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Nav />
        <Routes>
          <Route
            path="/"
            element={isLoggedIn ? <Navigate to="/books" replace /> : <Navigate to="/authorize" replace />}
          />
          <Route path="/books" element={<ProtectedRoute><Books /></ProtectedRoute>} />
          <Route path="/authorize" element={isLoggedIn ? <Navigate to="/books" replace /> : <Authorize />} />
          <Route path="/auth-signed-in" element={<AuthSignedIn />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
