import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorFallback } from '@/components/ErrorFallback';
import App from './app';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* HashRouter：单文件 HTML（file:// 双击打开）、dev server、托管部署均可用 */}
    <HashRouter>
      <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App />
      </ErrorBoundary>
    </HashRouter>
  </StrictMode>,
);
