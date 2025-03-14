import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ChessGame from './components/ChessGame'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ChessGame />
  </StrictMode>,
)
