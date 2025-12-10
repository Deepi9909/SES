import { useState, useRef, useEffect } from "react";
import { uploadFile, sendChatMessage } from "../../services/api";

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

  const handleFileUpload = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length > 2) {
      alert("Maximum 2 files allowed per session");
      e.target.value = "";
      return;
    }

    // If files already uploaded, create NEW session automatically
    let currentSessionId;
    if (filesUploaded) {
      currentSessionId = Date.now().toString();
      setSessionId(currentSessionId);
      setFilesUploaded(false);
      console.log('Files already uploaded - creating NEW session:', currentSessionId);
      
      // Add system message about new session
      const sessionMessage = {
        id: Date.now(),
        role: "assistant",
        content: "🔄 New session started with new files.",
      };
      setMessages(prev => [...prev, sessionMessage]);
    } else {
      // Generate sessionId if not exists
      currentSessionId = sessionId || Date.now().toString();
      if (!sessionId) {
        setSessionId(currentSessionId);
        console.log('Created new session:', currentSessionId);
      }
    }

    setFiles(selectedFiles);
    e.target.value = "";

    // Upload files with sessionId and "chat" prefix
    setUploadingFiles(true);
    try {
      const uploadPromises = selectedFiles.map((file) => uploadFile(file, currentSessionId, 'chat'));
      const urls = await Promise.all(uploadPromises);
      setFileUrls(urls);
      setFilesUploaded(true);
      console.log('Files uploaded successfully to chat session:', currentSessionId);
    } catch (error) {
      console.error("File upload failed:", error);
      alert("Failed to upload files. Please try again.");
      setFiles([]);
      setFileUrls([]);
    } finally {
      setUploadingFiles(false);
    }
  };

  const removeFile = (idx) => {
    setFiles(files.filter((_, i) => i !== idx));
    setFileUrls(fileUrls.filter((_, i) => i !== idx));
    if (files.length === 1) {
      setFilesUploaded(false);
    }
  };

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

  const handleClear = () => {
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

  return (
    <div className="bg-white rounded-lg shadow p-4 flex flex-col h-[600px]">
      {/* Uploaded files display */}
      {files.length > 0 && (
        <div className="mb-2 flex flex-col gap-1">
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center gap-2 text-sm bg-gray-100 px-3 py-1 rounded"
            >
              <span>{file.name}</span>
              <button
                className="ml-auto text-red-500 hover:underline text-xs"
                onClick={() => removeFile(idx)}
                type="button"
                disabled={uploadingFiles}
              >
                Remove
              </button>
            </div>
          ))}
          {uploadingFiles && (
            <div className="text-xs text-blue-600 px-3 py-1">
              Uploading files...
            </div>
          )}
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
                    ? "bg-blue-100 text-blue-900"
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
          className="flex-1 border rounded px-3 py-2"
          placeholder="Ask anything about your contracts..."
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isSending}
        />
        <button
          type="button"
          className={`bg-blue-600 text-white rounded-full w-10 h-10 flex items-center justify-center text-xl shadow ${
            uploadingFiles
              ? "opacity-50 cursor-not-allowed"
              : "hover:bg-blue-700"
          }`}
          onClick={() => fileInputRef.current.click()}
          disabled={uploadingFiles}
          title={filesUploaded ? "Upload new files (starts new session)" : "Upload files (max 2)"}
        >
          +
        </button>
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: "none" }}
          onChange={handleFileUpload}
          accept=".pdf,.doc,.docx,.xls,.xlsx"
          disabled={uploadingFiles}
          multiple
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={handleSendMessage}
          disabled={isSending || uploadingFiles || !inputMessage.trim()}
        >
          {isSending ? "Sending..." : "Send"}
        </button>
        <button
          className="bg-gray-100 text-blue-700 px-3 py-2 rounded hover:bg-blue-200"
          onClick={handleClear}
          disabled={isSending}
        >
          Clear
        </button>
      </div>
    </div>
  );
}
