'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const OTP_RESEND_SECONDS = 60;

function VerifyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phone = searchParams.get('phone') ?? '';

  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isResending, setIsResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(OTP_RESEND_SECONDS);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const { setAuth } = useAuthStore();

  // Countdown timer for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  const handleInput = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (newOtp.every((d) => d !== '') && newOtp.length === 6) {
      void handleVerify(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiClient.post<{
        data: {
          accessToken: string;
          refreshToken: string;
          farmer: { id: string; phone: string; name: string; preferredLanguage: string };
        };
      }>('/auth/verify-otp', { phone, code });

      const { accessToken, refreshToken, farmer } = response.data.data;
      setAuth({ accessToken, refreshToken, farmer });
      router.push('/');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'गलत OTP। कृपया पुनः प्रयास करें।';
      setError(message);
      setOtp(Array(6).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setIsResending(true);
    setError(null);
    try {
      await apiClient.post('/auth/request-otp', { phone });
      setOtp(Array(6).fill(''));
      setResendCooldown(OTP_RESEND_SECONDS);
      inputRefs.current[0]?.focus();
    } catch {
      setError('OTP भेजने में समस्या। कृपया पुनः प्रयास करें।');
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-krishna-50 to-white px-4">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-krishna-600 text-3xl shadow-lg">
          🌾
        </div>
        <h1 className="text-2xl font-bold text-krishna-800">OTP सत्यापित करें</h1>
        <p className="mt-2 text-gray-500">
          +91 {phone} पर भेजा गया 6 अंकों का कोड दर्ज करें
        </p>
      </div>

      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-lg">
        <div className="mb-6 flex justify-center gap-3">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="tel"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleInput(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className="h-12 w-12 rounded-xl border-2 border-gray-200 text-center text-xl font-bold focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-200"
            />
          ))}
        </div>

        {/* OTP expiry hint */}
        <p className="mb-4 text-center text-xs text-gray-400">
          OTP 10 मिनट में समाप्त हो जाता है
        </p>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</div>
        )}

        <button
          onClick={() => handleVerify(otp.join(''))}
          disabled={isLoading || otp.some((d) => !d)}
          className="touch-target w-full rounded-xl bg-krishna-600 py-3 text-base font-semibold text-white transition-colors hover:bg-krishna-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? 'सत्यापित किया जा रहा है...' : 'सत्यापित करें और लॉगिन करें'}
        </button>

        <div className="mt-4 text-center">
          {resendCooldown > 0 ? (
            <p className="text-sm text-gray-400">
              पुनः भेजें{' '}
              <span className="font-semibold text-krishna-600">{resendCooldown}s</span>{' '}
              में उपलब्ध
            </p>
          ) : (
            <button
              onClick={handleResend}
              disabled={isResending}
              className="text-sm font-medium text-krishna-600 hover:underline disabled:opacity-50"
            >
              {isResending ? 'OTP भेजा जा रहा है...' : 'OTP नहीं मिला? पुनः भेजें'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-krishna-600 border-t-transparent" />
      </div>
    }>
      <VerifyForm />
    </Suspense>
  );
}
