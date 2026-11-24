import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/fonts.css';
import './styles/app.css';
import { registerServiceWorker } from './pwa/register';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

registerServiceWorker();

// Test hook for automated tests (only with ?e2e in the URL, like the one in Play.tsx).
if (typeof window !== 'undefined' && window.location.search.includes('e2e')) {
  import('./store/game').then(({ useGame }) => ((window as unknown as { __store: typeof useGame }).__store = useGame));
}
