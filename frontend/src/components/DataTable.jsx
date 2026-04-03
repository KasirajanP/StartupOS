function DataTable({ columns, rows }) {
  return (
    <div className="overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/80 shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-5 py-4 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.length ? (
              rows.map((row, index) => (
                <tr key={row.id ?? index} className="align-top">
                  {columns.map((column) => (
                    <td key={column.key} className="px-5 py-4 text-sm text-slate-700">
                      {column.render ? column.render(row) : row[column.key]}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-5 py-8 text-center text-sm text-slate-500"
                >
                  No records available yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DataTable;
