// ════════════════════════════════════════════════════════════════════════════
// Standalone Spanbix entry point (VITE_BUILD_TARGET=spanbix).
// ────────────────────────────────────────────────────────────────────────────
// Bootstraps the Spanbix-only React tree with the minimum providers needed:
//   - BrowserRouter           — client-side routing
//   - ThemeProvider           — light/dark CSS class management
//   - Toaster                 — react-hot-toast for form-success / error UX
//
// Deliberately omitted vs. the full Mavro Console entry (`main.jsx`):
//   - AuthProvider            — Spanbix is public-only; no admin auth state
//   - TenantProvider          — public site doesn't need /api/websites listing
//   - any admin-side context  — keeps the public bundle lean
//
// Net effect: a Vercel deploy of this entry pulls in zero admin chunks.
// React.lazy boundaries elsewhere are unused here because SpanbixApp only
// references Spanbix pages directly.
// ════════════════════════════════════════════════════════════════════════════

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import SpanbixApp from '../SpanbixApp';
import { ThemeProvider } from '../context/ThemeContext';
import '../index.css';
import '../styles/spanbix-redesign.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <SpanbixApp />
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3000,
            className:
              '!bg-white dark:!bg-slate-800 !text-slate-900 dark:!text-slate-100 !shadow-lg',
          }}
        />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);
