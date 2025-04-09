import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Initialize the widget after a short delay to ensure our styles are applied
setTimeout(() => {
  const container = document.getElementById('elevenlabs-widget-container');
  if (container) {
    container.innerHTML = `
      <elevenlabs-convai 
        agent-id="45LtKJ0iV5Sc2p8MCKg3"
        button-text="Chat with AI"
        greeting-text="Need help?"
      ></elevenlabs-convai>
    `;
  }
}, 100);
