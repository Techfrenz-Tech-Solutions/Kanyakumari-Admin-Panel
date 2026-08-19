import { ChevronLeft, ChevronRight } from './Icons.jsx';

export default function Pagination({ page, pageSize, total, onPageChange }) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  const pages = [];
  const windowSize = 1;
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= windowSize) {
      pages.push(p);
    } else if (pages[pages.length - 1] !== '...') {
      pages.push('...');
    }
  }

  return (
    <div className="pagination">
      <div className="info">Showing <strong>{start}</strong>–<strong>{end}</strong> of <strong>{total}</strong> results</div>
      <div className="pages">
        <button className="page-btn" disabled={page === 1} onClick={() => onPageChange(page - 1)}><ChevronLeft /></button>
        {pages.map((p, i) => p === '...' ? (
          <span key={`e${i}`} className="page-btn" style={{ border: 'none', cursor: 'default' }}>…</span>
        ) : (
          <button key={p} className={`page-btn ${p === page ? 'active' : ''}`} onClick={() => onPageChange(p)}>{p}</button>
        ))}
        <button className="page-btn" disabled={page === totalPages} onClick={() => onPageChange(page + 1)}><ChevronRight /></button>
      </div>
    </div>
  );
}
