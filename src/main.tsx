import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/ErrorBoundary';
import './index.css';

// Intercept unhandled third-party cross-origin script errors and warnings
const originalConsoleError = console.error;
console.error = (...args: unknown[]) => {
  const msg = typeof args[0] === 'string' ? args[0] : '';
  if (
    msg.includes('Cannot listen to the event from the provided iframe') ||
    msg.includes('contentWindow is not available') ||
    msg.includes('tradingview.com')
  ) {
    return;
  }
  originalConsoleError.apply(console, args);
};

window.addEventListener('error', (event) => {
  if (
    event.message === 'Script error.' ||
    !event.filename ||
    event.filename.includes('tradingview.com') ||
    (event.message && event.message.includes('contentWindow'))
  ) {
    // Cross-origin script error from external widget (benign)
    event.preventDefault();
    return true;
  }
});

window.addEventListener('unhandledrejection', (event) => {
  if (event.reason && typeof event.reason === 'string' && event.reason.includes('Script error')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary fallbackTitle="FINAGENT Platform">
      <App />
    </ErrorBoundary>
  </StrictMode>,
);
