import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
      <p className="text-8xl font-black bg-gradient-to-r from-brand-500 to-indigo-500 bg-clip-text text-transparent">404</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900 dark:text-white">Page not found</h1>
      <p className="mt-2 text-slate-500 dark:text-slate-400">The page you're looking for doesn't exist.</p>
      <Link to="/" className="btn-primary mt-6"><ArrowLeft size={16} /> Back to Dashboard</Link>
    </div>
  );
}
