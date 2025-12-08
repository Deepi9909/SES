import { useState } from 'react';

export default function MetadataPanel({ collapsible }) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {collapsible && (
        <button
          className="mb-2 text-blue-600 text-sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? 'Show Metadata' : 'Hide Metadata'}
        </button>
      )}
      {!collapsed && (
        <div>
          <div className="font-semibold mb-2">Document Metadata</div>
          <div className="text-sm text-gray-600">
            <div>Name: Contract_A.pdf</div>
            <div>Version: v1.0</div>
            <div>Type: NDA</div>
            <div>Date: 2024-06-01</div>
          </div>
        </div>
      )}
    </div>
  );
}
