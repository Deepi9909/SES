export default function FileUpload() {
  return (
    <div className="bg-gray-50 p-6 rounded-lg border border-dashed border-blue-300 flex flex-col items-center">
      <div className="mb-4 w-full flex flex-col items-center">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mb-2">
          <span className="text-3xl text-blue-400">📤</span>
        </div>
        <div className="text-gray-500 mb-2">Drag & drop files here or click to select</div>
        <input type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx" />
      </div>
      <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <input className="border rounded px-3 py-2" placeholder="Document Name" />
        <input className="border rounded px-3 py-2" placeholder="Document Type" />
        <input className="border rounded px-3 py-2" placeholder="Version" />
        <input className="border rounded px-3 py-2" type="date" placeholder="Date" />
      </div>
      <button className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700">
        Upload
      </button>
    </div>
  );
}
