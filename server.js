const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve static files from src directory (for CSS, JS, scenarios)
app.use('/src', express.static(path.join(__dirname, 'src')));

// Route for the main page
app.get('/', (req, res) => {
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

// Handle all other routes by serving the main page (SPA behavior)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Agentic AI Demo server running on port ${PORT}`);
  console.log(`📱 Open http://localhost:${PORT} to view the demo`);
});

module.exports = app;