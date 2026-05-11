import { useEffect, useRef, useState } from 'react';
import type { BookItem, BookVolume } from '../App';
import '../styles/Pagination.css';

async function fetchBooks(
  text: string,
  keyword: { type: string; value: string },
  pageIndex: number = 0
): Promise<{ totalBooks: number; items: BookItem[] }> {
  try {
    const url = `${process.env.API_URL}/api/books/search?q=${text}&t=${keyword.type}&v=${keyword.value}&page=${pageIndex}`;
    const response = await fetch(url, { credentials: 'include' });
    const data = (await response.json()) as BookVolume;
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return { totalBooks: data.totalItems, items: data.items || [] };
  } catch (error) {
    console.error('Error fetching books:', error);
    return { totalBooks: 0, items: [] };
  }
}

export type PaginationProps = {
  bookItems: BookItem[];
  searchQuery: string;
  searchType: string;
  searchTypeInput?: string;
  setBooks: (books: BookItem[]) => void;
};

const MAX_PAGES_TO_SHOW = 5;

function Pagination({ searchQuery, searchType, searchTypeInput, setBooks }: PaginationProps) {
  const [showPages, setShowPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(1000);
  const pageRef = useRef(0);

  async function handleFetchBooks(startIndex: number = 0) {
    const fetchedBooks = await fetchBooks(
      encodeURIComponent(searchQuery),
      { type: searchType, value: encodeURIComponent(searchTypeInput ?? '') },
      startIndex
    );
    setBooks(fetchedBooks.items);
    setTotalBooks(fetchedBooks.totalBooks);
  }

  useEffect(() => {
    const totalPages = Math.ceil(totalBooks / 10);
    const startPage = Math.max(2, currentPage - Math.floor(MAX_PAGES_TO_SHOW / Math.sqrt(MAX_PAGES_TO_SHOW)));
    const endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);
    const pages: number[] = [];
    for (let i = startPage; i < endPage; i++) pages.push(i);
    setShowPages(pages);
  }, [currentPage, totalBooks]);

  return (
    <nav className="pagination">
      <div className="page-navigation">
        <a
          onClick={() => {
            if (pageRef.current > 0) {
              pageRef.current -= 10;
              handleFetchBooks(pageRef.current);
            }
          }}
          href="#"
          className={pageRef.current > 0 ? 'pagination-btn' : 'pagination-btn disabled'}
        >
          <svg className="arrow arrow-left" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Previous
        </a>
        <a
          href="#"
          className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
          onClick={() => {
            pageRef.current = 0;
            handleFetchBooks(0);
            setCurrentPage(1);
          }}
        >
          1
        </a>
        {showPages.map((i) => (
          <a
            key={i}
            onClick={() => {
              pageRef.current = i * 10;
              handleFetchBooks(pageRef.current);
              setCurrentPage(i);
            }}
            href="#"
            className={`pagination-btn ${currentPage === i ? 'active' : ''}`}
          >
            {i}
          </a>
        ))}
        <a href="#" className="pagination-btn">
          {Math.ceil(totalBooks / 10)}
        </a>
        <a
          href="#"
          className="pagination-btn"
          onClick={() => {
            pageRef.current += 10;
            handleFetchBooks(pageRef.current);
          }}
        >
          Next
          <svg className="arrow arrow-right" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
      <div className="page-navigation">
        <label htmlFor="goto-page" className="page-label">Go to page:</label>
        <input
          type="number"
          id="goto-page"
          min="1"
          max={Math.ceil(totalBooks / 10)}
          className="page-input"
          value={goToPage}
          onChange={(e) => {
            const v = parseInt(e.target.value, 10);
            setGoToPage(v >= 1 ? v : 1);
          }}
          placeholder="Enter page number"
        />
        <button
          className="goto-btn"
          onClick={() => {
            const pageIndex = (goToPage - 1) * 10;
            pageRef.current = pageIndex;
            setCurrentPage(goToPage);
            handleFetchBooks(pageIndex);
          }}
        >
          Go
        </button>
      </div>
    </nav>
  );
}

export default Pagination;
