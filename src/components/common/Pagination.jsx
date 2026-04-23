import clsx from 'clsx';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
  className,
}) {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(
          1,
          '...',
          totalPages - 3,
          totalPages - 2,
          totalPages - 1,
          totalPages
        );
      } else {
        pages.push(
          1,
          '...',
          currentPage - 1,
          currentPage,
          currentPage + 1,
          '...',
          totalPages
        );
      }
    }

    return pages;
  };

  if (totalPages <= 1) return null;

  return (
    <div
      className={clsx(
        'flex flex-wrap items-center justify-between gap-4',
        className
      )}
    >
      {totalItems !== undefined && (
        <p className="text-sm text-cafe-500">
          Mostrando {startItem} a {endItem} de {totalItems} resultados
        </p>
      )}

      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="p-2 text-cafe-500 hover:text-cafe-700 hover:bg-beige-200 rounded-button disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página anterior"
        >
          <FiChevronLeft className="w-5 h-5" />
        </button>

        {getPageNumbers().map((page, index) =>
          page === '...' ? (
            <span
              key={`ellipsis-${index}`}
              className="px-3 py-2 text-cafe-400"
            >
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={clsx(
                'min-w-[40px] h-10 rounded-button text-sm font-medium transition-colors',
                currentPage === page
                  ? 'bg-oliva-500 text-white'
                  : 'text-cafe-600 hover:bg-beige-200'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="p-2 text-cafe-500 hover:text-cafe-700 hover:bg-beige-200 rounded-button disabled:opacity-50 disabled:cursor-not-allowed"
          aria-label="Página siguiente"
        >
          <FiChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
