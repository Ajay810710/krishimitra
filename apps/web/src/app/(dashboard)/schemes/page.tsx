'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, FileText, XCircle } from 'lucide-react';

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function getToken() {
  return localStorage.getItem('km_token') || sessionStorage.getItem('km_token') || '';
}

function authHeaders() {
  return { Authorization: `Bearer ${getToken()}` };
}

interface Scheme {
  id: string;
  name: string;
  nameHindi: string;
  category: string;
  description: string;
  descriptionHindi: string;
  eligibility: string;
  benefit: string;
  deadline: string;
  applyUrl: string;
  eligible?: boolean;
  reason?: string;
}

interface EligibleData {
  eligible: Scheme[];
  others: Scheme[];
  total: number;
}

const CATEGORY_LABEL: Record<string, { label: string; color: string }> = {
  INSURANCE:      { label: 'बीमा',          color: 'bg-blue-100 text-blue-700' },
  SUBSIDY:        { label: 'सब्सिडी',        color: 'bg-green-100 text-green-700' },
  LOAN:           { label: 'ऋण',            color: 'bg-purple-100 text-purple-700' },
  INFRASTRUCTURE: { label: 'बुनियादी ढांचा', color: 'bg-amber-100 text-amber-700' },
  MARKET_SUPPORT: { label: 'बाजार सहायता',  color: 'bg-orange-100 text-orange-700' },
  TRAINING:       { label: 'प्रशिक्षण',      color: 'bg-teal-100 text-teal-700' },
};

function SchemeCard({ scheme, eligible }: { scheme: Scheme; eligible: boolean }) {
  const cat = CATEGORY_LABEL[scheme.category] ?? { label: scheme.category, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className={`rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition-shadow ${!eligible ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${cat.color}`}>{cat.label}</span>
            {eligible
              ? <span className="flex items-center gap-1 text-xs text-green-600 font-medium"><CheckCircle2 className="h-3.5 w-3.5" />पात्र</span>
              : <span className="flex items-center gap-1 text-xs text-gray-400"><XCircle className="h-3.5 w-3.5" />अपात्र</span>
            }
          </div>
          <h3 className="font-semibold text-gray-900 text-sm leading-snug">{scheme.nameHindi}</h3>
          <p className="text-[10px] text-gray-400">{scheme.name}</p>
        </div>
      </div>

      <p className="text-sm text-gray-600 mb-3 leading-relaxed">{scheme.descriptionHindi}</p>

      <div className="space-y-1.5 text-xs">
        <div className="flex gap-2">
          <span className="font-semibold text-gray-500 w-20 flex-shrink-0">पात्रता:</span>
          <span className="text-gray-600">{scheme.eligibility}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold text-gray-500 w-20 flex-shrink-0">लाभ:</span>
          <span className="text-gray-600">{scheme.benefit}</span>
        </div>
        <div className="flex gap-2">
          <span className="font-semibold text-gray-500 w-20 flex-shrink-0">अंतिम तिथि:</span>
          <span className="text-gray-600">{scheme.deadline}</span>
        </div>
      </div>

      {scheme.reason && (
        <p className="mt-2 text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">{scheme.reason}</p>
      )}

      <a
        href={scheme.applyUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 flex items-center gap-1.5 text-xs font-semibold text-krishna-600 hover:text-krishna-700"
      >
        <ExternalLink className="h-3.5 w-3.5" />
        आवेदन करें / अधिक जानें
      </a>
    </div>
  );
}

export default function SchemesPage() {
  const { data, isLoading, error } = useQuery<EligibleData>({
    queryKey: ['schemes-eligible'],
    queryFn: async () => {
      const r = await fetch(`${API}/schemes/eligible`, { headers: authHeaders() });
      if (!r.ok) throw new Error('Failed');
      return (await r.json()).data;
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <FileText className="h-10 w-10 text-krishna-400 animate-pulse mx-auto mb-2" />
          <p className="text-gray-500 text-sm">योजनाएं लोड हो रही हैं...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
        योजना डेटा लोड करने में समस्या हुई।
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">सरकारी योजनाएं</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          केंद्र सरकार की कृषि योजनाएं — {data.eligible.length} योजनाओं के लिए आप पात्र हैं
        </p>
      </div>

      {/* Summary bar */}
      <div className="flex items-center gap-4 rounded-xl bg-krishna-50 border border-krishna-100 px-5 py-3">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold text-gray-800">{data.eligible.length} पात्र योजनाएं</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <div className="flex items-center gap-2">
          <XCircle className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-500">{data.others.length} अन्य योजनाएं</span>
        </div>
        <div className="h-4 w-px bg-gray-200" />
        <span className="text-sm text-gray-500">कुल: {data.total}</span>
      </div>

      {/* Eligible schemes */}
      {data.eligible.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            आपके लिए पात्र योजनाएं
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.eligible.map((s) => (
              <SchemeCard key={s.id} scheme={s} eligible={true} />
            ))}
          </div>
        </div>
      )}

      {/* Other schemes */}
      {data.others.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-gray-500 mb-3 flex items-center gap-2">
            <XCircle className="h-4 w-4 text-gray-400" />
            अन्य उपलब्ध योजनाएं
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {data.others.map((s) => (
              <SchemeCard key={s.id} scheme={s} eligible={false} />
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-gray-400 text-center">
        जानकारी केंद्र सरकार की आधिकारिक वेबसाइटों पर आधारित है। नवीनतम जानकारी के लिए संबंधित पोर्टल देखें।
      </p>
    </div>
  );
}
