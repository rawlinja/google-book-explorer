import { describe, it, expect, vi, beforeEach } from 'vitest';

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
  vi.stubGlobal('window', {
    location: { href: '' },
  });
});

describe('getMe', () => {
  it('returns parsed response on success', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ isLoggedIn: true, expiresAt: 9999999 }), { status: 200 })
    );
    const { getMe } = await import('../api');
    const result = await getMe();
    expect(result).toEqual({ isLoggedIn: true, expiresAt: 9999999 });
  });

  it('returns null when the response is not ok', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { getMe } = await import('../api');
    const result = await getMe();
    expect(result).toBeNull();
  });
});

describe('logout', () => {
  it('calls the logout endpoint and redirects to /', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { logout } = await import('../api');
    await logout();
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/logout'),
      expect.objectContaining({ method: 'POST' })
    );
    expect(window.location.href).toBe('/');
  });
});

describe('fetchShelves', () => {
  it('returns shelves on success', async () => {
    const shelves = [{ id: 2, title: 'Favorites', volumeCount: 3 }];
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ shelves }), { status: 200 })
    );
    const { fetchShelves } = await import('../api');
    const result = await fetchShelves();
    expect(result).toEqual(shelves);
  });

  it('redirects to /authorize and throws on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { fetchShelves } = await import('../api');
    await expect(fetchShelves()).rejects.toThrow('Unauthorized');
    expect(window.location.href).toBe('/authorize');
  });

  it('throws on non-401 error', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }));
    const { fetchShelves } = await import('../api');
    await expect(fetchShelves()).rejects.toThrow('Failed to fetch shelves: 500');
  });
});

describe('addToShelf', () => {
  it('calls the add endpoint with the correct URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { addToShelf } = await import('../api');
    await addToShelf(2, 'vol123');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bookshelves/2/add?volumeId=vol123'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('redirects to /authorize and throws on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { addToShelf } = await import('../api');
    await expect(addToShelf(2, 'vol123')).rejects.toThrow('Unauthorized');
    expect(window.location.href).toBe('/authorize');
  });
});

describe('removeFromShelf', () => {
  it('calls the remove endpoint with the correct URL', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 200 }));
    const { removeFromShelf } = await import('../api');
    await removeFromShelf(2, 'vol123');
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/bookshelves/2/remove?volumeId=vol123'),
      expect.objectContaining({ method: 'POST' })
    );
  });

  it('redirects to /authorize and throws on 401', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { removeFromShelf } = await import('../api');
    await expect(removeFromShelf(2, 'vol123')).rejects.toThrow('Unauthorized');
    expect(window.location.href).toBe('/authorize');
  });
});
