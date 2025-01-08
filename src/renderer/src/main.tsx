import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

if (typeof window !== 'undefined') {
  createRoot(document.getElementById('root')!).render(
      <App />
  );
}
