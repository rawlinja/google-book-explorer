import { useEffect } from 'react';
import { getMe } from '../lib/api';
import { useNavigate } from 'react-router-dom';
import userSessionStore from '../store';

export default function AuthSignedIn() {
  const navigate = useNavigate();
  const { setIsLoggedIn, setExpiresAt } = userSessionStore();

  useEffect(() => {
    getMe()
      .then((me) => {
        if (me) {
          setIsLoggedIn(true);
          setExpiresAt(me.expiresAt);
          navigate('/books');
        } else {
          setIsLoggedIn(false);
          navigate('/authorize');
        }
      })
      .catch(() => {
        setIsLoggedIn(false);
        navigate('/authorize');
      });
  }, [navigate, setIsLoggedIn, setExpiresAt]);

  return <p>Finishing sign-in…</p>;
}
