import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/tokens/z-index.css'
import './index.css'
import App from './App.jsx'
import { AuthBootstrapProvider } from './contexts/AuthBootstrapContext.jsx'
import { NotificationProvider } from './contexts/NotificationContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthBootstrapProvider>
      <NotificationProvider>
        <App />
      </NotificationProvider>
    </AuthBootstrapProvider>
  </StrictMode>,
)
