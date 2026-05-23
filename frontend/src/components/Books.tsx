import { useState, useEffect } from 'react';
import '../styles/Books.css';
import { useQuery } from '@tanstack/react-query';
import useBooksStore from '../store/books';
import Pagination from './Pagination';
import { fetchShelves, fetchBooks } from '../lib/api';
import type { BookItem, Shelf } from '../lib/api';
import BookCard from './BookCard';

const DEFAULT_SHELVES: Shelf[] = [
  { id: 0, title: 'Favorites', volumeCount: 0 },
  { id: 2, title: 'To Read', volumeCount: 0 },
  { id: 3, title: 'Reading Now', volumeCount: 0 },
  { id: 4, title: 'Have Read', volumeCount: 0 },
];

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
