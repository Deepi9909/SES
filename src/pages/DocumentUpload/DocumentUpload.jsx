import { useState } from 'react';
import FileUpload from '../../components/FileUpload/FileUpload';

const tabs = [
  { name: 'Upload Contract', key: 'upload' },
  { name: 'Central Repository', key: 'repository' },
];

export default function DocumentUpload() {
  const [activeTab, setActiveTab] = useState('upload');

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <div className="flex gap-4 border-b">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`py-2 px-4 font-semibold ${
                activeTab === tab.key
                  ? 'border-b-2 border-blue-600 text-blue-700'
                  : 'text-gray-500'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        {activeTab === 'upload' ? (
          <div>
            <FileUpload />
            <div className="mt-4 text-gray-500 text-sm">
              Uploaded documents will be parsed and stored in vector database.
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-4 font-semibold text-lg">Central Repository</div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-2">Select</th>
                    <th className="p-2">File Name</th>
                    <th className="p-2">Version</th>
                    <th className="p-2">Date Uploaded</th>
                    <th className="p-2">Size</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-2">
                      <input type="checkbox" />
                    </td>
                    <td className="p-2">Contract_A.pdf</td>
                    <td className="p-2">v1.0</td>
                    <td className="p-2">2024-06-01</td>
                    <td className="p-2">1.2MB</td>
                    <td className="p-2">
                      <button className="text-blue-600 hover:underline">View</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <button className="mt-4 bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
              Load Selected Documents
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
