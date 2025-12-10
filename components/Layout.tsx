
import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/i18n';
import { Language } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'public' | 'admin';
  onTabChange: (tab: 'public' | 'admin') => void;
  onHomeClick?: () => void;
  showHomeBtn?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onHomeClick, showHomeBtn }) => {
  const { language, setLanguage, t, dir } = useLanguage();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const languageOptions = [
    { value: 'english', label: 'ENG' },
    { value: 'arabic', label: 'ARA' },
    { value: 'turkish', label: 'TUR' },
    { value: 'indonesian', label: 'IND' },
  ];

  return (
    <div className="min-h-screen flex flex-col relative" dir={dir}>
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${scrolled ? 'py-2' : 'py-6'}`}>
        <div className="container max-w-7xl mx-auto px-4">
            <div className={`
                relative backdrop-blur-xl border transition-all duration-500
                ${scrolled 
                    ? 'bg-[#020617]/90 border-slate-800/80 shadow-2xl rounded-2xl py-3 px-5' 
                    : 'bg-transparent border-transparent py-2 px-0'}
            `}>
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    
                    {/* Brand */}
                    <div className="flex items-center justify-between w-full sm:w-auto">
                        <div className="flex items-center gap-4 group cursor-pointer" onClick={onHomeClick}>
                            <div className="relative">
                                <div className="absolute inset-0 bg-sky-500 blur-lg opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                                <div className="relative bg-gradient-to-br from-slate-900 to-black p-2.5 rounded-xl border border-white/10 group-hover:border-sky-500/50 transition-colors">
                                    <svg className="w-6 h-6 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                                    </svg>
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-header font-black tracking-widest text-white leading-none">
                                    ASN1 <span className="text-sky-500">ALLIANCE</span>
                                </h1>
                            </div>
                        </div>

                        {/* Mobile Lang */}
                        <div className="sm:hidden w-24">
                            <CustomDropdown 
                                value={language}
                                onChange={(val) => setLanguage(val as Language)}
                                options={languageOptions}
                                className="text-xs"
                            />
                        </div>
                    </div>

                    {/* Desktop Actions */}
                    <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                         {showHomeBtn && (
                             <button onClick={onHomeClick} className="hidden sm:flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors border border-slate-800 hover:border-slate-600 px-4 py-2 rounded-lg bg-slate-900/50">
                                 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>
                                 {t('nav.home')}
                             </button>
                         )}

                         <div className="hidden sm:block w-28">
                            <CustomDropdown 
                                value={language}
                                onChange={(val) => setLanguage(val as Language)}
                                options={languageOptions}
                            />
                         </div>

                         {activeTab === 'public' ? (
                            <button
                                onClick={() => onTabChange('admin')}
                                className="text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-sky-400 transition-colors px-3"
                            >
                                {t('nav.admin')}
                            </button>
                         ) : (
                             <button
                                onClick={() => onTabChange('public')}
                                className="text-[10px] font-bold uppercase tracking-widest text-sky-500 hover:text-sky-400 transition-colors px-3"
                             >
                                {t('nav.public')}
                             </button>
                         )}
                    </div>
                </div>
            </div>
        </div>
      </nav>

      {/* Spacer */}
      <div className="h-32"></div>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-20 border-t border-white/5 bg-[#010409] relative overflow-hidden">
        {/* Decorative Grid */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-5"></div>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-sky-500/50 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto px-4 py-12 flex flex-col items-center gap-6 relative z-10">
            <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                <span className="text-xs font-header font-bold tracking-[0.3em] uppercase text-white">ASN1 Alliance</span>
            </div>
            
            {/* AMINE CREDIT */}
            <div className="group relative">
                <div className="absolute -inset-2 bg-gradient-to-r from-amber-500/0 via-amber-500/10 to-amber-500/0 blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <p className="text-[10px] text-slate-500 font-mono tracking-[0.2em] border border-slate-800/50 bg-slate-900/30 px-4 py-2 rounded-full group-hover:border-amber-500/30 group-hover:text-amber-500 transition-colors cursor-default">
                    {t('credit.architect')}
                </p>
            </div>

            <p className="text-[10px] text-slate-600 font-mono">SECURE CONNECTION ESTABLISHED // ENCRYPTED</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
