// src/main.tsx
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App'; // Ensure no .tsx extension
import './index.css';
import { AppProvider } from './contexts/AppContext'; // Ensure no .tsx extension

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

createRoot(rootElement).render(
  <React.StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </React.StrictMode>
);
