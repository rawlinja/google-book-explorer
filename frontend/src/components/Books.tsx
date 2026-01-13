/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from 'react';
import Pagination from './Pagination';
import type { BookItem, BookVolume } from '../App';

import '../styles/Books.css';

import userSessionStore from '../store';
import { useQuery } from '@tanstack/react-query';

async function fetchBooksV2(
  text: string,
  pageIndex: number = 0
): Promise<{ totalBooks: number; items: BookItem[] }> {
  try {
    const url = `${import.meta.env.VITE_API_URL}/api/v2/books?q=${text}&page=${pageIndex}`;

    const response = await fetch(url, { credentials: 'include' });
    const data = (await response.json()) as BookVolume;
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return { totalBooks: data.totalItems, items: data.items || [] };
  } catch (error) {
    console.error('Error fetching books:', error);
    return { totalBooks: 0, items: [] };
  }
}

function Books() {
  const [_books, setBooks] = useState<BookItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchType] = useState('');
  const [searchTypeInput] = useState('');
  const [currentPage] = useState(1);

  const { isLoggedIn } = userSessionStore();


  const { data, refetch, isLoading, isError } = useQuery({
    queryKey: ['books'],
    queryFn: () => fetchBooksV2(encodeURIComponent(searchQuery)),
    enabled: false,
  });

  if (isLoading) {
    return <div className="loading">Loading books...</div>;
  }

  if (isError) {
    return <div className="error">Error fetching books. Please try again later.</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="not-logged-in">
        <h2>You are not logged in</h2>
        <p>Please authorize the application to access your Google Books data.</p>
      </div>
    );
  }

  return (
    <>
      <div className="container">
        <div className="hero-section">
          <h1>Google Book Search</h1>
          <p>Search for books using the Google Books API</p>
        </div>
        <div className="search-container">
          <div className="search-input-group">
            <input
              onChange={(e) => setSearchQuery(e.target.value)}
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

        {!data?.items.length ? (
          <div className="no-books-container">
            <div className="no-books-message">
              <div className="no-books-icon">📚</div>
              <h3 className="no-books-title">No books found</h3>
              <p className="no-books-text">Try a different search term</p>
            </div>
          </div>
        ) : (
          <div className="pagination-container">
            <div className="pagination-info">
              <p>
                <span className="dot"></span>
                Page <span className="highlight">{currentPage}</span> • Books{' '}
                <span className="highlight">{data.items.length}</span> • Total{' '}
                <span className="highlight">{data.totalBooks}</span>
              </p>
            </div>
          </div>
        )}

        {data?.items.length && (
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
        )}

        {data?.items.length && (
          <Pagination
            setBooks={setBooks}
            bookItems={data.items}
            searchQuery={searchQuery}
            searchType={searchType}
            searchTypeInput={searchTypeInput}
          />
        )}
      </div>
    </>
  );
}

export default Books;
