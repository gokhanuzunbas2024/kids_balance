console.log('🚀 main.tsx: Starting app initialization...');

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('✅ main.tsx: All imports successful');

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ main.tsx: Root element not found!');
  document.body.innerHTML = '<h1>Error: Root element not found</h1>';
} else {
  console.log('✅ main.tsx: Root element found, rendering...');
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('✅ main.tsx: App rendered successfully');
  } catch (error) {
    console.error('❌ main.tsx: Error rendering app:', error);
    rootElement.innerHTML = `
      <div style="padding: 20px; font-family: sans-serif;">
        <h1>Error Rendering App</h1>
        <p>Check console for details</p>
        <pre>${String(error)}</pre>
      </div>
    `;
  }
}
