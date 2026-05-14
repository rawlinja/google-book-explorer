export function login() {
  window.location.href = `${process.env.API_URL}/auth/google`;
}

export async function getMe() {
  const res = await fetch(`${process.env.API_URL}/api/me`, { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export async function logout() {
  await fetch(`${process.env.API_URL}/auth/logout`, {
    method: 'POST',
    credentials: 'include',
  });
  window.location.href = '/';
}
