export type MeResponse = {
  isLoggedIn: boolean;
  expiresAt: number;
};

export type Shelf = {
  id: number;
  title: string;
  volumeCount: number;
};

export function login() {
  window.location.href = `${process.env.API_URL}/auth/google`;
}

export async function getMe(signal?: AbortSignal): Promise<MeResponse | null> {
  const res = await fetch(`${process.env.API_URL}/api/me`, { credentials: 'include', signal });
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

export async function fetchShelves(): Promise<Shelf[]> {
  const res = await fetch(`${process.env.API_URL}/api/bookshelves`, { credentials: 'include' });
  if (res.status === 401) {
    window.location.href = '/authorize';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`Failed to fetch shelves: ${res.status}`);
  const data = (await res.json()) as { shelves: Shelf[] };
  return data.shelves;
}

export async function addToShelf(shelfId: number, volumeId: string): Promise<void> {
  const url = `${process.env.API_URL}/api/bookshelves/${shelfId}/add?volumeId=${encodeURIComponent(volumeId)}`;
  const res = await fetch(url, { method: 'POST', credentials: 'include' });
  if (res.status === 401) {
    window.location.href = '/authorize';
    throw new Error('Unauthorized');
  }
  if (!res.ok) throw new Error(`Failed to add to shelf: ${res.status}`);
}
