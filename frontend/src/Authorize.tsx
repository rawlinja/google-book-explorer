import './Authorize.css';

function Authorize() {
  function handleClick() {
    window.location.assign(import.meta.env.VITE_LOGIN_URL);
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
