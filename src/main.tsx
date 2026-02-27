import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import TYPTOAppWeb3 from './TYPTOAppWeb3'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TYPTOAppWeb3 />
  </StrictMode>,
)