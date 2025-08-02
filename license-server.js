// license-server.js - Simple Express server for testing
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Mock license database
const validLicenses = {
  'WC-2025-A7K9M-3X8F': {
    status: 'active',
    max_activations: 1,
    activations: []
  },
  'WC-2025-B2N5P-7Y1R': {
    status: 'active', 
    max_activations: 1,
    activations: []
  }
};

// Verify license endpoint
app.post('/verify', (req, res) => {
  const { license_key, machine_id, app_version } = req.body;
  
  console.log('License verification request:', { license_key, machine_id });
  
  const license = validLicenses[license_key];
  
  if (!license) {
    return res.json({ 
      success: false, 
      message: 'Invalid license key' 
    });
  }
  
  if (license.status !== 'active') {
    return res.json({ 
      success: false, 
      message: 'License is not active' 
    });
  }
  
  // Check if machine is already activated
  const existingActivation = license.activations.find(a => a.machine_id === machine_id);
  
  if (existingActivation) {
    // Machine already activated - valid
    return res.json({ 
      success: true, 
      message: 'License verified successfully' 
    });
  }
  
  // Check activation limit
  if (license.activations.length >= license.max_activations) {
    return res.json({ 
      success: false, 
      message: 'License activation limit exceeded' 
    });
  }
  
  // Add new activation
  license.activations.push({
    machine_id,
    activated_at: new Date().toISOString(),
    app_version
  });
  
  console.log('License activated for machine:', machine_id);
  
  res.json({ 
    success: true, 
    message: 'License activated successfully' 
  });
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 License server running on port ${PORT}`);
  console.log(`📝 Valid test licenses:`);
  Object.keys(validLicenses).forEach(key => {
    console.log(`   - ${key}`);
  });
});