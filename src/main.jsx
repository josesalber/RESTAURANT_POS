import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#4E342E',
            color: '#F5F5DC',
            borderRadius: '8px',
          },
          success: {
            iconTheme: {
              primary: '#4ADE80',
              secondary: '#F5F5DC',
            },
          },
          error: {
            iconTheme: {
              primary: '#F87171',
              secondary: '#F5F5DC',
            },
          },
        }}
      />
  </BrowserRouter>
);
