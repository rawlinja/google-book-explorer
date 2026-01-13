import { useEffect } from 'react';
import { getMe } from './api';
import { useNavigate } from 'react-router-dom';

import userSessionStore from './Store';

export default function AuthSignedIn() {
  const navigate = useNavigate();
  const { setIsLoggedIn } = userSessionStore();

  useEffect(() => {
    async function check() {
      const me = await getMe();
      if (me) {
        setIsLoggedIn(true);
        navigate('/books');
      } else {
        setIsLoggedIn(false);
        navigate('/login');
      }
    }
    check();
  }, [navigate, setIsLoggedIn]);

  return <p>Finishing sign-in…</p>;
}
