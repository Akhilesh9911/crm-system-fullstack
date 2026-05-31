import { ChevronLeft, ChevronRight } from 'lucide-react'

export default function Table({ columns, data, pagination, onPageChange, loading }) {
  const rows = Array.isArray(data) ? data : []
  const total = pagination?.totalElements || 0
  const start = total === 0 ? 0 : pagination.page * pagination.size + 1
  const end = total === 0 ? 0 : Math.min((pagination.page + 1) * pagination.size, total)

  if (loading) return (
    <div className="bg-white rounded-xl border border-gray-200 p-12 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    </div>
  )
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              {columns.map(col => (
                <th key={col.key} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider" style={col.width ? { width: col.width } : {}}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.length === 0 ? (
              <tr><td colSpan={columns.length} className="px-4 py-12 text-center text-gray-400">No results found</td></tr>
            ) : rows.map((row, idx) => {
              const rowKey = row?.id ?? row?.email ?? row?.title ?? row?.name ?? `row-${idx}`
              return (
              <tr key={rowKey} className="hover:bg-gray-50 transition-colors">
                {columns.map(col => (
                  <td key={col.key} className="px-4 py-3 text-gray-700">
                    {col.render ? col.render(row) : row[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            )})}
          </tbody>
        </table>
      </div>
      {pagination && (
        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {start}–{end} of {total}
          </p>
          <div className="flex items-center gap-2">
            <button onClick={() => onPageChange(pagination.page - 1)} disabled={pagination.page === 0} className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronLeft size={16} />
            </button>
            <span className="text-sm text-gray-600 px-2">Page {pagination.page + 1} of {pagination.totalPages}</span>
            <button onClick={() => onPageChange(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages - 1} className="p-1 rounded-lg border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
