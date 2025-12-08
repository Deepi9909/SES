// API Base URL - update this to your backend URL
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// Helper function to build API endpoint URL
function buildUrl(endpoint) {
  // If API_BASE_URL already contains query params (Azure Function with code), 
  // just return the base URL since routing is handled by event_type parameter
  if (API_BASE_URL.includes('?')) {
    return API_BASE_URL;
  }
  // Otherwise, append the endpoint path normally (for local development)
  return `${API_BASE_URL}${endpoint}`;
}



/**
 * Login user
 */
export async function loginUser(email, password) {
  console.log('Logging in user:', email);
  
  const response = await fetch(buildUrl('/login'), {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      email,
      password,
      event_type: 'login',
    }),
  });

  console.log('Login response status:', response.status);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Invalid credentials');
  }

  const data = await response.json();
  console.log('Login successful');
  return data; // Expected: { token, user: { email, ... } }
}

/**
 * Get upload URL for a file from the backend
 */
export async function getUploadUrl(fileName, contentType, uniqueId = null, pathPrefix = '') {
  // If uniqueId is provided, prepend it to the fileName with optional prefix
  let fullFileName;
  if (uniqueId) {
    fullFileName = pathPrefix ? `${pathPrefix}/${uniqueId}/${fileName}` : `${uniqueId}/${fileName}`;
  } else {
    fullFileName = fileName;
  }
  
  console.log('Making API call to:', buildUrl('/getUploadUrl'));
  console.log('Payload:', { fileName: fullFileName, contentType });
  
  const response = await fetch(buildUrl('/getUploadUrl'), {
    method: 'POST',
    mode: 'cors',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    body: JSON.stringify({
      fileName: fullFileName,
      contentType,
      event_type: 'getUploadUrl',
    }),
  });

  console.log('Response status:', response.status);
  
  if (!response.ok) {
    const errorText = await response.text();
    console.error('Error response:', errorText);
    throw new Error('Failed to get upload URL');
  }

  const data = await response.json();
  console.log('Response data:', data);
  return data;
}

/**
 * Upload file directly to Azure Blob Storage using SAS URL
 */
export async function uploadToAzure(uploadUrl, file, contentType) {
  const response = await fetch(uploadUrl, {
    method: 'PUT',
    headers: {
      'x-ms-blob-type': 'BlockBlob',
      'Content-Type': contentType,
    },
    body: file,
  });

  if (!response.ok) {
    throw new Error('Failed to upload file to Azure Blob Storage');
  }

  // Return the blob URL without SAS token
  return uploadUrl.split('?')[0];
}

/**
 * Complete file upload process (get URL and upload)
 */
export async function uploadFile(file, uniqueId = null, pathPrefix = '') {
  console.log('uploadFile called with:', file.name, 'uniqueId:', uniqueId, 'pathPrefix:', pathPrefix);
  const contentType = getContentType(file);
  console.log('Content type:', contentType);
  console.log('Calling getUploadUrl with:', { fileName: file.name, contentType, uniqueId, pathPrefix });
  const { uploadUrl } = await getUploadUrl(file.name, contentType, uniqueId, pathPrefix);
  console.log('Received uploadUrl:', uploadUrl);
  const blobUrl = await uploadToAzure(uploadUrl, file, contentType);
  console.log('Upload complete, blob URL:', blobUrl);
  return blobUrl;
}

/**
 * Send a chat message to the backend
 */
export async function sendChatMessage(message, sessionId, fileUrls = []) {
  console.log('Sending chat message:', { message, sessionId, fileUrls });
  
  const response = await fetch(buildUrl('/contractQA'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      unique_id: sessionId,
      fileUrls,
      event_type: 'contractQA',
    }),
  });

  console.log('Chat response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Chat error response:', errorText);
    throw new Error('Failed to send chat message');
  }

  const data = await response.json();
  console.log('Chat response data:', data);
  return data;
}

/**
 * Compare two contracts using unique_id
 */
export async function compareContracts(uniqueId) {
  console.log('Calling compareContracts API with unique_id:', uniqueId);
  
  const response = await fetch(buildUrl('/compareContracts'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      unique_id: uniqueId,
      event_type: 'compareContracts',
    }),
  });

  console.log('Compare response status:', response.status);

  if (!response.ok) {
    const errorText = await response.text();
    console.error('Compare error response:', errorText);
    throw new Error('Failed to compare contracts');
  }

  const data = await response.json();
  console.log('Compare response data:', data);
  return data;
}

/**
 * Get chat history
 */
export async function getChatHistory(sessionId) {
  const response = await fetch(buildUrl(`/chat/history/${sessionId}`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      session_id: sessionId,
      event_type: 'getChatHistory',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to get chat history');
  }

  return response.json();
}

/**
 * Export comparison results as PDF
 */
export async function exportComparisonPDF(comparisonData) {
  const response = await fetch(buildUrl('/export/pdf'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...comparisonData,
      event_type: 'exportPDF',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to export PDF');
  }

  // Return blob for download
  return response.blob();
}

/**
 * Export comparison results as CSV
 */
export async function exportComparisonCSV(comparisonData) {
  const response = await fetch(buildUrl('/export/csv'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      ...comparisonData,
      event_type: 'exportCSV',
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to export CSV');
  }

  // Return blob for download
  return response.blob();
}

/**
 * Helper function to get content type from file
 */
export function getContentType(file) {
  const ext = file.name.split('.').pop().toLowerCase();
  const contentTypes = {
    pdf: 'application/pdf',
    doc: 'application/msword',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };
  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Helper function to download a blob as a file
 */
export function downloadBlob(blob, filename) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}
