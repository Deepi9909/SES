export default function ComparisonTable({ data }) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-gray-400">
        Upload and compare contracts to see results here.
      </div>
    );
  }

  // If backend returns markdown (comparison_markdown field)
  if (data.comparison_markdown) {
    return (
      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <div className="prose max-w-none">
          <pre className="whitespace-pre-wrap text-sm">{data.comparison_markdown}</pre>
        </div>
      </div>
    );
  }

  // Handle different data structures from backend
  const rows = data.differences || data.comparisons || data.rows || [];

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      {rows.length === 0 ? (
        <div className="text-center text-gray-400 py-8">
          No comparison data available.
        </div>
      ) : (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 text-left">Clause/Field</th>
              <th className="p-2 text-left">Contract A</th>
              <th className="p-2 text-left">Contract B</th>
              <th className="p-2 text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50">
                <td className="p-2 font-medium">
                  {row.clause || row.field || row.name || 'N/A'}
                </td>
                <td className="p-2">
                  {row.contractA || row.valueA || row.value_a || '-'}
                </td>
                <td className="p-2">
                  {row.contractB || row.valueB || row.value_b || '-'}
                </td>
                <td className="p-2">
                  <span
                    className={`font-semibold ${
                      (row.status || row.match || row.difference)?.toLowerCase() === 'match' ||
                      (row.status || row.match || row.difference)?.toLowerCase() === 'same'
                        ? 'text-green-600'
                        : (row.status || row.match || row.difference)?.toLowerCase() === 'mismatch' ||
                          (row.status || row.match || row.difference)?.toLowerCase() === 'different'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                    }`}
                  >
                    {row.status || row.match || row.difference || 'Unknown'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {data.summary && (
        <div className="mt-6 p-4 bg-blue-50 rounded">
          <h3 className="font-semibold mb-2">Summary</h3>
          <p className="text-sm text-gray-700">{data.summary}</p>
        </div>
      )}

      {data.statistics && (
        <div className="mt-4 grid grid-cols-3 gap-4">
          <div className="p-3 bg-green-50 rounded text-center">
            <div className="text-2xl font-bold text-green-600">
              {data.statistics.matches || 0}
            </div>
            <div className="text-xs text-gray-600">Matches</div>
          </div>
          <div className="p-3 bg-red-50 rounded text-center">
            <div className="text-2xl font-bold text-red-600">
              {data.statistics.mismatches || 0}
            </div>
            <div className="text-xs text-gray-600">Mismatches</div>
          </div>
          <div className="p-3 bg-gray-50 rounded text-center">
            <div className="text-2xl font-bold text-gray-600">
              {data.statistics.total || rows.length}
            </div>
            <div className="text-xs text-gray-600">Total Fields</div>
          </div>
        </div>
      )}
    </div>
  );
}
