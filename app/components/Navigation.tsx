'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useLanguage } from '../contexts/LanguageContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const pathname = usePathname();

  const toggleMenu = () => setIsOpen(!isOpen);

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'ru' : 'en');
  };

  const isActive = (href: string) => pathname === href;

  return (
    <nav className="fixed top-0 left-0 w-full bg-black bg-opacity-80 text-white z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/tracks" className="flex items-center">
              <Image src="/favicon.svg" alt="Yamme Tee" width={32} height={32} />
            </Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <Link href="/tracks" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/tracks') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.tracks}
              </Link>
              <Link href="/videos" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/videos') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.videos}
              </Link>
              {/* <Link href="/about" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/about') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.about}
              </Link>
              <Link href="/wall" className={`px-3 py-2 text-sm font-medium border-b-2 ${isActive('/wall') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`}>
                {t.navigation.wall}
              </Link> */}
              <button
                onClick={toggleLanguage}
                className="px-3 py-2 text-sm font-medium hover:text-gray-300 transition-colors"
              >
                {language === 'en' ? '🇷🇺' : '🇺🇸'}
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
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
              <span className="sr-only">Open main menu</span>
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

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-black bg-opacity-90">
            <Link href="/tracks" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/tracks') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.tracks}
            </Link>
            <Link href="/videos" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/videos') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.videos}
            </Link>
            {/* <Link href="/about" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/about') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.about}
            </Link>
            <Link href="/wall" className={`block px-3 py-2 text-base font-medium border-b-2 ${isActive('/wall') ? 'border-white' : 'border-transparent'} hover:border-gray-300 transition-colors`} onClick={toggleMenu}>
              {t.navigation.wall}
            </Link> */}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navigation;