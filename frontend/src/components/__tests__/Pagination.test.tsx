import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import Pagination from '../Pagination';

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(<Pagination page={1} totalPages={1} onPageChange={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders all page buttons when totalPages <= 7', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    for (let i = 1; i <= 5; i++) {
      expect(screen.getByRole('button', { name: String(i) })).toBeInTheDocument();
    }
    expect(screen.queryByText('…')).not.toBeInTheDocument();
  });

  it('marks the current page button as active', () => {
    render(<Pagination page={3} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '3' })).toHaveClass('active');
    expect(screen.getByRole('button', { name: '1' })).not.toHaveClass('active');
  });

  it('disables the prev button on the first page', () => {
    render(<Pagination page={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '‹' })).toBeDisabled();
  });

  it('disables the next button on the last page', () => {
    render(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: '›' })).toBeDisabled();
  });

  it('calls onPageChange with page - 1 when clicking prev', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: '‹' }));
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange with page + 1 when clicking next', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: '›' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('calls onPageChange with the clicked page number', () => {
    const onPageChange = vi.fn();
    render(<Pagination page={1} totalPages={5} onPageChange={onPageChange} />);
    fireEvent.click(screen.getByRole('button', { name: '4' }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it('shows both ellipses for a middle page in a long list', () => {
    render(<Pagination page={7} totalPages={15} onPageChange={vi.fn()} />);
    expect(screen.getAllByText('…')).toHaveLength(2);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
  });

  it('shows only a leading ellipsis when current page is near the end', () => {
    // page=13, total=15: 13 < total-2=13 is false → no trailing ellipsis
    render(<Pagination page={13} totalPages={15} onPageChange={vi.fn()} />);
    expect(screen.getAllByText('…')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '15' })).toBeInTheDocument();
  });

  it('shows only a trailing ellipsis when current page is near the start', () => {
    // page=3, total=15: 3 > 3 is false → no leading ellipsis
    render(<Pagination page={3} totalPages={15} onPageChange={vi.fn()} />);
    expect(screen.getAllByText('…')).toHaveLength(1);
    expect(screen.getByRole('button', { name: '1' })).toBeInTheDocument();
  });
});
