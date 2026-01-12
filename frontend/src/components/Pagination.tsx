import { useEffect, useRef, useState } from 'react';
import type { BookItem, BookVolume } from '../App';

import './Pagination.css';

async function fetchBooks(
  text: string,
  keyword: { type: string; value: string },
  pageIndex: number = 0
): Promise<{ totalBooks: number; items: BookItem[] }> {
  try {
    const url = `http://localhost:2000/api/books?q=${text}&t=${keyword.type}&v=${keyword.value}&page=${pageIndex}`;
    console.debug(`Fetching books from: ${url}`);
    const response = await fetch(url, { mode: 'cors' });
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

export type PaginationProps = {
  bookItems: BookItem[];
  searchQuery: string;
  searchType: string;
  searchTypeInput?: string;
  setBooks: (books: BookItem[]) => void;
};

const MAX_PAGES_TO_SHOW = 5;

function Pagination({
  searchQuery,
  searchType,
  searchTypeInput,
  setBooks,
}: PaginationProps) {
  const [showPages, setShowPages] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [goToPage, setGoToPage] = useState(1);
  const [totalBooks, setTotalBooks] = useState(1000);
  const pageRef = useRef(0);

  async function handleFetchBooks(startIndex: number = 0) {
    console.debug(`Fetching books for page index: ${startIndex}`);
    // Fetch books based on the search query and type
    if (searchType === 'title') {
      const fetchedBooks = await fetchBooks(
        encodeURIComponent(searchQuery),
        {
          type: 'title',
          value: encodeURIComponent(searchTypeInput!),
        },
        startIndex
      );
      setBooks(fetchedBooks.items);
      setTotalBooks(fetchedBooks.totalBooks);
    } else if (searchType === 'author') {
      const fetchedBooks = await fetchBooks(
        encodeURIComponent(searchQuery),
        {
          type: 'author',
          value: encodeURIComponent(searchTypeInput!),
        },
        startIndex
      );
      setBooks(fetchedBooks.items);
    } else if (searchType === 'isbn') {
      const fetchedBooks = await fetchBooks(
        encodeURIComponent(searchQuery),
        {
          type: 'isbn',
          value: encodeURIComponent(searchTypeInput!),
        },
        startIndex
      );
      setBooks(fetchedBooks.items);
    }
  }
   useEffect(() => {
      const START_PAGE_MIN = 2;
      const totalPages = Math.ceil(totalBooks / 10);
      const pages = new Array<number>();
  
      const startPage = Math.max(
        START_PAGE_MIN,
        currentPage - Math.floor(MAX_PAGES_TO_SHOW / Math.sqrt(MAX_PAGES_TO_SHOW))
      );
      const endPage = Math.min(totalPages, startPage + MAX_PAGES_TO_SHOW - 1);
  
    console.debug(
        `Total Pages: ${totalPages}, Current Page: ${currentPage}, Start Page: ${startPage}, End Page: ${endPage}`
      );
  
      for (let i = startPage; i < endPage; i++) {
        pages.push(i);
      }
  
      setShowPages(pages);
    }, [currentPage, totalBooks]);

  return (
    <>
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
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M15 19l-7-7 7-7"
              ></path>
            </svg>
            Previous
          </a>
          <a
            href="#"
            className={`pagination-btn ${currentPage === 1 ? 'active' : ''}`}
            onClick={() => {
              pageRef.current = 0;
              console.debug(pageRef.current);
              handleFetchBooks(pageRef.current);
              setCurrentPage(1);
            }}
          >
            1
          </a>
          <span className="pagination-ellipsis">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
              <path d="M12 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
              <path d="M12 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
            </svg>
          </span>
          {showPages.map((i) => {
            return (
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
            );
          })}

          <span className="pagination-ellipsis">
            <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 12m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
              <path d="M12 19m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
              <path d="M12 5m-2 0a2 2 0 1 0 4 0a2 2 0 1 0 -4 0"></path>
            </svg>
          </span>
          {/* Display the last page number */}
          <a href="#" className="pagination-btn">
            {Math.ceil(totalBooks / 10)}
          </a>

          <a href="#" className="pagination-btn">
            Next
            <svg
              className="arrow arrow-right"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M9 5l7 7-7 7"
              ></path>
            </svg>
          </a>
        </div>

        <div className="page-navigation">
          <label htmlFor="goto-page" className="page-label">
            Go to page:
          </label>
          <input
            type="number"
            id="goto-page"
            min="1"
            max={Math.ceil(totalBooks / 10)}
            className="page-input"
            onChange={(e) => {
              const value = parseInt(e.target.value, 10);
              if (value >= 1 && value <= Math.ceil(totalBooks / 10)) {
                setGoToPage(value);
              } else {
                setGoToPage(1);
              }
            }}
            value={goToPage}
            placeholder="Enter page number"
          />
          <button
            className="goto-btn"
            onClick={() => {
              console.debug(`Going to page ${goToPage}`);
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
    </>
  );
}

export default Pagination;
