import { useState, useEffect } from 'react';
import type { BookItem, BookVolume } from '../App';
import '../styles/Books.css';
import { useQuery } from '@tanstack/react-query';
import useBooksStore from '../store/books';
import Pagination from './Pagination';
import { fetchShelves, addToShelf } from '../lib/api';
import type { Shelf } from '../lib/api';

const PLACEHOLDER_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 128 192"%3E%3Crect width="128" height="192" fill="%23e5e7eb"/%3E%3Ctext x="64" y="104" font-family="sans-serif" font-size="12" fill="%239ca3af" text-anchor="middle"%3ENo cover%3C/text%3E%3C/svg%3E';

const DEFAULT_SHELVES: Shelf[] = [
  { id: 0, title: 'Favorites', volumeCount: 0 },
  { id: 2, title: 'To Read', volumeCount: 0 },
  { id: 3, title: 'Reading Now', volumeCount: 0 },
  { id: 4, title: 'Have Read', volumeCount: 0 },
  { id: 7, title: 'My eBooks', volumeCount: 0 },
];

async function fetchBooks(text: string, page: number): Promise<{ totalBooks: number; items: BookItem[] }> {
  const url = `${process.env.API_URL}/api/books/search?q=${encodeURIComponent(text)}&page=${page}`;
  const response = await fetch(url, { credentials: 'include' });
  if (response.status === 401) {
    window.location.href = '/authorize';
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = (await response.json()) as BookVolume;
  return { totalBooks: data.totalItems, items: data.items || [] };
}

function BookCard({ book, shelves }: { book: BookItem; shelves: Shelf[] }) {
  const [shelfOpen, setShelfOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function handleAddToShelf(shelfId: number) {
    setAdding(true);
    try {
      await addToShelf(shelfId, book.id);
      setAdded(true);
      setShelfOpen(false);
      setTimeout(() => setAdded(false), 1500);
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="book-card" onClick={() => { if (!shelfOpen) return; setShelfOpen(false); }}>
      <img className="book-image" src={book.thumbnail ?? PLACEHOLDER_COVER} alt={book.title} />
      <h3 className="book-title">{book.title}</h3>
      <p className="book-author">{book.authors?.join(', ')}</p>
      {shelves.length > 0 && (
        <div className={`shelf-bar${shelfOpen ? ' shelf-bar--open' : ''}`} onClick={(e) => e.stopPropagation()}>
          {added ? (
            <span className="shelf-added">Added ✓</span>
          ) : shelfOpen ? (
            <div className="shelf-list">
              {shelves.map((shelf) => (
                <button
                  key={shelf.id}
                  className="shelf-item"
                  onClick={() => handleAddToShelf(shelf.id)}
                  disabled={adding}
                >
                  {shelf.title}
                </button>
              ))}
            </div>
          ) : (
            <button className="shelf-bar-btn" onClick={() => setShelfOpen(true)}>
              + Add to collection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function Books() {
  const { books, totalBooks, lastQuery, setResults } = useBooksStore();
  const [searchQuery, setSearchQuery] = useState(lastQuery);
  const [submittedQuery, setSubmittedQuery] = useState(lastQuery);
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['books', submittedQuery, page],
    queryFn: () => fetchBooks(submittedQuery, page),
    enabled: submittedQuery.length > 0,
  });

  const { data: fetchedShelves } = useQuery({
    queryKey: ['bookshelves'],
    queryFn: fetchShelves,
    staleTime: Infinity,
  });
  const shelves = fetchedShelves?.length ? fetchedShelves : DEFAULT_SHELVES;

  useEffect(() => {
    if (data) setResults(data.items, data.totalBooks, submittedQuery);
  }, [data, submittedQuery, setResults]);

  function handleSearch() {
    setPage(1);
    setSubmittedQuery(searchQuery);
  }

  const displayItems = data?.items ?? books;
  const displayTotal = data?.totalBooks ?? totalBooks;
  const totalPages = Math.ceil(displayTotal / 10);

  return (
    <div className="container">
      <div className="hero-section">
        <h1>Google Book Search</h1>
        <p>Search for books using the Google Books API</p>
      </div>
      <div className="search-container">
        <div className="search-input-group">
          <input
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            id="search"
            type="text"
            value={searchQuery}
            placeholder="Search for a book..."
          />
          <button className="search-btn" onClick={handleSearch}>
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading books...</div>
      ) : isError ? (
        <div className="error">Error fetching books. Please try again later.</div>
      ) : !displayItems.length ? (
        <div className="no-books-container">
          <div className="no-books-message">
            <div className="no-books-icon">📚</div>
            <h3 className="no-books-title">No books found</h3>
            <p className="no-books-text">Try a different search term</p>
          </div>
        </div>
      ) : (
        <>
          <div className="pagination-container">
            <div className="pagination-info">
              <p>
                <span className="dot"></span>
                Books <span className="highlight">{displayItems.length}</span> • Total{' '}
                <span className="highlight">{displayTotal}</span>
              </p>
            </div>
          </div>
          <div className="books-grid">
            {displayItems.map((book: BookItem) => (
              <BookCard key={book.id} book={book} shelves={shelves} />
            ))}
          </div>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </>
      )}
    </div>
  );
}

export default Books;
