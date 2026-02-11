import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import ChatWindow from '../../components/ChatWindow/ChatWindow';
import MetadataPanel from '../../components/MetadataPanel/MetadataPanel';
import ComparisonTableDisplay from '../../components/ComparisonTable/ComparisonTableDisplay';
import { uploadFile, compareContracts, downloadBlob, exportComparisonPDF, exportComparisonCSV, clearSession } from '../../services/api';

export default function ContractCompareChat() {
  const location = useLocation();
  const [mode, setMode] = useState('chat');
  const [prevMode, setPrevMode] = useState('chat');
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
  const [categoryFilter, setCategoryFilter] = useState('all');
  const fileInputRef = useRef();

  // Set initial mode based on navigation state
  useEffect(() => {
    if (location.state?.mode) {
      setMode(location.state.mode);
    }
  }, [location.state]);

  // Clear session when switching modes
  useEffect(() => {
    if (prevMode !== mode) {
      // Switching from compare to chat - clear compare session
      if (prevMode === 'compare' && uniqueId) {
        console.log('Switching from compare to chat, clearing compare session:', uniqueId);
        clearSession(uniqueId).catch(err => {
          console.error('Failed to clear compare session:', err);
        });
        // Reset compare state
        setContractA(null);
        setContractB(null);
        setContractAUrl(null);
        setContractBUrl(null);
        setComparisonData(null);
        setComparing(false);
        setUniqueId(null);
      }
      
      setPrevMode(mode);
    }
  }, [mode, prevMode, uniqueId]);

  // Cleanup compare session on component unmount only
  useEffect(() => {
    return () => {
      if (mode === 'compare' && uniqueId && (contractAUrl || contractBUrl)) {
        console.log('ContractCompareChat unmounting, clearing compare session:', uniqueId);
        clearSession(uniqueId).catch(err => {
          console.error('Failed to clear compare session on unmount:', err);
        });
      }
    };
  // This intentionally only runs on unmount - dependencies are captured in closure
  // eslint-disable-next-line
  }, []);

  // Cleanup compare session on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (mode === 'compare' && uniqueId && (contractAUrl || contractBUrl)) {
        console.log('Page unloading, clearing compare session:', uniqueId);
        // Use navigator.sendBeacon for reliable cleanup on page unload
        const apiUrl = process.env.REACT_APP_API_URL;
        const data = JSON.stringify({
          unique_id: uniqueId,
          event_type: 'clearSession',
        });
        
        // sendBeacon is more reliable for page unload
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(apiUrl, blob);
        
        // Also clear from localStorage
        localStorage.removeItem('activeCompareSession');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [mode, uniqueId, contractAUrl, contractBUrl]);

  const handleContractAUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Generate unique_id if not exists
    const currentUniqueId = uniqueId || Date.now().toString();
    if (!uniqueId) {
      setUniqueId(currentUniqueId);
      // Store session ID in localStorage for cleanup on logout
      localStorage.setItem('activeCompareSession', currentUniqueId);
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
      // Store session ID in localStorage for cleanup on logout
      localStorage.setItem('activeCompareSession', currentUniqueId);
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

    console.log('Starting comparison with unique_id:', uniqueId, 'doc_type:', categoryFilter);
    setComparing(true);
    setComparisonData(null);

    try {
      const result = await compareContracts(uniqueId, categoryFilter);
      console.log('Comparison result:', result);
      console.log('Setting comparisonData with:', result);
      setComparisonData(result);
      console.log('comparisonData state should be updated now');
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

  const handleDownloadCSV = () => {
    if (!comparisonData) return;

    try {
      const blob = exportComparisonCSV(comparisonData);
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
          className={`px-4 py-2 rounded font-semibold transition ${
            mode === 'chat' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50'
          }`}
          onClick={() => setMode('chat')}
        >
          Chat with Documents
        </button>
        <button
          className={`px-4 py-2 rounded font-semibold transition ${
            mode === 'compare' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700 hover:bg-indigo-50'
          }`}
          onClick={() => setMode('compare')}
        >
          Compare Documents
        </button>
      </div>
      {mode === 'chat' ? (
        <div className="w-full">
          <ChatWindow key={mode} />
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
                    <div className="text-sm text-indigo-600">
                      <div className="text-3xl mb-2">⏳</div>
                      <div>Uploading...</div>
                    </div>
                  ) : contractA ? (
                    <div className="text-sm">
                      <div className="text-3xl mb-2">✅</div>
                      <span className="text-indigo-700 font-semibold">{contractA.name}</span>
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
                    <div className="text-sm text-indigo-600">
                      <div className="text-3xl mb-2">⏳</div>
                      <div>Uploading...</div>
                    </div>
                  ) : contractB ? (
                    <div className="text-sm">
                      <div className="text-3xl mb-2">✅</div>
                      <span className="text-indigo-700 font-semibold">{contractB.name}</span>
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
          <div className="mb-4 flex gap-4">
            <button
              className="bg-indigo-600 text-white px-6 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
              onClick={handleCompare}
              disabled={!contractAUrl || !contractBUrl || comparing || comparisonData}
            >
              {comparing ? 'Comparing...' : 'Compare Contracts'}
            </button>
            <button
              className="bg-red-600 text-white px-6 py-2 rounded shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              onClick={async () => {
                // Clear session data if session exists
                if (uniqueId) {
                  console.log('Clearing session data for session:', uniqueId);
                  try {
                    await clearSession(uniqueId);
                    localStorage.removeItem('activeCompareSession');
                    console.log('Session data cleared successfully');
                  } catch (error) {
                    console.error('Failed to clear session data:', error);
                    // Continue with clearing even if deletion fails
                  }
                }
                
                setContractA(null);
                setContractB(null);
                setContractAUrl(null);
                setContractBUrl(null);
                setComparisonData(null);
                setComparing(false);
                setUniqueId(null);
                // Reset file inputs
                const inputA = document.getElementById('contractA');
                const inputB = document.getElementById('contractB');
                if (inputA) inputA.value = '';
                if (inputB) inputB.value = '';
              }}
              disabled={!contractA && !contractB && !comparisonData}
            >
              Clear All
            </button>
          </div>
          
          {/* Filter Section */}
          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Filter by Category
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setCategoryFilter('all')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  categoryFilter === 'all'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setCategoryFilter('product')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  categoryFilter === 'product'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Product
              </button>
              <button
                onClick={() => setCategoryFilter('project')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  categoryFilter === 'project'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Project
              </button>
              <button
                onClick={() => setCategoryFilter('service')}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  categoryFilter === 'service'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Service
              </button>
            </div>
          </div>
          
          {comparing && (
            <div className="animate-pulse text-center py-10 text-gray-400">
              Generating comparison...
            </div>
          )}
          {comparisonData && !comparing && (
            <div className="text-center py-10">
              <div className="mb-4">
                <svg className="inline-block w-16 h-16 text-green-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-xl font-semibold text-gray-800">Comparison Complete!</h3>
                <p className="text-gray-600 mt-2">Your comparison is ready to download</p>
              </div>
              <button
                className="inline-flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-lg shadow hover:bg-indigo-700 transition"
                onClick={handleDownloadCSV}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Comparison Results (CSV)
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
