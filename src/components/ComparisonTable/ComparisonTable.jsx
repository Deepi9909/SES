import { useState } from "react";
import { BlobServiceClient } from "@azure/storage-blob";

export default function ComparisonTable() {
  const [contractA, setContractA] = useState(null);
  const [contractB, setContractB] = useState(null);
  const [contractAUrl, setContractAUrl] = useState(null);
  const [contractBUrl, setContractBUrl] = useState(null);
  const [uploadingA, setUploadingA] = useState(false);
  const [uploadingB, setUploadingB] = useState(false);
  const [errorA, setErrorA] = useState(null);
  const [errorB, setErrorB] = useState(null);
  const [comparing, setComparing] = useState(false);
  const [showTable, setShowTable] = useState(false);

  const API_BASE_URL = "http://127.0.0.1:8000";

  // Get content type from file
  const getContentType = (file) => {
    const ext = file.name.split(".").pop().toLowerCase();
    const contentTypes = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xls: "application/vnd.ms-excel",
      xlsx:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    };
    return contentTypes[ext] || "application/octet-stream";
  };

  // Upload file to Azure using SAS URL from backend
  async function uploadFileToAzure(file) {
    // Step 1: Get upload URL from backend
    const response = await fetch(`${API_BASE_URL}/getUploadUrl`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        fileName: file.name,
        contentType: getContentType(file),
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get upload URL");
    }

    const { uploadUrl } = await response.json();

    // Step 2: Upload file directly to Azure Blob Storage using the SAS URL
    const response2 = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "x-ms-blob-type": "BlockBlob",
        "Content-Type": getContentType(file),
      },
      body: file,
    });

    if (!response2.ok) {
      throw new Error("Failed to upload file to Azure Blob Storage");
    }

    // Return the blob URL without SAS token
    return uploadUrl.split("?")[0];
  }

  const handleContractAUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setContractA(file);
    setContractAUrl(null);
    setErrorA(null);
    setUploadingA(true);

    try {
      const blobUrl = await uploadFileToAzure(file);
      setContractAUrl(blobUrl);
      setUploadingA(false);
    } catch (err) {
      setErrorA("Upload failed. Please try again.");
      setContractA(null);
      setContractAUrl(null);
      setUploadingA(false);
    }
  };

  const handleContractBUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setContractB(file);
    setContractBUrl(null);
    setErrorB(null);
    setUploadingB(true);

    try {
      const blobUrl = await uploadFileToAzure(file);
      setContractBUrl(blobUrl);
      setUploadingB(false);
    } catch (err) {
      setErrorB("Upload failed. Please try again.");
      setContractB(null);
      setContractBUrl(null);
      setUploadingB(false);
    }
  };

  // Compare contracts (show table)
  const handleCompare = async () => {
    if (!contractAUrl || !contractBUrl) {
      alert("Please upload both Contract A and Contract B before comparing.");
      return;
    }
    setComparing(true);
    setShowTable(false);

    // Simulate comparison processing
    setTimeout(() => {
      setComparing(false);
      setShowTable(true);
    }, 1500);
  };

  // Clear all uploads and results
  const handleClear = () => {
    setContractA(null);
    setContractB(null);
    setContractAUrl(null);
    setContractBUrl(null);
    setErrorA(null);
    setErrorB(null);
    setShowTable(false);
    setComparing(false);
    // Reset file inputs
    const inputA = document.getElementById('contractA');
    const inputB = document.getElementById('contractB');
    if (inputA) inputA.value = '';
    if (inputB) inputB.value = '';
  };

  const isCompareEnabled = contractAUrl !== null && contractBUrl !== null;
  const isClearEnabled = contractA !== null || contractB !== null || showTable;

  return (
    <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
      {/* Only two upload boxes for Contract A and Contract B */}
      <div className="mb-6 flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          {/* Contract A upload section */}
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
            <label htmlFor="contractA" className="cursor-pointer block">
              {uploadingA ? (
                <div className="text-sm text-blue-600">
                  <div className="text-3xl mb-2">⏳</div>
                  <div>Uploading...</div>
                </div>
              ) : errorA ? (
                <div className="text-sm text-red-600">
                  <div className="text-3xl mb-2">❌</div>
                  <div>{errorA}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Click to try again
                  </div>
                </div>
              ) : contractA ? (
                <div className="text-sm">
                  <div className="text-3xl mb-2">✅</div>
                  <span className="text-blue-600 font-semibold">
                    {contractA.name}
                  </span>
                  <div className="mt-2">
                    <button
                      className="text-red-500 hover:underline"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContractA(null);
                        setContractAUrl(null);
                        setErrorA(null);
                        // Reset the file input
                        document.getElementById('contractA').value = '';
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
                  <div className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>
        <div className="flex-1">
          {/* Contract B upload section */}
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
            <label htmlFor="contractB" className="cursor-pointer block">
              {uploadingB ? (
                <div className="text-sm text-blue-600">
                  <div className="text-3xl mb-2">⏳</div>
                  <div>Uploading...</div>
                </div>
              ) : errorB ? (
                <div className="text-sm text-red-600">
                  <div className="text-3xl mb-2">❌</div>
                  <div>{errorB}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    Click to try again
                  </div>
                </div>
              ) : contractB ? (
                <div className="text-sm">
                  <div className="text-3xl mb-2">✅</div>
                  <span className="text-blue-600 font-semibold">
                    {contractB.name}
                  </span>
                  <div className="mt-2">
                    <button
                      className="text-red-500 hover:underline"
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setContractB(null);
                        setContractBUrl(null);
                        setErrorB(null);
                        // Reset the file input
                        document.getElementById('contractB').value = '';
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
                  <div className="text-xs text-gray-400 mt-1">
                    PDF, DOC, DOCX, XLS, XLSX
                  </div>
                </div>
              )}
            </label>
          </div>
        </div>
      </div>
      {/* Compare Contracts Button */}
      <div className="mb-6 flex gap-4">
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleCompare}
          disabled={!isCompareEnabled || comparing}
        >
          {comparing ? "Comparing..." : "Compare Contracts"}
        </button>
        
        <button
          className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleClear}
          disabled={!isClearEnabled}
        >
          Clear All
        </button>
      </div>
      {comparing && (
        <div className="animate-pulse text-center py-10 text-gray-400">
          Generating comparison...
        </div>
      )}
      {showTable && (
        <table className="min-w-full text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Clause/Field</th>
              <th className="p-2">Contract A</th>
              <th className="p-2">Contract B</th>
              <th className="p-2">Difference</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-2">Term</td>
              <td className="p-2">12 months</td>
              <td className="p-2">24 months</td>
              <td className="p-2 text-red-600 font-semibold">Mismatch</td>
            </tr>
            <tr>
              <td className="p-2">Jurisdiction</td>
              <td className="p-2">NY</td>
              <td className="p-2">NY</td>
              <td className="p-2 text-green-600 font-semibold">Match</td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
}
