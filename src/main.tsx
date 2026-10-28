import '@fontsource-variable/manrope';
import '@fontsource-variable/geist';
import '@fontsource-variable/inter';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Google Maps Platform Quota Defense & Global Error Listeners
// Source: Google Maps Platform Code Assist
(window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
  window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
};

const origError = console.error;
console.error = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  if (
    msg.includes('WebSocket') ||
    msg.includes('failed to connect to websocket') ||
    msg.includes('WebChannelConnection')
  ) {
    return;
  }
  origError.apply(console, args);
  if (msg.includes('OverQuotaMapError') || msg.includes('QuotaExceededError')) {
    window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
  }
};

const origWarn = console.warn;
console.warn = (...args: unknown[]) => {
  const msg = args.map((a) => String(a)).join(' ');
  if (
    msg.includes("RPC 'Listen' stream") ||
    msg.includes('WebChannelConnection') ||
    msg.includes('transport errored')
  ) {
    return;
  }
  origWarn.apply(console, args);
};

createRoot(document.getElementById('root')!).render(<App />);

