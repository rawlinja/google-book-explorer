import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import BookCard from '../BookCard';
import useCollectionsStore from '../../store/collections';
import * as api from '../../lib/api';
import type { BookItem } from '../../lib/api';

vi.mock('../../lib/api', () => ({
  addToShelf: vi.fn().mockResolvedValue(undefined),
  removeFromShelf: vi.fn().mockResolvedValue(undefined),
}));

const SHELVES = [
  { id: 2, title: 'To Read', volumeCount: 0 },
  { id: 4, title: 'Have Read', volumeCount: 0 },
];

const BOOK = { id: 'vol1', title: 'Clean Code', authors: ['Robert C. Martin'], thumbnail: 'https://example.com/cover.jpg' };
const BOOK_NO_COVER = { id: 'vol2', title: 'Refactoring', authors: ['Martin Fowler'] };

function renderCard(book: BookItem = BOOK) {
  return render(<BookCard book={book} shelves={SHELVES} />);
}

beforeEach(() => {
  vi.clearAllMocks();
  useCollectionsStore.setState({ bookCollections: {} });
});

describe('BookCard', () => {
  it('renders book title and author', () => {
    renderCard();
    expect(screen.getByText('Clean Code')).toBeInTheDocument();
    expect(screen.getByText('Robert C. Martin')).toBeInTheDocument();
  });

  it('renders a placeholder when the book has no thumbnail', () => {
    renderCard(BOOK_NO_COVER);
    const img = screen.getByAltText('Refactoring') as HTMLImageElement;
    expect(img.src).toContain('data:image/svg+xml');
  });

  it('shows "+ Add to collection" when the book is not in a collection', () => {
    renderCard();
    expect(screen.getByRole('button', { name: '+ Add to collection' })).toBeInTheDocument();
  });

  it('shows "In: [shelf]" when the book is already in a collection', () => {
    useCollectionsStore.setState({ bookCollections: { vol1: 2 } });
    renderCard();
    expect(screen.getByText('In: To Read')).toBeInTheDocument();
  });

  it('opens the shelf list when "+ Add to collection" is clicked', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: '+ Add to collection' }));
    await waitFor(() => expect(screen.getByText('To Read')).toBeInTheDocument());
  });

  it('adds a book to a shelf and updates the button label', async () => {
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: '+ Add to collection' }));
    await waitFor(() => screen.getByText('To Read'));
    fireEvent.click(screen.getByText('To Read'));
    await waitFor(() => expect(screen.getByText('In: To Read')).toBeInTheDocument());
  });

  it('rolls back the collection when the API call fails', async () => {
    vi.mocked(api.addToShelf).mockRejectedValueOnce(new Error('Network error'));
    renderCard();
    fireEvent.click(screen.getByRole('button', { name: '+ Add to collection' }));
    await waitFor(() => screen.getByText('To Read'));
    fireEvent.click(screen.getByText('To Read'));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: '+ Add to collection' })).toBeInTheDocument()
    );
  });
});
