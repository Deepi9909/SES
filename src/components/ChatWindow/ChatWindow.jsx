import { useState, useRef, useEffect } from "react";
import { uploadFile, sendChatMessage, clearSession } from "../../services/api";
import React from "react";

export default function ChatWindow() {
  const [files, setFiles] = useState([]);
  const [fileUrls, setFileUrls] = useState([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: "assistant",
      content: "Welcome! Please upload your contract documents (PDF, DOC, DOCX, XLS, or XLSX format). You can upload up to 2 contracts to compare and analyze. Once uploaded, feel free to ask me questions about your contracts or compare them side-by-side.",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const fileInputRef = useRef();
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Cleanup session on component unmount
  useEffect(() => {
    return () => {
      if (sessionId && filesUploaded) {
        console.log('ChatWindow unmounting, clearing session:', sessionId);
        clearSession(sessionId).catch(err => {
          console.error('Failed to clear session on unmount:', err);
        });
      }
    };
  }, [sessionId, filesUploaded]);

  // Cleanup session on page refresh/close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (sessionId && filesUploaded) {
        console.log('Page unloading, clearing chat session:', sessionId);
        // Use navigator.sendBeacon for reliable cleanup on page unload
        const apiUrl = process.env.REACT_APP_API_URL;
        const token = localStorage.getItem('authToken');
        const data = JSON.stringify({
          unique_id: sessionId,
          event_type: 'clearSession',
        });
        
        // sendBeacon is more reliable for page unload
        const blob = new Blob([data], { type: 'application/json' });
        navigator.sendBeacon(apiUrl, blob);
        
        // Also clear from localStorage
        localStorage.removeItem('activeChatSession');
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [sessionId, filesUploaded]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Create sessionId on first message if not created by file upload
    const currentSessionId = sessionId || Date.now().toString();
    if (!sessionId) {
      setSessionId(currentSessionId);
      console.log('Created new session:', currentSessionId);
    }

    const userMessage = {
      id: Date.now(),
      role: "user",
      content: inputMessage,
    };
    setMessages([...messages, userMessage]);
    setInputMessage("");
    setIsSending(true);

    try {
      const response = await sendChatMessage(inputMessage, currentSessionId, fileUrls);
      const assistantMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: response.llm_response || response.message || response.response || "I received your message.",
      };
      setMessages((prev) => [...prev, assistantMessage]);
      scrollToBottom();
    } catch (error) {
      console.error("Failed to send message:", error);
      const errorMessage = {
        id: Date.now() + 1,
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  const handleClear = async () => {
    // Clear session data if session exists
    if (sessionId) {
      console.log('Clearing session data for session:', sessionId);
      try {
        await clearSession(sessionId);
        localStorage.removeItem('activeChatSession');
        console.log('Session data cleared successfully');
      } catch (error) {
        console.error('Failed to clear session data:', error);
        // Continue with clearing even if deletion fails
      }
    }
    
    setMessages([
      {
        id: 1,
        role: "assistant",
        content: "Welcome! Please upload your contract documents (PDF, DOC, DOCX, XLS, or XLSX format). You can upload up to 2 contracts to compare and analyze. Once uploaded, feel free to ask me questions about your contracts or compare them side-by-side.",
      },
    ]);
    setFiles([]);
    setFileUrls([]);
    setInputMessage("");
    setSessionId(null);
    setFilesUploaded(false);
    console.log('Session cleared - ready for new session');
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const [isDragging, setIsDragging] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  const [uploadStatus, setUploadStatus] = React.useState('default'); // default, uploading, processing, complete, error
  const [uploadError, setUploadError] = React.useState('');
  const [uploadStartTime, setUploadStartTime] = React.useState(null);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragging(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    processFiles(droppedFiles);
  };

  const processFiles = async (selectedFiles) => {
    if (selectedFiles.length === 0) return;

    if (selectedFiles.length > 2) {
      setUploadStatus('error');
      setUploadError('Maximum 2 files allowed');
      return;
    }

    const validExtensions = ['.pdf', '.doc', '.docx', '.xls', '.xlsx'];
    const invalidFiles = selectedFiles.filter(file => {
      const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
      return !validExtensions.includes(ext);
    });

    if (invalidFiles.length > 0) {
      setUploadStatus('error');
      setUploadError('Invalid file type. Only PDF, DOC, DOCX, XLS, XLSX allowed');
      return;
    }

    setUploadStatus('uploading');
    setUploadProgress(0);
    setUploadError('');
    setUploadStartTime(Date.now());
    setFiles(selectedFiles);

    let currentSessionId = sessionId;
    let oldSessionId = null;
    
    if (!currentSessionId || filesUploaded) {
      // Store old session ID before creating new one
      if (sessionId && filesUploaded) {
        oldSessionId = sessionId;
      }
      
      currentSessionId = Date.now().toString();
      setSessionId(currentSessionId);
      // Store session ID in localStorage for cleanup on logout
      localStorage.setItem('activeChatSession', currentSessionId);
      console.log('Starting new session:', currentSessionId);
      
      // Clear old session in background if exists
      if (oldSessionId) {
        console.log('Clearing old session:', oldSessionId);
        clearSession(oldSessionId).catch(err => {
          console.error('Failed to clear old session:', err);
        });
      }
      
      setMessages([
        {
          id: 1,
          role: "assistant",
          content: "Welcome! Please upload your contract documents (PDF, DOC, DOCX, XLS, or XLSX format). You can upload up to 2 contracts to compare and analyze. Once uploaded, feel free to ask me questions about your contracts or compare them side-by-side.",
        },
      ]);
      setFileUrls([]);
      setFilesUploaded(false);
    }

    try {
      const uploadedUrls = [];
      for (let i = 0; i < selectedFiles.length; i++) {
        const file = selectedFiles[i];
        setUploadProgress(Math.round(((i + 0.5) / selectedFiles.length) * 50));
        const result = await uploadFile(file, currentSessionId, 'chat');
        uploadedUrls.push(result.file_url);
        setUploadProgress(Math.round(((i + 1) / selectedFiles.length) * 50));
      }

      setUploadStatus('processing');
      setUploadProgress(75);
      
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setFileUrls(uploadedUrls);
      setFilesUploaded(true);
      setUploadProgress(100);
      setUploadStatus('complete');
      scrollToBottom();
    } catch (error) {
      console.error("Upload failed:", error);
      setUploadStatus('error');
      setUploadError(error.message || 'Upload failed. Please try again.');
      setFiles([]);
    }
  };

  const handleFileInputChange = (e) => {
    const selectedFiles = Array.from(e.target.files);
    processFiles(selectedFiles);
    e.target.value = '';
  };

  const handleRetry = () => {
    setUploadStatus('default');
    setUploadProgress(0);
    setUploadError('');
    setFiles([]);
  };

  const handleNewUpload = async () => {
    // Clear previous session data if exists
    if (sessionId && filesUploaded) {
      console.log('Clearing previous session:', sessionId);
      try {
        await clearSession(sessionId);
        console.log('Previous session cleared successfully');
      } catch (error) {
        console.error('Failed to clear previous session:', error);
        // Continue with new upload even if deletion fails
      }
    }
    
    setUploadStatus('default');
    setUploadProgress(0);
    setUploadError('');
    setFiles([]);
    setSessionId(null);
    setFilesUploaded(false);
  };

  return (
    <div className="bg-white rounded-lg shadow flex flex-col h-[600px]">
      <div className="flex flex-1 overflow-hidden">
        {/* Main Chat Area - 60% */}
        <div className="flex-1 flex flex-col p-4" style={{ width: '60%' }}>
          {/* Uploaded files display - compact */}
          {files.length > 0 && uploadStatus === 'complete' && (
            <div className="mb-2 flex gap-2">
              {files.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 px-2 py-1 rounded"
                >
                  <svg className="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-green-700">{file.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto mb-4">
            {/* Message thread */}
            <div className="flex flex-col gap-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-lg max-w-[80%] whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-indigo-100 text-indigo-900"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
              {isSending && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg">
                    <span className="animate-pulse">Thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex gap-2">
            <input
              className="flex-1 border rounded px-3 py-2 text-sm"
              placeholder="Ask anything about your contracts..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isSending}
            />
            <button
              className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              onClick={handleSendMessage}
              disabled={isSending || uploadingFiles || !inputMessage.trim()}
            >
              {isSending ? "Sending..." : "Send"}
            </button>
            <button
              className="bg-gray-100 text-indigo-700 px-3 py-2 rounded hover:bg-indigo-50 text-sm"
              onClick={handleClear}
              disabled={isSending}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Preview Sidebar - 40% */}
        <div className="border-l bg-gray-50 flex flex-col" style={{ width: '40%' }}>
          <div className="p-4 border-b bg-white">
            <h3 className="text-sm font-semibold text-gray-800">Document Upload</h3>
          </div>

          <div className="flex-1 p-4 flex flex-col">
            {/* Default State */}
            {uploadStatus === 'default' && (
              <>
                <div
                  className={`border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center transition-all ${
                    isDragging
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50'
                  }`}
                  onDragEnter={handleDragEnter}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm font-medium text-gray-700 mb-1">
                    Drag and drop files here
                  </p>
                  <p className="text-xs text-gray-500 mb-4">
                    or click to browse
                  </p>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                  >
                    Select Files
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    onChange={handleFileInputChange}
                    accept=".pdf,.doc,.docx,.xls,.xlsx"
                    multiple
                  />
                  <p className="text-xs text-gray-400 mt-4">
                    Supported: PDF, DOC, DOCX, XLS, XLSX<br />
                    Maximum 2 files
                  </p>
                </div>
              </>
            )}

            {/* Uploading State */}
            {uploadStatus === 'uploading' && (
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <svg className="w-12 h-12 text-indigo-600 mb-3 animate-pulse" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-gray-800 mb-1">Uploading...</p>
                <p className="text-xs text-gray-500 mb-4">
                  {files.map(f => f.name).join(', ')}
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-indigo-600 font-medium">{uploadProgress}%</p>
              </div>
            )}

            {/* Processing State */}
            {uploadStatus === 'processing' && (
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <svg className="w-12 h-12 text-indigo-600 mb-3 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <p className="text-sm font-medium text-gray-800 mb-1">Processing...</p>
                <p className="text-xs text-gray-500 mb-4">
                  Analyzing your documents
                </p>
                <div className="w-full bg-gray-200 rounded-full h-1.5 mb-2">
                  <div
                    className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-indigo-600 font-medium">{uploadProgress}%</p>
              </div>
            )}

            {/* Complete State */}
            {uploadStatus === 'complete' && (
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">Upload Complete!</p>
                <p className="text-xs text-gray-500 mb-4">
                  {files.length} file{files.length > 1 ? 's' : ''} ready for analysis
                </p>
                <div className="w-full space-y-2 mb-4">
                  {files.map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs bg-green-50 border border-green-200 px-3 py-2 rounded">
                      <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      <span className="text-green-700 flex-1">{file.name}</span>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleNewUpload}
                  className="bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700 w-full"
                >
                  Upload New Files
                </button>
              </div>
            )}

            {/* Error State */}
            {uploadStatus === 'error' && (
              <div className="bg-white rounded-lg p-6 flex flex-col items-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-3">
                  <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-gray-800 mb-1">Upload Failed</p>
                <p className="text-xs text-red-600 mb-4 text-center">
                  {uploadError}
                </p>
                <div className="flex gap-2 w-full">
                  <button
                    onClick={handleRetry}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded text-sm hover:bg-indigo-700"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleNewUpload}
                    className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
