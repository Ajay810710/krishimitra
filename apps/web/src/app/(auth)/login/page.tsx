'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { apiClient } from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth.store';

const loginSchema = z.object({
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit Indian mobile number'),
});

type LoginForm = z.infer<typeof loginSchema>;

const CROP_STATS = [
  { emoji: '🌾', name: 'गेहूं', price: '₹22.4/kg', change: '+4.2%', up: true },
  { emoji: '🌽', name: 'मक्का', price: '₹18.1/kg', change: '+1.8%', up: true },
  { emoji: '🧅', name: 'प्याज', price: '₹14.6/kg', change: '-2.1%', up: false },
  { emoji: '🍅', name: 'टमाटर', price: '₹31.2/kg', change: '+9.5%', up: true },
];

export default function LoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setError(null);
    try {
      await apiClient.post('/auth/request-otp', { phone: data.phone });
      router.push(`/verify?phone=${encodeURIComponent(data.phone)}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to send OTP. Please try again.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* ── Left hero panel (desktop only) ── */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-gradient-to-br from-krishna-700 via-krishna-600 to-krishna-800 p-10 lg:flex lg:w-1/2">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Floating crop emojis */}
        <div className="pointer-events-none absolute inset-0">
          <span className="animate-float absolute left-[10%] top-[15%] text-5xl opacity-20">🌾</span>
          <span className="animate-float-slow absolute right-[15%] top-[25%] text-4xl opacity-20" style={{animationDelay:'1s'}}>🌽</span>
          <span className="animate-float absolute left-[20%] top-[55%] text-3xl opacity-15" style={{animationDelay:'0.5s'}}>🧅</span>
          <span className="animate-float-slow absolute right-[10%] top-[60%] text-5xl opacity-20" style={{animationDelay:'1.5s'}}>🍅</span>
          <span className="animate-float absolute left-[60%] top-[75%] text-3xl opacity-15" style={{animationDelay:'2s'}}>🌿</span>
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 text-2xl backdrop-blur-sm">
              🌾
            </div>
            <div>
              <p className="text-xl font-bold text-white">KrishiMitra</p>
              <p className="text-xs text-krishna-200">कृषिमित्र</p>
            </div>
          </div>
        </div>

        {/* Hero text */}
        <div className="relative z-10">
          <h1 className="mb-4 text-4xl font-bold leading-tight text-white">
            बुवाई से पहले<br />
            <span className="text-mandi-300">जानें अपना भाव</span>
          </h1>
          <p className="mb-8 text-krishna-100 text-lg">
            AI की मदद से अपनी फसल का सही बाजार भाव जानें — मंडी जाने से पहले।
          </p>

          {/* Live price ticker */}
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wider text-krishna-300">आज के बाजार भाव</p>
            {CROP_STATS.map((crop, i) => (
              <div
                key={crop.name}
                className="animate-fade-up flex items-center justify-between rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{crop.emoji}</span>
                  <span className="font-medium text-white">{crop.name}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">{crop.price}</p>
                  <p className={`text-xs font-medium ${crop.up ? 'text-green-300' : 'text-red-300'}`}>
                    {crop.change}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom trust badges */}
        <div className="relative z-10 flex gap-6 text-xs text-krishna-200">
          <span>✓ 100% निःशुल्क</span>
          <span>✓ 5 भाषाओं में</span>
          <span>✓ कोई पासवर्ड नहीं</span>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex flex-1 flex-col items-center justify-center bg-gradient-to-b from-krishna-50 to-white px-6 py-12 lg:bg-white lg:px-16">
        {/* Mobile logo */}
        <div className="mb-8 text-center lg:hidden">
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl bg-krishna-600 text-3xl shadow-lg">
            🌾
          </div>
          <h1 className="text-2xl font-bold text-krishna-800">KrishiMitra</h1>
          <p className="mt-1 text-gray-500">आपका AI कृषि सलाहकार</p>
        </div>

        {/* Desktop heading */}
        <div className="mb-8 hidden w-full max-w-sm lg:block">
          <h2 className="text-3xl font-bold text-gray-900">स्वागत है 👋</h2>
          <p className="mt-2 text-gray-500">अपने मोबाइल नंबर से लॉगिन करें</p>
        </div>

        {/* Form card */}
        <div className="w-full max-w-sm animate-fade-up">
          <div className="rounded-2xl bg-white p-8 shadow-xl ring-1 ring-gray-100 lg:shadow-none lg:ring-0 lg:p-0">
            <h2 className="mb-6 text-center text-xl font-semibold text-gray-800 lg:hidden">
              मोबाइल नंबर से लॉगिन करें
            </h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-gray-700">
                  मोबाइल नंबर
                </label>
                <div className="flex overflow-hidden rounded-xl border border-gray-200 shadow-sm transition-all focus-within:border-krishna-500 focus-within:ring-2 focus-within:ring-krishna-100">
                  <span className="inline-flex items-center border-r border-gray-200 bg-gray-50 px-4 text-sm font-medium text-gray-500">
                    +91
                  </span>
                  <input
                    {...register('phone')}
                    id="phone"
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    placeholder="10 अंकों का नंबर"
                    className="block w-full bg-white px-4 py-3 text-lg focus:outline-none"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-2 flex items-center gap-1 text-sm text-red-600">
                    <span>⚠️</span> {errors.phone.message}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-red-50 p-4 text-sm text-red-700 ring-1 ring-red-100">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="touch-target w-full rounded-xl bg-gradient-to-r from-krishna-600 to-krishna-500 py-3.5 text-base font-semibold text-white shadow-md shadow-krishna-200 transition-all hover:shadow-lg hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    OTP भेजा जा रहा है...
                  </span>
                ) : 'OTP भेजें →'}
              </button>
            </form>

            <p className="mt-6 text-center text-xs text-gray-400">
              लॉगिन करके आप हमारी{' '}
              <Link href="/privacy" className="text-krishna-600 underline">गोपनीयता नीति</Link>{' '}
              से सहमत हैं
            </p>
          </div>
        </div>

        {/* Mobile trust badges */}
        <div className="mt-8 flex items-center gap-4 text-xs text-gray-400 lg:hidden">
          <span>100% निःशुल्क</span>
          <span>•</span>
          <span>कोई पासवर्ड नहीं</span>
          <span>•</span>
          <span>5 भाषाओं में</span>
        </div>
      </div>
    </div>
  );
}
