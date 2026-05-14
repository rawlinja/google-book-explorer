import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BookItem } from '../App';

type BooksState = {
  books: BookItem[];
  totalBooks: number;
  lastQuery: string;
  setResults: (books: BookItem[], totalBooks: number, query: string) => void;
};

const useBooksStore = create<BooksState>()(
  persist(
    (set) => ({
      books: [],
      totalBooks: 0,
      lastQuery: '',
      setResults: (books, totalBooks, query) => set({ books, totalBooks, lastQuery: query }),
    }),
    { name: 'books-cache' }
  )
);

export default useBooksStore;
