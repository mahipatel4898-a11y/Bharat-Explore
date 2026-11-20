import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Toaster } from 'react-hot-toast'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
    <Toaster position="top-right" toastOptions={{
      style: { background: '#1e1e2e', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' },
      success: { iconTheme: { primary: '#FF9933', secondary: '#fff' } },
    }} />
  </React.StrictMode>,
)
