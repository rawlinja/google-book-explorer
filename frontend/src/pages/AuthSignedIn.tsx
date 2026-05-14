import { useEffect } from 'react';
import { getMe } from '../lib/api';
import { useNavigate } from 'react-router-dom';

import userSessionStore from '../store';

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
        navigate('/authorize');
      }
    }
    check();
  }, [navigate, setIsLoggedIn]);

  return <p>Finishing sign-in…</p>;
}
