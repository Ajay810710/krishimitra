'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, User, Phone, Languages, Edit2, Check, X } from 'lucide-react';
import { useAuthStore } from '@/stores/auth.store';
import { apiClient } from '@/lib/api-client';
import { maskPhone } from '@krishimitra/shared';

const LANG_LABELS: Record<string, string> = {
  HINDI: 'हिंदी', KANNADA: 'ಕನ್ನಡ', TELUGU: 'తెలుగు', TAMIL: 'தமிழ்', ENGLISH: 'English',
};

const LANG_OPTIONS = Object.entries(LANG_LABELS).map(([value, label]) => ({ value, label }));

export default function ProfilePage() {
  const router = useRouter();
  const { farmer, setAuth, logout, accessToken, refreshToken } = useAuthStore();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving]   = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const [editName, setEditName] = useState(farmer?.name ?? '');
  const [editLang, setEditLang] = useState(farmer?.preferredLanguage ?? 'HINDI');

  const handleLogout = () => {
    logout();
    router.replace('/login');
  };

  const handleEdit = () => {
    setEditName(farmer?.name ?? '');
    setEditLang(farmer?.preferredLanguage ?? 'HINDI');
    setSaveError(null);
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    if (!editName.trim()) return;
    setIsSaving(true);
    setSaveError(null);
    try {
      const res = await apiClient.put<{ data: { name: string; preferredLanguage: string } }>(
        '/farmer/profile',
        { name: editName.trim(), preferredLanguage: editLang },
      );
      // Update local auth store with new name/language
      if (farmer && accessToken && refreshToken) {
        setAuth({
          accessToken,
          refreshToken,
          farmer: { ...farmer, name: res.data.data.name, preferredLanguage: res.data.data.preferredLanguage },
        });
      }
      setIsEditing(false);
    } catch {
      setSaveError('सहेजने में समस्या। कृपया पुनः प्रयास करें।');
    } finally {
      setIsSaving(false);
    }
  };

  if (!farmer) return null;

  const initials = farmer.name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">प्रोफ़ाइल</h1>
        {!isEditing && (
          <button
            onClick={handleEdit}
            className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-600 shadow-sm transition hover:bg-gray-50"
          >
            <Edit2 className="h-4 w-4" />
            संपादित करें
          </button>
        )}
      </div>

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

      {/* Edit form or details view */}
      {isEditing ? (
        <div className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-gray-100 space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">नाम</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              maxLength={100}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">भाषा</label>
            <select
              value={editLang}
              onChange={(e) => setEditLang(e.target.value)}
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm focus:border-krishna-500 focus:outline-none focus:ring-2 focus:ring-krishna-100"
            >
              {LANG_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {saveError && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{saveError}</div>
          )}
          <div className="flex gap-3">
            <button
              onClick={handleSave}
              disabled={isSaving || !editName.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-krishna-600 py-3 text-sm font-semibold text-white transition hover:bg-krishna-700 disabled:opacity-60"
            >
              <Check className="h-4 w-4" />
              {isSaving ? 'सहेजा जा रहा है...' : 'सहेजें'}
            </button>
            <button
              onClick={handleCancel}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50"
            >
              <X className="h-4 w-4" />
              रद्द करें
            </button>
          </div>
        </div>
      ) : (
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
      )}

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
