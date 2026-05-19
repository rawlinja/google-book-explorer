import '../styles/Pagination.css';

type Props = {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
};

function getPageNumbers(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | '...')[] = [1];
  if (current > 3) pages.push('...');
  const start = Math.max(2, current - 1);
  const end = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);
  if (current < total - 2) pages.push('...');
  pages.push(total);
  return pages;
}

function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="pagination">
      <button className="pagination-btn" onClick={() => onPageChange(page - 1)} disabled={page === 1}>
        ‹
      </button>
      {getPageNumbers(page, totalPages).map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="pagination-ellipsis">…</span>
        ) : (
          <button
            key={p}
            className={`pagination-btn${p === page ? ' active' : ''}`}
            onClick={() => onPageChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button className="pagination-btn" onClick={() => onPageChange(page + 1)} disabled={page === totalPages}>
        ›
      </button>
    </div>
  );
}

export default Pagination;
