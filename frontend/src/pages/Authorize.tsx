import { login } from '../lib/api';
import '../styles/Authorize.css';

function Authorize() {
  function handleClick() {
    login();
  }

  return (
    <div className="authorize">
      <h1>Authorize</h1>
      <p>Please authorize the application to access your Google Books data.</p>
      <button onClick={handleClick}>Authorize with Google</button>
    </div>
  );
}

export default Authorize;
