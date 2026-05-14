import { useState, useEffect } from 'react';
import type { BookItem, BookVolume } from '../App';
import '../styles/Books.css';
import { useQuery } from '@tanstack/react-query';
import useBooksStore from '../store/books';

const PLACEHOLDER_COVER = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="128" height="192" viewBox="0 0 128 192"%3E%3Crect width="128" height="192" fill="%23e5e7eb"/%3E%3Ctext x="64" y="104" font-family="sans-serif" font-size="12" fill="%239ca3af" text-anchor="middle"%3ENo cover%3C/text%3E%3C/svg%3E';

async function fetchBooks(text: string): Promise<{ totalBooks: number; items: BookItem[] }> {
  const url = `${process.env.API_URL}/api/books/search?q=${encodeURIComponent(text)}`;
  const response = await fetch(url, { credentials: 'include' });
  if (response.status === 401) {
    window.location.href = '/authorize';
    throw new Error('Unauthorized');
  }
  if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
  const data = (await response.json()) as BookVolume;
  return { totalBooks: data.totalItems, items: data.items || [] };
}

function Books() {
  const { books, totalBooks, lastQuery, setResults } = useBooksStore();
  const [searchQuery, setSearchQuery] = useState(lastQuery);

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['books', searchQuery],
    queryFn: () => fetchBooks(searchQuery),
    enabled: false,
  });

  useEffect(() => {
    if (data) setResults(data.items, data.totalBooks, searchQuery);
  }, [data, searchQuery, setResults]);

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
            onKeyDown={(e) => e.key === 'Enter' && refetch()}
            id="search"
            type="text"
            value={searchQuery}
            placeholder="Search for a book..."
          />
          <button className="search-btn" onClick={() => refetch()}>
            Search
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="loading">Loading books...</div>
      ) : isError ? (
        <div className="error">Error fetching books. Please try again later.</div>
      ) : (() => {
        const displayItems = data?.items ?? books;
        const displayTotal = data?.totalBooks ?? totalBooks;
        return !displayItems.length ? (
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
                <div key={book.id} className="book-card">
                  <img
                    className="book-image"
                    src={book.volumeInfo.imageLinks?.smallThumbnail ?? PLACEHOLDER_COVER}
                    alt={book.volumeInfo.title}
                  />
                  <h3 className="book-title">{book.volumeInfo.title}</h3>
                  <p className="book-author">{book.volumeInfo.authors?.join(', ')}</p>
                </div>
              ))}
            </div>
          </>
        );
      })()}
    </div>
  );
}

export default Books;
