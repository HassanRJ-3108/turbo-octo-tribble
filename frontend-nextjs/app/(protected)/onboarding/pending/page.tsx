"use client";

import { Clock } from "lucide-react";
import Link from "next/link";

export default function OnboardingPendingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="bg-amber-400/20 border border-amber-400/50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
          <Clock className="w-8 h-8 text-amber-400" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Application Under Review</h1>
        <p className="text-slate-300 mb-8">
          Your restaurant application has been submitted successfully. Our team is reviewing your documents. You'll receive an email notification once approved.
        </p>
        <p className="text-slate-400 text-sm">
          This usually takes 1-2 business days.
        </p>
        <Link
          href="/"
          className="inline-block mt-8 bg-amber-400 text-slate-950 px-6 py-2 rounded-lg font-semibold hover:bg-amber-300 transition"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
