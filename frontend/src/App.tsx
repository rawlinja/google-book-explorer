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

export type BookItem = {
  id: string;
  volumeInfo: {
    title: string;
    authors?: string[];
    imageLinks?: {
      thumbnail: string;
      smallThumbnail: string;
    };
  };
};

export type BookVolume = {
  totalItems: number;
  items: BookItem[];
  kind: string;
};

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = userSessionStore();
  return isLoggedIn ? <>{children}</> : <Navigate to="/authorize" replace />;
}

function App() {
  const { isLoggedIn, expiresAt, checking, setIsLoggedIn, setExpiresAt, setChecking } =
    userSessionStore();

  useEffect(() => {
    getMe()
      .then((me) => {
        setIsLoggedIn(!!me);
        setExpiresAt(me?.expiresAt ?? null);
      })
      .catch(() => {
        setIsLoggedIn(false);
        setExpiresAt(null);
      })
      .finally(() => {
        setChecking(false);
      });
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
          <Route path="/authorize" element={<Authorize />} />
          <Route path="/auth-signed-in" element={<AuthSignedIn />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
