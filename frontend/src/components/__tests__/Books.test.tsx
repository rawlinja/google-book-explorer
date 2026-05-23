import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Books from '../Books';
import useBooksStore from '../../store/books';

vi.mock('../../lib/api', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../lib/api')>();
  return {
    ...actual,
    fetchShelves: vi.fn().mockResolvedValue([]),
    addToShelf: vi.fn().mockResolvedValue(undefined),
    removeFromShelf: vi.fn().mockResolvedValue(undefined),
  };
});

const MOCK_BOOKS = {
  totalItems: 2,
  items: [
    { id: 'vol1', title: 'Clean Code', authors: ['Robert C. Martin'], thumbnail: 'https://example.com/cover.jpg' },
    { id: 'vol2', title: 'Refactoring', authors: ['Martin Fowler'] },
  ],
};

export function renderBooks() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Books />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal('fetch', vi.fn());
  useBooksStore.setState({ books: [], totalBooks: 0, lastQuery: '' });
});

describe('Books', () => {
  it('renders the search input and button', () => {
    renderBooks();
    expect(screen.getByPlaceholderText('Search for a book...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Search' })).toBeInTheDocument();
  });

  it('shows loading state while fetching', async () => {
    vi.mocked(fetch).mockReturnValue(new Promise(() => {}));
    renderBooks();
    fireEvent.change(screen.getByPlaceholderText('Search for a book...'), { target: { value: 'react' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Loading books...')).toBeInTheDocument());
  });

  it('shows error state when the fetch fails', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 500 }));
    renderBooks();
    fireEvent.change(screen.getByPlaceholderText('Search for a book...'), { target: { value: 'react' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText(/Error fetching books/)).toBeInTheDocument());
  });

  it('redirects to /authorize on 401', async () => {
    const originalLocation = window.location;
    // @ts-expect-error -- jsdom does not allow reassigning window.location directly
    delete window.location;
    // @ts-expect-error -- partial mock for redirect testing
    window.location = { href: 'http://localhost/' };

    vi.mocked(fetch).mockResolvedValueOnce(new Response(null, { status: 401 }));
    renderBooks();
    fireEvent.change(screen.getByPlaceholderText('Search for a book...'), { target: { value: 'react' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(window.location.href).toBe('/authorize'));

    // @ts-expect-error -- restoring original after mock
    window.location = originalLocation;
  });

  it('shows no books message when results are empty', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ totalItems: 0, items: [] }), { status: 200 })
    );
    renderBooks();
    fireEvent.change(screen.getByPlaceholderText('Search for a book...'), { target: { value: 'xyznotfound' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('No books found')).toBeInTheDocument());
  });

  it('displays book results after a successful search', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BOOKS), { status: 200 })
    );
    renderBooks();
    fireEvent.change(screen.getByPlaceholderText('Search for a book...'), { target: { value: 'clean code' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
    expect(screen.getByText('Refactoring')).toBeInTheDocument();
  });

  it('triggers search on Enter key', async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BOOKS), { status: 200 })
    );
    renderBooks();
    const input = screen.getByPlaceholderText('Search for a book...');
    fireEvent.change(input, { target: { value: 'clean code' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
  });
});
