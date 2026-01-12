export function login() {
  window.location.href = import.meta.env.VITE_LOGIN_URL;
}

export async function getMe() {
  const res = await fetch(import.meta.env.VITE_ME_URL, { credentials: 'include' });
  if (res.status === 401) return null;
  const data = await res.json();
  return data;
}

export async function logout() {
  await fetch(import.meta.env.VITE_LOGOUT_URL, {
    method: 'POST',
    credentials: 'include',
  });
  window.location.href = '/';
}
