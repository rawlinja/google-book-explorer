import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Books from '../Books';
import * as api from '../../lib/api';
import useCollectionsStore from '../../store/collections';
import useBooksStore from '../../store/books';

vi.mock('../../lib/api', () => ({
  fetchShelves: vi.fn().mockResolvedValue([]),
  addToShelf: vi.fn().mockResolvedValue(undefined),
  removeFromShelf: vi.fn().mockResolvedValue(undefined),
}));

vi.stubGlobal('fetch', vi.fn());

const MOCK_SHELVES: api.Shelf[] = [
  { id: 2, title: 'Favorites', volumeCount: 0 },
  { id: 3, title: 'To Read', volumeCount: 0 },
];

const MOCK_BOOKS = {
  totalItems: 2,
  items: [
    { id: 'vol1', title: 'Clean Code', authors: ['Robert C. Martin'], thumbnail: 'https://example.com/cover.jpg' },
    { id: 'vol2', title: 'Refactoring', authors: ['Martin Fowler'] },
  ],
};

function renderBooks() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <Books />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  useCollectionsStore.setState({ bookCollections: {} });
  useBooksStore.setState({ books: [], totalBooks: 0, lastQuery: '' });
  vi.mocked(fetch).mockReset();
});

describe('Books — search UI', () => {
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

describe('BookCard — shelf management', () => {
  async function renderWithBooks() {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(MOCK_BOOKS), { status: 200 })
    );
    vi.mocked(api.fetchShelves).mockResolvedValueOnce(MOCK_SHELVES);
    renderBooks();
    fireEvent.change(screen.getByPlaceholderText('Search for a book...'), { target: { value: 'code' } });
    fireEvent.click(screen.getByRole('button', { name: 'Search' }));
    await waitFor(() => expect(screen.getByText('Clean Code')).toBeInTheDocument());
  }

  it('renders book title and author', async () => {
    await renderWithBooks();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Robert C. Martin')).toBeInTheDocument();
  });

  it('shows "+ Add to collection" button when book is not in a collection', async () => {
    await renderWithBooks();
    expect(screen.getAllByRole('button', { name: '+ Add to collection' })).toHaveLength(2);
  });

  it('opens the shelf list when "+ Add to collection" is clicked', async () => {
    await renderWithBooks();
    fireEvent.click(screen.getAllByRole('button', { name: '+ Add to collection' })[0]);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Favorites' })).toBeInTheDocument());
  });

  it('adds book to a shelf and updates the button label', async () => {
    await renderWithBooks();
    fireEvent.click(screen.getAllByRole('button', { name: '+ Add to collection' })[0]);
    await waitFor(() => screen.getByRole('button', { name: 'Favorites' }));
    fireEvent.click(screen.getByRole('button', { name: 'Favorites' }));
    await waitFor(() => expect(api.addToShelf).toHaveBeenCalledWith(2, 'vol1'));
  });

  it('rolls back collection state when the API call fails', async () => {
    vi.mocked(api.addToShelf).mockRejectedValueOnce(new Error('network error'));
    await renderWithBooks();
    fireEvent.click(screen.getAllByRole('button', { name: '+ Add to collection' })[0]);
    await waitFor(() => screen.getByRole('button', { name: 'Favorites' }));

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Favorites' }));
    });

    await waitFor(() =>
      expect(useCollectionsStore.getState().bookCollections['vol1']).toBeUndefined()
    );
  });
});
