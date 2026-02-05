const express = require('express');
const axios = require('axios');
const path = require('path');
const app = express();

// Enable JSON parsing
app.use(express.json());

// Serve static files from React build
app.use(express.static(path.join(__dirname, 'build')));

// Proxy endpoint - forwards requests to Function App via private endpoint
app.post('/api/vmp_agent', async (req, res) => {
  try {
    console.log('Proxying request to Function App');
    console.log('Event type:', req.body.event_type);
    
    // Forward the request to Function App
    const response = await axios.post(
      'https://fnc-vmp-weu1-d-033-fkhpc3bye5hdd5gp.westeurope-01.azurewebsites.net/api/vmp_agent',
      req.body,
      {
        headers: {
          'Content-Type': 'application/json',
          // Forward Authorization header from frontend
          ...(req.headers.authorization && { 
            'Authorization': req.headers.authorization 
          })
        },
        timeout: 180000 // 180 second timeout for long-running compare operations
      }
    );
    
    console.log('Function App response status:', response.status);
    res.status(response.status).json(response.data);
    
  } catch (error) {
    console.error('Error calling Function App:', error.message);
    
    if (error.response) {
      // Function App returned an error
      console.error('Function App error:', error.response.status, error.response.data);
      res.status(error.response.status).json(error.response.data);
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response from Function App');
      res.status(504).json({ error: 'Gateway timeout - Function App not responding' });
    } else {
      // Something else went wrong
      console.error('Request setup error:', error.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// All other routes serve React app (for client-side routing)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Serving React app from: ${path.join(__dirname, 'build')}`);
});