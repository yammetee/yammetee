'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';
import { createSupabaseBrowserClient } from '../lib/supabase/client';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthed, setIsAuthed] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();
  const router = useRouter();

  const toggleMenu = () => setIsOpen(!isOpen);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  const isActive = (href: string) => pathname === href;

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();

    supabase.auth.getUser().then(({ data }) => {
      setIsAuthed(Boolean(data.user));
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(Boolean(session?.user));
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    setIsOpen(false);
    router.push('/login');
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 w-full bg-black bg-opacity-80 text-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0">
            <Link href="/tracks" className="flex items-center">
              <Image src="/favicon.svg" alt="Yamme Tee" width={32} height={32} />
            </Link>
          </div>

          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/tracks" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/tracks') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.releases}
              </Link>
              <Link href="/all-tracks" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/all-tracks') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.tracks}
              </Link>
              <Link href="/videos" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/videos') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.videos}
              </Link>
              <Link href="/wall" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/wall') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.wall}
              </Link>
              {isAuthed ? (
                <>
                  <Link href="/account" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/account') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                    {t.navigation.account}
                  </Link>
                  <button onClick={logout} className="px-3 py-2 text-sm font-medium hover:text-gray-300 transition-colors">
                    {t.navigation.logout}
                  </button>
                </>
              ) : (
                <Link href="/login" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/login') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                  {t.navigation.login}
                </Link>
              )}
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 text-sm font-medium hover:text-gray-300 transition-colors"
              >
                {language === 'en' ? '🇷🇺' : '🇺🇸'}
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center space-x-2">
            <button
              onClick={toggleLanguage}
              className="px-2 py-1 text-sm font-medium hover:text-gray-300 transition-colors"
            >
              {language === 'en' ? '🇷🇺' : '🇺🇸'}
            </button>
            <button
              onClick={toggleMenu}
              className="bg-neutral-800 inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-neutral-800 focus:ring-white"
            >
              <span className="sr-only">{t.navigation.openMenu}</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black bg-opacity-90">
            <Link href="/tracks" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/tracks') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.releases}
            </Link>
            <Link href="/all-tracks" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/all-tracks') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.tracks}
            </Link>
            <Link href="/videos" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/videos') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.videos}
            </Link>
            <Link href="/wall" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/wall') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.wall}
            </Link>
            {isAuthed ? (
              <>
                <Link href="/account" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/account') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
                  {t.navigation.account}
                </Link>
                <button onClick={logout} className="block w-full text-left px-3 py-2 text-base font-medium border-b-2 border-transparent hover:border-gray-300 transition-colors">
                  {t.navigation.logout}
                </button>
              </>
            ) : (
              <Link href="/login" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/login') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
                {t.navigation.login}
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;
