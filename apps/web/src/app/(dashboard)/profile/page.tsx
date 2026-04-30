'use client';

import { useRouter } from 'next/navigation';
import { LogOut, User, Phone, MapPin, Languages } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { maskPhone } from '@krishimitra/shared';

const LANG_LABELS: Record<string, string> = {
  HINDI: 'हिंदी', KANNADA: 'ಕನ್ನಡ', TELUGU: 'తెలుగు', TAMIL: 'தமிழ்', ENGLISH: 'English',
};

export default function ProfilePage() {
  const router = useRouter();
  const { farmer, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  if (!farmer) return null;

  const initials = farmer.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">प्रोफ़ाइल</h1>

      {/* Avatar card */}
      <div className="flex items-center gap-4 rounded-2xl bg-gradient-to-br from-krishna-700 to-krishna-600 p-6 text-white shadow-lg">
        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-2xl font-bold shadow">
          {initials}
        </div>
        <div>
          <p className="text-xl font-bold">{farmer.name}</p>
          <p className="text-sm text-krishna-200">+91 {maskPhone(farmer.phone)}</p>
        </div>
      </div>

      {/* Details */}
      <div className="rounded-2xl bg-white shadow-sm ring-1 ring-gray-100 divide-y divide-gray-50">
        {[
          { icon: User,      label: 'नाम',    value: farmer.name },
          { icon: Phone,     label: 'मोबाइल', value: `+91 ${farmer.phone}` },
          { icon: Languages, label: 'भाषा',   value: LANG_LABELS[farmer.preferredLanguage] ?? farmer.preferredLanguage },
        ].map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-center gap-4 px-5 py-4">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-krishna-50">
              <Icon className="h-4 w-4 text-krishna-600" />
            </div>
            <div>
              <p className="text-xs text-gray-400">{label}</p>
              <p className="font-medium text-gray-800">{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-red-100 bg-red-50 py-4 text-sm font-semibold text-red-600 transition hover:bg-red-100"
      >
        <LogOut className="h-4 w-4" />
        लॉगआउट करें
      </button>
    </div>
  );
}
