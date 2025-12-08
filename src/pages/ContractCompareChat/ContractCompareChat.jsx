import { useState, useRef } from 'react';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import MetadataPanel from '../../components/MetadataPanel/MetadataPanel';
import ComparisonTableDisplay from '../../components/ComparisonTable/ComparisonTableDisplay';
import { uploadFile, compareContracts, downloadBlob, exportComparisonPDF, exportComparisonCSV } from '../../services/api';

export default function ContractCompareChat() {
  const [mode, setMode] = useState('chat');
  const [contractA, setContractA] = useState(null);
  const [contractB, setContractB] = useState(null);
  const [contractAUrl, setContractAUrl] = useState(null);
  const [contractBUrl, setContractBUrl] = useState(null);
  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingB, setUploadingB] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [comparisonData, setComparisonData] = useState(null);
  const [viewMode, setViewMode] = useState('detailed');
  const [uniqueId, setUniqueId] = useState(null);
  const fileInputRef = useRef();

  const handleContractAUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Generate unique_id if not exists
    const currentUniqueId = uniqueId || Date.now().toString();
    if (!uniqueId) {
      setUniqueId(currentUniqueId);
      console.log('Generated unique_id:', currentUniqueId);
    }

    console.log('Contract A upload started:', file.name);
    setContractA(file);
    setContractAUrl(null);
    setUploadingA(true);

    try {
      const blobUrl = await uploadFile(file, currentUniqueId);
      console.log('Contract A uploaded successfully:', blobUrl);
      setContractAUrl(blobUrl);
    } catch (error) {
      console.error('Failed to upload Contract A:', error);
      alert('Failed to upload Contract A. Please try again. Error: ' + error.message);
      setContractA(null);
    } finally {
      setUploadingA(false);
    }
  };

  const handleContractBUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Generate unique_id if not exists
    const currentUniqueId = uniqueId || Date.now().toString();
    if (!uniqueId) {
      setUniqueId(currentUniqueId);
      console.log('Generated unique_id:', currentUniqueId);
    }

    console.log('Contract B upload started:', file.name);
    setContractB(file);
    setContractBUrl(null);
    setUploadingB(true);

    try {
      const blobUrl = await uploadFile(file, currentUniqueId);
      console.log('Contract B uploaded successfully:', blobUrl);
      setContractBUrl(blobUrl);
    } catch (error) {
      console.error('Failed to upload Contract B:', error);
      alert('Failed to upload Contract B. Please try again. Error: ' + error.message);
      setContractB(null);
    } finally {
      setUploadingB(false);
    }
  };

  const handleCompare = async () => {
    if (!contractAUrl || !contractBUrl) {
      alert('Please upload both contracts before comparing.');
      return;
    }

    if (!uniqueId) {
      alert('Error: No unique ID found. Please re-upload the files.');
      return;
    }

    console.log('Starting comparison with unique_id:', uniqueId);
    setComparing(true);
    setComparisonData(null);

    try {
      const result = await compareContracts(uniqueId);
      console.log('Comparison result:', result);
      setComparisonData(result);
    } catch (error) {
      console.error('Failed to compare contracts:', error);
      alert('Failed to compare contracts. Please try again. Error: ' + error.message);
    } finally {
      setComparing(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!comparisonData) return;

    try {
      const blob = await exportComparisonPDF(comparisonData);
      downloadBlob(blob, 'contract-comparison.pdf');
    } catch (error) {
      console.error('Failed to export PDF:', error);
      alert('Failed to export PDF. Please try again.');
    }
  };

  const handleDownloadCSV = async () => {
    if (!comparisonData) return;

    try {
      const blob = await exportComparisonCSV(comparisonData);
      downloadBlob(blob, 'contract-comparison.csv');
    } catch (error) {
      console.error('Failed to export CSV:', error);
      alert('Failed to export CSV. Please try again.');
    }
  };

  return (
    <div>
      <div className="sticky top-0 bg-white z-10 flex gap-4 items-center mb-6 p-2 rounded shadow">
        <button
          className={`px-4 py-2 rounded font-semibold ${
            mode === 'chat' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-700'
          }`}
          onClick={() => setMode('chat')}
        >
          Chat with Documents
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold ${
            mode === 'compare' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-blue-700'
          }`}
          onClick={() => setMode('compare')}
        >
          Compare Documents
        </button>
      </div>
      {mode === 'chat' ? (
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1">
            <ChatWindow />
          </div>
          <div className="w-full md:w-80">
            <MetadataPanel collapsible />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col md:flex-row gap-6 mb-6">
            <div className="flex-1">
              <div className="mb-2 font-semibold">Contract A</div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleContractAUpload}
                  className="hidden"
                  id="contractA"
                  disabled={uploadingA}
                />
                <label htmlFor="contractA" className="cursor-pointer">
                  {uploadingA ? (
                    <div className="text-sm text-blue-600">
                      <div className="text-3xl mb-2">⏳</div>
                      <div>Uploading...</div>
                    </div>
                  ) : contractA ? (
                    <div className="text-sm">
                      <div className="text-3xl mb-2">✅</div>
                      <span className="text-blue-600 font-semibold">{contractA.name}</span>
                      <div className="mt-2">
                        <button
                          className="text-red-500 hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            setContractA(null);
                            setContractAUrl(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📄</div>
                      <div className="text-gray-600">Click to upload Contract A</div>
                      <div className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX</div>
                    </div>
                  )}
                </label>
              </div>
            </div>
            <div className="flex-1">
              <div className="mb-2 font-semibold">Contract B</div>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx"
                  onChange={handleContractBUpload}
                  className="hidden"
                  id="contractB"
                  disabled={uploadingB}
                />
                <label htmlFor="contractB" className="cursor-pointer">
                  {uploadingB ? (
                    <div className="text-sm text-blue-600">
                      <div className="text-3xl mb-2">⏳</div>
                      <div>Uploading...</div>
                    </div>
                  ) : contractB ? (
                    <div className="text-sm">
                      <div className="text-3xl mb-2">✅</div>
                      <span className="text-blue-600 font-semibold">{contractB.name}</span>
                      <div className="mt-2">
                        <button
                          className="text-red-500 hover:underline"
                          onClick={(e) => {
                            e.preventDefault();
                            setContractB(null);
                            setContractBUrl(null);
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-3xl mb-2">📄</div>
                      <div className="text-gray-600">Click to upload Contract B</div>
                      <div className="text-xs text-gray-400 mt-1">PDF, DOC, DOCX, XLS, XLSX</div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <button
              className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={handleCompare}
              disabled={!contractAUrl || !contractBUrl || comparing}
            >
              {comparing ? 'Comparing...' : 'Compare Contracts'}
            </button>
          </div>
          <div className="mb-4">
            <label className="mr-4">
              <input
                type="radio"
                name="view"
                checked={viewMode === 'detailed'}
                onChange={() => setViewMode('detailed')}
              /> Detailed Comparison View
            </label>
            <label>
              <input
                type="radio"
                name="view"
                checked={viewMode === 'summary'}
                onChange={() => setViewMode('summary')}
              /> Summary View
            </label>
          </div>
          {comparing && (
            <div className="animate-pulse text-center py-10 text-gray-400">
              Generating comparison...
            </div>
          )}
          {comparisonData && !comparing && (
            <>
              <ComparisonTableDisplay data={comparisonData} />
              <div className="flex gap-4 mt-6">
                <button
                  className="bg-gray-100 text-blue-700 px-4 py-2 rounded shadow hover:bg-blue-200"
                  onClick={handleDownloadPDF}
                >
                  Download PDF
                </button>
                <button
                  className="bg-gray-100 text-blue-700 px-4 py-2 rounded shadow hover:bg-blue-200"
                  onClick={handleDownloadCSV}
                >
                  Download CSV
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
