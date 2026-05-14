import { useState } from 'react';
import type { BookItem, BookVolume } from '../App';
import '../styles/Books.css';
import { useQuery } from '@tanstack/react-query';

async function fetchBooks(text: string): Promise<{ totalBooks: number; items: BookItem[] }> {
  try {
    const url = `${process.env.API_URL}/api/books/search?q=${encodeURIComponent(text)}`;
    const response = await fetch(url, { credentials: 'include' });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    const data = (await response.json()) as BookVolume;
    return { totalBooks: data.totalItems, items: data.items || [] };
  } catch (error) {
    console.error('Error fetching books:', error);
    return { totalBooks: 0, items: [] };
  }
}

function Books() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['books', searchQuery],
    queryFn: () => fetchBooks(searchQuery),
    enabled: false,
  });

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
      ) : !data?.items.length ? (
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
                Books <span className="highlight">{data.items.length}</span> • Total{' '}
                <span className="highlight">{data.totalBooks}</span>
              </p>
            </div>
          </div>
          <div className="books-grid">
            {data.items.map((book: BookItem, index) => (
              <div key={index} className="book-card">
                <img
                  className="book-image"
                  src={book.volumeInfo.imageLinks?.smallThumbnail}
                  alt={book.volumeInfo.title}
                />
                <h3 className="book-title">{book.volumeInfo.title}</h3>
                <p className="book-author">{book.volumeInfo.authors?.join(', ')}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default Books;
