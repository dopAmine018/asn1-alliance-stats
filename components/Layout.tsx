import React, { useState, useEffect } from 'react';
import { useLanguage } from '../utils/i18n';
import { Language, Alliance } from '../types';
import { CustomDropdown } from './CustomDropdown';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: 'public' | 'admin';
  onTabChange: (tab: 'public' | 'admin') => void;
  onHomeClick?: () => void;
  showHomeBtn?: boolean;
  onNavigate?: (view: any) => void; 
  alliance: Alliance;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, onHomeClick, showHomeBtn, onNavigate, alliance }) => {
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
                                <div className="relative bg-gradient-to-br from-slate-900 to-black p-1.5 rounded-xl border border-white/10 group-hover:border-sky-500/50 transition-colors overflow-hidden">
                                    <img 
                                      src="/ASN_Logo-_1628.png" 
                                      alt="GUN1 Logo" 
                                      className="w-8 h-8 object-contain transition-transform duration-500 group-hover:scale-110"
                                      onError={(e) => {
                                        (e.target as any).style.display = 'none';
                                      }}
                                    />
                                </div>
                            </div>
                            <div>
                                <h1 className="text-xl font-header font-black tracking-widest text-white leading-none">
                                    GUN 1 <span className="text-sky-500">ALLIANCE</span>
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
                         {/* Public Nav Links (Desktop) */}
                         {activeTab === 'public' && onNavigate && (
                             <div className="hidden md:flex items-center gap-2 mr-4 border-r border-slate-800 pr-4">
                                 <button onClick={() => onNavigate('train_public')} className="text-[10px] font-bold uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                                     {t('nav.train_public')}
                                 </button>
                             </div>
                         )}

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
            <div className="flex flex-col items-center gap-4">
                <div className="flex items-center gap-2 opacity-50 hover:opacity-100 transition-opacity">
                    <span className="w-2 h-2 rounded-full bg-sky-500"></span>
                    <span className="text-xs font-header font-bold tracking-[0.3em] uppercase text-white">GUN 1 Alliance</span>
                </div>

                <a href="https://discord.gg/6hxEsRmcNZ" target="_blank" rel="noopener noreferrer" className="group flex items-center gap-2 px-4 py-2 bg-[#5865F2]/10 hover:bg-[#5865F2]/20 border border-[#5865F2]/30 hover:border-[#5865F2] rounded-full transition-all duration-300">
                    <svg className="w-5 h-5 text-[#5865F2] group-hover:scale-110 transition-transform" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.078.078 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.956 2.419-2.157 2.419zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.086 2.157 2.419 0 1.334-.946 2.419-2.157 2.419z"/>
                    </svg>
                    <span className="text-[10px] font-bold text-[#5865F2] uppercase tracking-widest">Join Discord</span>
                </a>
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