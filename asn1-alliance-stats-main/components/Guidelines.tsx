import React from 'react';
import { useLanguage } from '../utils/i18n';

const Guidelines: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    const { t } = useLanguage();

    const sections = [
        { q: t('manual.faq.update'), a: t('manual.faq.update.ans') },
        { q: t('manual.faq.t10'), a: t('manual.faq.t10.ans') },
        { q: t('manual.faq.train'), a: t('manual.faq.train.ans') },
    ];

    return (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-3xl mx-auto">
             {/* Header */}
             <div className="flex items-center justify-between mb-8 border-b border-white/10 pb-4">
                <div className="flex items-center gap-4">
                    <button onClick={onBack} className="w-8 h-8 flex items-center justify-center rounded-full border border-slate-700 hover:border-sky-500 hover:text-sky-500 transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <div>
                        <h2 className="text-xl font-header font-bold text-white uppercase tracking-[0.2em]">{t('manual.title')}</h2>
                        <p className="text-[10px] text-slate-400 font-mono">{t('manual.subtitle')}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {sections.map((item, idx) => (
                    <div key={idx} className="bg-[#0f172a]/50 border border-slate-800 rounded-xl p-6 hover:border-sky-500/30 transition-colors">
                        <h3 className="text-sm font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500"></span>
                            {item.q}
                        </h3>
                        <p className="text-sm text-slate-300 leading-relaxed font-mono">
                            {item.a}
                        </p>
                    </div>
                ))}

                <div className="bg-amber-900/10 border border-amber-500/20 rounded-xl p-6 mt-8">
                    <h3 className="text-amber-500 font-bold uppercase tracking-widest text-xs mb-2">⚠ Classified Info</h3>
                    <p className="text-xs text-amber-200/80 font-mono">
                        Unauthorized sharing of alliance intel (Train Schedules, Member Stats) with opposing forces will result in immediate termination from the database.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Guidelines;