import { useEffect, useState } from 'react';
import userSessionStore from './store';
import Books from './components/Books';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import Authorize from './pages/Authorize';
import AuthSignedIn from './pages/AuthSignedIn';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { getMe } from './lib/api';

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

function App() {
  const { isLoggedIn, setIsLoggedIn } = userSessionStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    getMe().then((me) => {
      setIsLoggedIn(!!me);
      setChecking(false);
    });
  }, [setIsLoggedIn]);

  if (checking) return null;

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={isLoggedIn ? <Books /> : <Authorize />} />
          <Route path="/books" element={<Books />} />
          <Route path="/authorize" element={<Authorize />} />
          <Route path="/auth-signed-in" element={<AuthSignedIn />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
