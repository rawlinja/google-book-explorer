import { login } from '../lib/api';
import '../styles/Authorize.css';

function Authorize() {
  return (
    <div className="authorize">
      <h1>Authorize</h1>
      <p>Please authorize the application to access your Google Books data.</p>
      <button onClick={login}>Authorize with Google</button>
    </div>
  );
}

export default Authorize;
