export default function ComparisonTableDisplay({ data, viewMode = 'detailed' }) {
  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-4 text-center text-gray-400">
        Upload and compare contracts to see results here.
      </div>
    );
  }

  // If viewMode is 'summary', show only the summary_part
  if (viewMode === 'summary') {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        {data.summary_part ? (
          <div className="p-4 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-blue-900">📋 Summary</h3>
            <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{data.summary_part}</p>
          </div>
        ) : (
          <div className="text-center text-gray-400">
            No summary available.
          </div>
        )}
      </div>
    );
  }

  // If backend returns markdown (comparison_markdown field)
  if (data.comparison_markdown) {
    // Parse markdown to extract tables
    const markdown = data.comparison_markdown;
    
    // Split by table headers to separate Table 1 and Table 2
    const sections = markdown.split(/(?=\*\*📄 Table|\*\*📊 Table)/);
    
    return (
      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto space-y-6">
        {sections.map((section, idx) => {
          if (section.includes('📄 Table 1')) {
            return <MarkdownTable key={idx} content={section} title="Clause-Level Comparison" />;
          } else if (section.includes('📊 Table 2')) {
            return <MarkdownTable key={idx} content={section} title="Product & Unit Price Comparison" />;
          }
          return null;
        })}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-4 text-center text-gray-400">
      No comparison data available.
    </div>
  );
}

// Component to render markdown table
function MarkdownTable({ content, title }) {
  // Extract table content between | characters
  const lines = content.split('\n').filter(line => line.trim().startsWith('|'));
  
  if (lines.length < 2) {
    return <div className="text-gray-400">Unable to parse table</div>;
  }

  // Parse header row
  const headerLine = lines[0];
  const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);

  // Skip separator line (index 1)
  // Parse data rows
  const dataRows = lines.slice(2).map(line => {
    return line.split('|').map(cell => cell.trim()).filter(cell => cell);
  });

  return (
    <div className="mb-8">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        {title === "Clause-Level Comparison" ? "📄" : "📊"} {title}
      </h3>
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left font-semibold text-gray-700 border-b border-gray-300"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={`${rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50 transition-colors`}
              >
                {row.map((cell, cellIdx) => {
                  // Highlight different/same/match cells
                  let cellClass = 'px-3 py-2 border-b border-gray-200';
                  
                  if (cell.toLowerCase().includes('different') || 
                      cell.toLowerCase().includes('mismatch') ||
                      cell.toLowerCase().includes('removed') ||
                      cell.toLowerCase().includes('added')) {
                    cellClass += ' text-red-600 font-medium';
                  } else if (cell.toLowerCase().includes('identical') || 
                             cell.toLowerCase().includes('same') ||
                             cell.toLowerCase().includes('match')) {
                    cellClass += ' text-green-600 font-medium';
                  } else if (cell.includes('%') && cell.includes('-')) {
                    cellClass += ' text-red-600 font-semibold';
                  } else if (cell.includes('%') && !cell.includes('-')) {
                    cellClass += ' text-green-600 font-semibold';
                  }
                  
                  return (
                    <td key={cellIdx} className={cellClass}>
                      {cell || '-'}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
