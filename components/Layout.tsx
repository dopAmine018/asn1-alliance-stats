
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
                            <div className="flex items-center gap-2">
                                <div className="flex flex-col me-1">
                                    <span className="text-sm sm:text-lg font-header font-bold tracking-widest text-white leading-none">ASN1<span className="text-sky-500">.DB</span></span>
                                </div>
                                {/* M7SAIF Link */}
                                <a 
                                  href="https://dumbidea.neocities.org/%D8%A7%D9%84%D9%85%D9%83%D9%84%D9%85%D8%A7%D9%86%D9%8A/M7SAIF" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 bg-slate-800 hover:bg-sky-600 text-sky-400 hover:text-white px-2 py-1 rounded border border-slate-700 hover:border-sky-500 transition-all group shrink-0"
                                  title="External Tools"
                                >
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                                  <span className="text-[10px] font-bold font-mono tracking-wide uppercase hidden sm:inline">STORE GUIDE</span>
                                </a>
                                {/* Discord Link */}
                                <a 
                                  href="https://discord.gg/yVwQT88bxf" 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white px-2 py-1 rounded border border-indigo-500/30 hover:border-indigo-400 transition-all group shrink-0"
                                  title="Join Discord"
                                >
                                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                                     <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.88 13.88 0 0 0-.613 1.282 18.257 18.257 0 0 0-5.463 0 14.004 14.004 0 0 0-.616-1.282.073.073 0 0 0-.077-.037 19.722 19.722 0 0 0-4.885 1.515.072.072 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                                  </svg>
                                  <span className="text-[10px] font-bold font-mono tracking-wide uppercase hidden sm:inline">DISCORD</span>
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
        <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full border border-white/5 bg-slate-900 max-w-[90%] sm:max-w-none">
                <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-[0_0_8px_#0ea5e9] shrink-0"></span>
                <p className="text-[10px] font-mono font-medium text-slate-400 tracking-widest sm:tracking-[0.2em] uppercase">
                    ASN1 Alliance <span className="text-slate-700 mx-2">|</span> MADE BY AMINE
                </p>
            </div>
            
            <a 
                href="https://discord.gg/yVwQT88bxf" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-indigo-500/20 bg-indigo-500/5 hover:bg-indigo-500/10 hover:border-indigo-500/50 transition-all group"
            >
                <svg className="w-4 h-4 text-indigo-500" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037 13.88 13.88 0 0 0-.613 1.282 18.257 18.257 0 0 0-5.463 0 14.004 14.004 0 0 0-.616-1.282.073.073 0 0 0-.077-.037 19.722 19.722 0 0 0-4.885 1.515.072.072 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.118.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                </svg>
                <span className="text-[10px] font-mono font-bold text-indigo-400 group-hover:text-indigo-300 uppercase tracking-widest">Join Discord</span>
            </a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;