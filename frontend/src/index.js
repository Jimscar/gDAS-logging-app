import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

// Register custom service worker from public folder
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/service-worker.js").then(
      (reg) => {
        console.log("✅ Service worker registered:", reg);
      },
      (err) => {
        console.error("❌ Service worker registration failed:", err);
      }
    );
  });
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register the service worker to enable PWA features
serviceWorkerRegistration.register();

// Optional: report web vitals
reportWebVitals();
