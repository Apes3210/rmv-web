import { Loader2 } from 'lucide-react';

/**
 * A dark-themed loading fallback used exclusively by auth pages
 * (login, register, verify-otp, forgot-password, etc.) so that
 * the Suspense boundary doesn't flash a white skeleton while
 * the lazy-loaded page JS is downloading.
 */
export function AuthPageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#05070a]">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-6 w-6 animate-spin text-[#d6b36a]" />
        <p className="text-sm font-medium text-[#98a3b2]">Loading…</p>
      </div>
    </div>
  );
}
