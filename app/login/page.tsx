'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get('next') || '/account';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (signInError) {
      setError(signInError.message || t.auth.error);
      return;
    }

    router.push(nextPath);
    router.refresh();
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">{t.auth.loginTitle}</h1>
      <form onSubmit={onSubmit} className="space-y-4 bg-neutral-900 border border-neutral-800 rounded-xl p-5">
        <div>
          <label className="block text-sm mb-1">{t.auth.email}</label>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 bg-neutral-800 rounded-md border border-neutral-700"
          />
        </div>
        <div>
          <label className="block text-sm mb-1">{t.auth.password}</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-neutral-800 rounded-md border border-neutral-700"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              title={showPassword ? t.auth.hidePassword : t.auth.showPassword}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error ? <p className="text-red-400 text-sm">{error}</p> : null}

        <button disabled={loading} className="w-full py-2 rounded-md bg-white text-black font-medium disabled:opacity-60">
          {t.auth.login}
        </button>
      </form>

      <p className="text-sm text-gray-400 mt-4">
        {t.auth.noAccount} <Link href="/register" className="text-white underline">{t.auth.register}</Link>
      </p>
    </div>
  );
}
