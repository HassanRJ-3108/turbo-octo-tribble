import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="text-center">
        <p className="text-6xl font-bold text-amber-400 mb-4">404</p>
        <h1 className="text-3xl font-bold mb-2">Page Not Found</h1>
        <p className="text-slate-300 mb-8">The page you're looking for doesn't exist.</p>
        <Link
          href="/"
          className="inline-block bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
