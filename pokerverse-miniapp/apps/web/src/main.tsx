import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { silencePixiCacheWarnings } from './utils/silencePixiWarnings'
import App from './Simple2DApp'

// PixiJS tekrar-yükleme sırasında oluşan Cache duplicate key uyarılarını sustur
silencePixiCacheWarnings()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
