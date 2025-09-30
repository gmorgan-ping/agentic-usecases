# Agentic AI Interactive Demo

An interactive web demo showcasing AI agent delegation flows with Ping Identity, featuring secure authentication, consent management, policy decisions, and API access patterns.

## 🚀 Quick Start

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Start the server:**
   ```bash
   npm start
   ```

3. **Open your browser:**
   ```
   http://localhost:3000
   ```

### Using a different port:
```bash
PORT=3001 npm start
```

## 📦 Deployment

### Vercel Deployment

This app is configured for easy deployment on Vercel:

1. **Install Vercel CLI (if not already installed):**
   ```bash
   npm i -g vercel
   ```

2. **Deploy to Vercel:**
   ```bash
   vercel
   ```

3. **For production deployment:**
   ```bash
   vercel --prod
   ```

### Other Platforms

The app can also be deployed on:
- **Heroku**: Just push to a Heroku app
- **Railway**: Connect your GitHub repo
- **Render**: Deploy from GitHub
- **Netlify**: Use the build command `npm run build` (though this app serves static files)

## 🏗️ Project Structure

```
├── server.js              # Express server
├── package.json           # Node.js dependencies and scripts
├── vercel.json            # Vercel deployment configuration
├── public/
│   └── index.html         # Main HTML file
├── src/
│   ├── app.js             # Main application logic
│   ├── styles.css         # Custom CSS styles
│   └── scenarios/         # JSON scenario data files
│       ├── index.json     # Scenario registry
│       ├── claims.json    # Insurance claims scenario
│       ├── bank-transfer.json  # Banking transfer scenario
│       ├── pii-update.json     # PII update scenario
│       └── healthcare.json     # Healthcare scenario
└── README.md              # This file
```

## 🎯 Features

- **Interactive Chat Flow**: Step-by-step conversation simulation
- **Sequence Diagrams**: Complete actor-based swimlane visualizations
- **Glossary Integration**: Clickable terms with definitions
- **Multiple Scenarios**: Various industry use cases
- **Responsive Design**: Works on desktop and mobile
- **Sticky Navigation**: Easy scenario navigation

## 🔧 Technology Stack

- **Backend**: Node.js with Express
- **Frontend**: Vanilla JavaScript, Bootstrap 5
- **Deployment**: Vercel-ready configuration
- **Data**: JSON-based scenario definitions

## 📱 Usage

1. **Select a Scenario**: Choose from the dropdown menu
2. **Navigation**: Use Back/Next buttons or arrow keys
3. **View Modes**: Toggle between Chatbot and Sequence views
4. **Glossary**: Click the glossary button or highlighted terms
5. **Mobile**: Fully responsive on all device sizes

## 🎨 Customization

### Adding New Scenarios

1. Create a new JSON file in `src/scenarios/`
2. Add the scenario to `src/scenarios/index.json`
3. Follow the existing data structure

### Styling

Modify `src/styles.css` for custom styling. The app uses Bootstrap 5 as the base framework.

## 🐛 Troubleshooting

- **Port conflicts**: Use `PORT=3001 npm start` to run on a different port
- **File paths**: Ensure all static files are served correctly by Express
- **Vercel deployment**: Check `vercel.json` configuration for routing

## 📄 License

MIT License - feel free to use and modify as needed.