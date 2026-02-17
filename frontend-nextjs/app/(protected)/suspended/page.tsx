"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";

export default function SuspendedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="bg-red-900/30 border border-red-700 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-400" />
        </div>

        <h1 className="text-3xl font-bold mb-2">Account Suspended</h1>
        <p className="text-slate-300 mb-8">
          Your account has been suspended. Please contact our support team for more information.
        </p>

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
