"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";

export default function OnboardingRejectedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="bg-red-400/20 border border-red-400/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Application Rejected</h1>
        <p className="text-slate-300 mb-8">
          Unfortunately, your application could not be approved at this time. Please review the feedback and resubmit with updated information.
        </p>
        <div className="flex gap-4 flex-col sm:flex-row">
          <Link
            href="/onboarding"
            className="flex-1 bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition"
          >
            Resubmit
          </Link>
          <Link
            href="/"
            className="flex-1 border border-slate-700 text-slate-100 px-6 py-2 rounded-lg font-semibold hover:border-slate-500 transition"
          >
            Back Home
          </Link>
        </div>
      </div>
    </div>
  );
}
