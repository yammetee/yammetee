'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { createSupabaseBrowserClient } from '../lib/supabase/client';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, EyeOff } from 'lucide-react';
import LoadingGlow from '../components/LoadingGlow';

export default function RegisterPage() {
  const { t, language } = useLanguage();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const loadingText = language === 'ru' ? 'загрузка...' : 'loading...';

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError(t.auth.passwordMismatch);
      setLoading(false);
      return;
    }

    const supabase = createSupabaseBrowserClient();
    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message || t.auth.error);
      return;
    }

    if (data.session) {
      router.push('/account');
      router.refresh();
      return;
    }

    setSuccess(t.auth.verifyEmailSuccess);
    setPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      {loading ? <LoadingGlow overlay text={loadingText} /> : null}
      <h1 className="text-3xl font-bold mb-6">{t.auth.registerTitle}</h1>
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
              minLength={6}
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
        <div>
          <label className="block text-sm mb-1">{t.auth.confirmPassword}</label>
          <div className="relative">
            <input
              type={showConfirmPassword ? 'text' : 'password'}
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 pr-10 bg-neutral-800 rounded-md border border-neutral-700"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((v) => !v)}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              title={showConfirmPassword ? t.auth.hidePassword : t.auth.showPassword}
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {error ? <p className="text-red-400 text-sm">{error}</p> : null}
        {success ? <p className="text-green-400 text-sm">{success}</p> : null}

        <button disabled={loading} className="w-full py-2 rounded-md bg-white text-black font-medium disabled:opacity-60">
          {t.auth.register}
        </button>
      </form>

      <p className="text-sm text-gray-400 mt-4">
        {t.auth.hasAccount} <Link href="/login" className="text-white underline">{t.auth.login}</Link>
      </p>
    </div>
  );
}
