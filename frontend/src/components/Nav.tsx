import { logout } from '../lib/api';
import userSessionStore from '../store';
import '../styles/Nav.css';

export default function Nav() {
  const { isLoggedIn } = userSessionStore();
  if (!isLoggedIn) return null;
  return (
    <nav className="nav">
      <span className="nav-brand">Google Book Explorer</span>
      <button className="nav-signout" onClick={logout}>Sign out</button>
    </nav>
  );
}
