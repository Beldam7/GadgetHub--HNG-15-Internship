import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-20 text-center">
      <h1 className="text-6xl font-bold text-slate-900">404</h1>
      <p className="text-xl text-slate-500 mt-2">Page not found</p>
      <p className="text-sm text-slate-400 mt-1">The page you're looking for doesn't exist.</p>
      <Link to="/" className="mt-6 inline-block rounded-lg bg-slate-900 px-6 py-3 text-sm font-semibold text-white hover:bg-slate-800">
        Go Home
      </Link>
    </div>
  );
}
