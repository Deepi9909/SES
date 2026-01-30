// API Base URL - loaded from environment variable
const API_BASE_URL = 'https://fnc-vmp-weu1-p-001-f7bmd9cze3had9hv.westeurope-01.azurewebsites.net/api/vmp_func_app';




if (!API_BASE_URL) {
  console.error('REACT_APP_API_URL_DEV is not set in environment variables');
}

// Helper function to build API endpoint URL
function buildUrl(endpoint) {
  // Azure Function uses event_type parameter for routing, not URL paths
  // Always return just the base URL
  return API_BASE_URL;
}

// Helper function to get authentication headers
function getAuthHeaders() {
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
    console.log('=== TOKEN DEBUG ===');
    console.log('Full token from localStorage:', token);
    console.log('Token length:', token.length);
    console.log('Token parts (should be 3):', token.split('.').length);
    console.log('Authorization header:', headers['Authorization']);
    console.log('Header length:', headers['Authorization'].length);
  } else {
    console.warn('No auth token found in localStorage');
  }
  
  return headers;
}

// Helper function to handle authentication errors
function handleAuthError(response) {
  if (response.status === 401) {
    // Token expired or invalid - clear auth and redirect to login
    localStorage.removeItem('authToken');
    localStorage.removeItem('userEmail');
    window.location.href = '/login';
  }
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
    headers: getAuthHeaders(),
    body: JSON.stringify({
      fileName: fullFileName,
      contentType,
      event_type: 'getUploadUrl',
    }),
  });

  console.log('Response status:', response.status);
  
  if (!response.ok) {
    handleAuthError(response);
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
    headers: getAuthHeaders(),
    body: JSON.stringify({
      message,
      unique_id: sessionId,
      fileUrls,
      event_type: 'contractQA',
    }),
  });

  console.log('Chat response status:', response.status);

  if (!response.ok) {
    handleAuthError(response);
    const errorText = await response.text();
    console.error('Chat error response:', errorText);
    throw new Error('Failed to send chat message');
  }

  const data = await response.json();
  console.log('Chat response data:', data);
  return data;
}

/**
 * Clear session data including blob storage files
 */
export async function clearSession(uniqueId) {
  console.log('Clearing session data for unique_id:', uniqueId);
  
  const response = await fetch(buildUrl('/clearSession'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      unique_id: uniqueId,
      event_type: 'clearSession',
    }),
  });

  console.log('Clear session response status:', response.status);

  if (!response.ok) {
    handleAuthError(response);
    const errorText = await response.text();
    console.error('Clear session error response:', errorText);
    // Don't throw error - deletion is best effort
    console.warn('Failed to clear session, but continuing...');
    return { success: false };
  }

  const data = await response.json();
  console.log('Clear session response data:', data);
  return data;
}

/**
 * Compare two contracts using unique_id
 */
export async function compareContracts(uniqueId) {
  console.log('Calling compareContracts API with unique_id:', uniqueId);
  
  const response = await fetch(buildUrl('/compareContracts'), {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify({
      unique_id: uniqueId,
      event_type: 'compareContracts',
    }),
  });

  console.log('Compare response status:', response.status);

  if (!response.ok) {
    handleAuthError(response);
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
    headers: getAuthHeaders(),
    body: JSON.stringify({
      session_id: sessionId,
      event_type: 'getChatHistory',
    }),
  });

  if (!response.ok) {
    handleAuthError(response);
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
    headers: getAuthHeaders(),
    body: JSON.stringify({
      ...comparisonData,
      event_type: 'exportPDF',
    }),
  });

  if (!response.ok) {
    handleAuthError(response);
    throw new Error('Failed to export PDF');
  }

  // Return blob for download
  return response.blob();
}

/**
 * Export comparison results as CSV
 */
export function exportComparisonCSV(comparisonData) {
  // Generate CSV directly in frontend from comparison data
  if (!comparisonData || !comparisonData.comparison_markdown) {
    throw new Error('No comparison data available');
  }

  const markdown = comparisonData.comparison_markdown;
  let csvContent = '';

  // Extract tables from markdown
  const lines = markdown.split('\n');
  let currentTable = [];
  let tableCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Check for table headers
    if (line.includes('**📄 Table 1') || line.includes('**📊 Table 2')) {
      // Save previous table if exists
      if (currentTable.length > 0) {
        if (tableCount > 0) csvContent += '\n\n';
        csvContent += currentTable.join('\n');
        tableCount++;
      }
      currentTable = [];
      
      // Add table title
      const title = line.includes('📄') ? 'Clause-Level Comparison' : 'Product & Unit Price Comparison';
      currentTable.push(title);
      continue;
    }

    // Process table rows
    if (line.startsWith('|')) {
      // Convert markdown table row to CSV
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
      
      // Skip separator lines (contains only dashes)
      if (cells.every(cell => /^[-:]+$/.test(cell))) {
        continue;
      }
      
      // Escape cells with commas or quotes
      const csvCells = cells.map(cell => {
        if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
          return `"${cell.replace(/"/g, '""')}"`;
        }
        return cell;
      });
      
      currentTable.push(csvCells.join(','));
    }
  }

  // Add last table
  if (currentTable.length > 0) {
    if (tableCount > 0) csvContent += '\n\n';
    csvContent += currentTable.join('\n');
  }

  // Add summary if exists
  if (comparisonData.summary_part) {
    csvContent += '\n\n\nSummary\n';
    csvContent += `"${comparisonData.summary_part.replace(/"/g, '""')}"`;
  }

  // Create blob and return
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  return blob;
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
