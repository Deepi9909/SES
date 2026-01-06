/**
 * Network Logger - Intercepts and logs all network requests
 * This helps debug OAuth flows and API calls
 */

export function setupNetworkLogging() {
  // Store original fetch
  const originalFetch = window.fetch;
  
  // Override fetch to log all requests
  window.fetch = async function(...args) {
    const [url, options = {}] = args;
    
    console.log('========================================');
    console.log('🌐 NETWORK REQUEST (FETCH)');
    console.log('========================================');
    console.log('URL:', url);
    console.log('Method:', options.method || 'GET');
    console.log('Headers:', options.headers);
    console.log('Body:', options.body);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================');
    
    try {
      const response = await originalFetch.apply(this, args);
      
      // Clone the response so we can read it
      const clonedResponse = response.clone();
      
      console.log('========================================');
      console.log('✅ NETWORK RESPONSE (FETCH)');
      console.log('========================================');
      console.log('URL:', url);
      console.log('Status:', response.status, response.statusText);
      console.log('Headers:', Object.fromEntries(response.headers.entries()));
      
      // Try to read the body (may fail for some responses)
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await clonedResponse.json();
          console.log('Response Body (JSON):', data);
        } else {
          const text = await clonedResponse.text();
          console.log('Response Body (Text):', text.substring(0, 500));
        }
      } catch (e) {
        console.log('Could not read response body:', e.message);
      }
      
      console.log('========================================');
      
      return response;
    } catch (error) {
      console.error('========================================');
      console.error('❌ NETWORK ERROR (FETCH)');
      console.error('========================================');
      console.error('URL:', url);
      console.error('Error:', error);
      console.error('========================================');
      throw error;
    }
  };
  
  // Also log XMLHttpRequest (some libraries still use this)
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...rest) {
    this._method = method;
    this._url = url;
    return originalXHROpen.apply(this, [method, url, ...rest]);
  };
  
  XMLHttpRequest.prototype.send = function(body) {
    console.log('========================================');
    console.log('🌐 NETWORK REQUEST (XHR)');
    console.log('========================================');
    console.log('URL:', this._url);
    console.log('Method:', this._method);
    console.log('Body:', body);
    console.log('Timestamp:', new Date().toISOString());
    console.log('========================================');
    
    this.addEventListener('load', function() {
      console.log('========================================');
      console.log('✅ NETWORK RESPONSE (XHR)');
      console.log('========================================');
      console.log('URL:', this._url);
      console.log('Status:', this.status, this.statusText);
      console.log('Response:', this.responseText.substring(0, 500));
      console.log('========================================');
    });
    
    this.addEventListener('error', function() {
      console.error('========================================');
      console.error('❌ NETWORK ERROR (XHR)');
      console.error('========================================');
      console.error('URL:', this._url);
      console.error('========================================');
    });
    
    return originalXHRSend.apply(this, arguments);
  };
  
  console.log('✅ Network logging enabled!');
}
