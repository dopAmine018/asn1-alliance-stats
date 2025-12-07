
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/i18n';
import { Language } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'public' | 'admin';
  onTabChange: (tab: 'public' | 'admin') => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange }) => {
  const { language, setLanguage, t, dir } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languageOptions = [
    { value: 'english', label: '🇺🇸 Eng' },
    { value: 'arabic', label: '🇸🇦 Ara' },
    { value: 'turkish', label: '🇹🇷 Tur' },
    { value: 'indonesian', label: '🇮🇩 Ind' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden" dir={dir}>
      {/* Background Decor */}
      <div className="fixed top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-sky-500/30 to-transparent z-[110]" />
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-300 ${scrolled ? 'py-2' : 'py-4'}`}>
        <div className="container max-w-7xl mx-auto px-4">
            <div className={`bg-[#0f172a]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl shadow-black/50 transition-all duration-300 ${scrolled ? 'py-2 px-4' : 'py-3 px-4 sm:px-6'}`}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                    
                    {/* Top Row: Logo & Lang (Mobile) or Left Side (Desktop) */}
                    <div className="w-full sm:w-auto flex items-center justify-between">
                        {/* Logo */}
                        <div className="flex items-center gap-3">
                            <div className="relative group">
                                <div className="absolute -inset-2 bg-sky-500/20 rounded-full blur-lg opacity-0 group-hover:opacity-100 transition duration-700"></div>
                                <div className="relative bg-gradient-to-br from-slate-800 to-slate-950 p-2 rounded-lg ring-1 ring-white/10 group-hover:ring-sky-500/50 transition-all">
                                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex flex-col">
                                    <span className="text-sm sm:text-lg font-header font-bold tracking-widest text-white leading-none">ASN1<span className="text-sky-500">.DB</span></span>
                                </div>
                                {/* M7SAIF Link */}
                                <a 
                                  href="https://dumbidea.neocities.org/%D8%A7%D9%84%D9%85%D9%83%D9%84%D9%85%D8%A7%D9%86%D9%8A/M7SAIF" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 bg-slate-800 hover:bg-sky-600 text-sky-400 hover:text-white px-2 py-1 rounded border border-slate-700 hover:border-sky-500 transition-all group"
                                  title="External Tools"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  <span className="text-[10px] font-bold font-mono tracking-wide uppercase">M7SAIF</span>
                                </a>
                            </div>
                        </div>

                        {/* Mobile Language Selector */}
                        <div className="sm:hidden w-28">
                            <CustomDropdown 
                                value={language}
                                onChange={(val) => setLanguage(val as Language)}
                                options={languageOptions}
                                color="blue"
                                className="text-xs"
                            />
                        </div>
                    </div>

                    {/* Middle: Tabs */}
                    <div className="w-full sm:w-auto flex justify-center">
                        <div className="bg-slate-950 p-1 rounded-lg border border-white/5 relative flex w-full sm:w-auto">
                            <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-slate-800 rounded-md shadow-inner border border-white/5 transition-all duration-300 ease-out ${activeTab === 'public' ? 'start-1' : 'start-[calc(50%)]'}`} />
                            <button
                                onClick={() => onTabChange('public')}
                                className={`flex-1 sm:flex-none relative z-10 px-4 sm:px-8 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${activeTab === 'public' ? 'text-white' : 'text-slate-500'}`}
                            >
                                {t('nav.public')}
                            </button>
                            <button
                                onClick={() => onTabChange('admin')}
                                className={`flex-1 sm:flex-none relative z-10 px-4 sm:px-8 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest transition-colors duration-300 ${activeTab === 'admin' ? 'text-sky-400' : 'text-slate-500'}`}
                            >
                                {t('nav.admin')}
                            </button>
                        </div>
                    </div>

                    {/* Right: Desktop Language */}
                    <div className="hidden sm:block w-32">
                         <CustomDropdown 
                            value={language}
                            onChange={(val) => setLanguage(val as Language)}
                            options={languageOptions}
                            color="blue"
                         />
                    </div>
                </div>
            </div>
        </div>
      </nav>

      {/* Spacer for Fixed Nav */}
      <div className="h-32 sm:h-28"></div>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8 space-y-8 sm:space-y-12">
        {children}
      </main>

      <footer className="mt-auto py-8 text-center border-t border-white/5 bg-slate-950">
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/5 bg-slate-900 mx-4 max-w-[90%] sm:max-w-none">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9] shrink-0"></span>
          <p className="text-[10px] font-mono font-medium text-slate-400 tracking-widest sm:tracking-[0.2em] uppercase">
              ASN1 Alliance <span className="text-slate-700 mx-2">|</span> MADE BY AMINE
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
