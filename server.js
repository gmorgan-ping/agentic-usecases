const express = require('express');
const session = require('express-session');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'ping-agentic-demo-secret-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true in production with HTTPS
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Middleware for parsing JSON requests
app.use(express.json());

// Valid access codes (you can expand this array or move to environment variables)
const VALID_ACCESS_CODES = [
  'ping-rocks'
];

// Authentication middleware
const requireAuth = (req, res, next) => {
  if (req.session && req.session.authenticated) {
    return next();
  } else {
    return res.redirect('/login');
  }
};

// Serve static files from public directory (except protected routes)
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/css', express.static(path.join(__dirname, 'public/css')));

// Serve static files from src directory (for CSS, JS, scenarios) - protected
app.use('/src', requireAuth, express.static(path.join(__dirname, 'src')));

// Login page (unprotected)
app.get('/login', (req, res) => {
  // If already authenticated, redirect to main page
  if (req.session && req.session.authenticated) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

// Main page (protected)
app.get('/', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// API endpoint to serve scenarios dynamically (optional - for future enhancements)
app.get('/api/scenarios', (req, res) => {
  const fs = require('fs');
  const scenariosPath = path.join(__dirname, 'src', 'scenarios');

  try {
    // Read the index.json file
    const indexPath = path.join(scenariosPath, 'index.json');
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    res.json(indexData);
  } catch (error) {
    console.error('Error reading scenarios:', error);
    res.status(500).json({ error: 'Failed to load scenarios' });
  }
});

// API endpoint to serve individual scenario files
app.get('/api/scenarios/:scenarioId', (req, res) => {
  const fs = require('fs');
  const scenarioId = req.params.scenarioId;
  const scenarioPath = path.join(__dirname, 'src', 'scenarios', `${scenarioId}.json`);

  try {
    const scenarioData = JSON.parse(fs.readFileSync(scenarioPath, 'utf8'));
    res.json(scenarioData);
  } catch (error) {
    console.error(`Error reading scenario ${scenarioId}:`, error);
    res.status(404).json({ error: 'Scenario not found' });
  }
});

// Login endpoint
app.post('/api/login', (req, res) => {
  const { accessCode } = req.body;

  if (!accessCode) {
    return res.status(400).json({
      success: false,
      message: 'Access code is required'
    });
  }

  const isValid = VALID_ACCESS_CODES.includes(accessCode.trim());

  if (isValid) {
    // Set session as authenticated
    req.session.authenticated = true;
    req.session.loginTime = new Date();

    console.log(`✅ Valid access code used: ${accessCode} at ${new Date().toISOString()}`);
    res.json({
      success: true,
      message: 'Access granted',
      redirectUrl: '/'
    });
  } else {
    console.log(`❌ Invalid access code attempted: ${accessCode} from ${req.ip} at ${new Date().toISOString()}`);
    res.json({
      success: false,
      message: 'Invalid access code'
    });
  }
});

// Logout endpoint
app.post('/api/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Session destruction error:', err);
      return res.status(500).json({ success: false, message: 'Logout failed' });
    }
    res.json({ success: true, redirectUrl: '/login' });
  });
});

// Handle all other routes by serving the main page (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Agentic AI Demo server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} to view the demo`);
});

module.exports = app;