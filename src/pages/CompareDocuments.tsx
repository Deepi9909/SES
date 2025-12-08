import React, { useState } from 'react';
import axios from 'axios';

interface FileState {
  fileName: string | null;
  fileUrl: string | null;
  isUploading: boolean;
  error: string | null;
}

export const CompareDocuments: React.FC = () => {
  const [contractA, setContractA] = useState<FileState>({
    fileName: null,
    fileUrl: null,
    isUploading: false,
    error: null,
  });

  const [contractB, setContractB] = useState<FileState>({
    fileName: null,
    fileUrl: null,
    isUploading: false,
    error: null,
  });

  const isCompareEnabled = contractA.fileUrl !== null && contractB.fileUrl !== null;

  const handleFileUpload = async (file: File, contractType: 'A' | 'B') => {
    const setContract = contractType === 'A' ? setContractA : setContractB;

    setContract({
      fileName: file.name,
      fileUrl: null,
      isUploading: true,
      error: null,
    });

    try {
      const formData = new FormData();
      formData.append('filename', file.name);
      formData.append('file', file);

      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setContract({
        fileName: file.name,
        fileUrl: response.data.fileUrl,
        isUploading: false,
        error: null,
      });
    } catch (error) {
      setContract({
        fileName: null,
        fileUrl: null,
        isUploading: false,
        error: 'Upload failed. Please try again.',
      });
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, contractType: 'A' | 'B') => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileUpload(file, contractType);
    }
  };

  const handleCompare = () => {
    if (isCompareEnabled) {
      // Implement comparison logic here
      console.log('Comparing:', contractA.fileUrl, contractB.fileUrl);
    }
  };

  const renderUploadZone = (contract: FileState, contractType: 'A' | 'B') => (
    <div className="upload-zone">
      <label className="upload-label">
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => handleFileChange(e, contractType)}
          disabled={contract.isUploading}
          className="file-input"
        />
        <div className="upload-content">
          {contract.isUploading ? (
            <div className="loading-indicator">Uploading...</div>
          ) : contract.error ? (
            <div className="error-message">{contract.error}</div>
          ) : contract.fileName ? (
            <div className="file-name">{contract.fileName}</div>
          ) : (
            <div className="upload-placeholder">
              Click to upload Contract {contractType}
            </div>
          )}
        </div>
      </label>
    </div>
  );

  return (
    <div className="compare-documents-page">
      <h1>Compare Documents</h1>
      
      <div className="upload-zones-container">
        <div className="upload-section">
          <h2>Contract A</h2>
          {renderUploadZone(contractA, 'A')}
        </div>

        <div className="upload-section">
          <h2>Contract B</h2>
          {renderUploadZone(contractB, 'B')}
        </div>
      </div>

      <button
        className="compare-button"
        onClick={handleCompare}
        disabled={!isCompareEnabled}
      >
        Compare Contracts
      </button>
    </div>
  );
};
