import clsx from 'clsx';

export default function Table({
  columns,
  data,
  loading = false,
  emptyMessage = 'No hay datos',
  onRowClick,
  className,
}) {
  return (
    <div className={clsx('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-beige-200">
            {columns.map((column, index) => (
              <th
                key={column.key || index}
                className={clsx(
                  'px-4 py-3 text-left text-xs font-medium text-cafe-600 uppercase tracking-wider',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right',
                  column.className
                )}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-beige-200">
          {loading ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center"
              >
                <div className="spinner mx-auto" />
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-cafe-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={row.id || rowIndex}
                className={clsx(
                  'hover:bg-beige-100 transition-colors',
                  onRowClick && 'cursor-pointer'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIndex) => (
                  <td
                    key={column.key || colIndex}
                    className={clsx(
                      'px-4 py-3 text-sm text-cafe-700',
                      column.align === 'center' && 'text-center',
                      column.align === 'right' && 'text-right',
                      column.cellClassName
                    )}
                  >
                    {column.render
                      ? column.render(row[column.key], row, rowIndex)
                      : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
