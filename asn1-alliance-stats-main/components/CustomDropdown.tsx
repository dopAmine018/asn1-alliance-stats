
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { useLanguage } from '../utils/i18n';

export interface CustomDropdownProps {
  value: string | number;
  onChange: (value: string | number) => void;
  options: { label: string | number; value: string | number }[];
  placeholder?: string;
  className?: string;
  color?: string; // Kept for API compatibility
  disableSearch?: boolean;
}

export const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, onChange, options, placeholder = "Select", className = "", disableSearch = false }) => {
  const { t } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null); // Ref for the dropdown content
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
  const [menuHeight, setMenuHeight] = useState<number | null>(null);

  // Calculate position on toggle
  const toggleDropdown = () => {
    if (!isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      
      // Basic positioning: prefer below, flip if space is tight
      let top = rect.bottom + 8 + window.scrollY;
      let height = Math.min(300, spaceBelow - 20);

      // If more space above and tight below, flip
      if (spaceBelow < 200 && spaceAbove > spaceBelow) {
          height = Math.min(300, spaceAbove - 20);
          top = rect.top + window.scrollY - height - 8;
      }

      setCoords({
        top,
        left: rect.left + window.scrollX,
        width: rect.width
      });
      setMenuHeight(height);
    }
    setIsOpen(!isOpen);
    setSearchTerm(''); // Reset search on toggle
  };

  // Close when clicking outside or scrolling OUTSIDE the dropdown
  useEffect(() => {
    const handleOutsideInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      // Ignore if clicking trigger
      if (triggerRef.current?.contains(target)) return;
      // Ignore if clicking inside dropdown (using class check or ref if portal wasn't tricky)
      if (target.closest('.portal-dropdown-menu')) return;
      
      setIsOpen(false);
    };

    const handleScroll = (event: Event) => {
        const target = event.target as HTMLElement;
        // CRITICAL FIX: If scrolling happens INSIDE the dropdown, do NOT close it.
        // Check nodeType to ensure it's an Element (1) before calling closest. Document is (9).
        if (target && target.nodeType === 1 && target.closest('.portal-dropdown-menu')) {
            return; 
        }
        // On mobile, minor scrolls often happen. We only close if scrolling the main window.
        setIsOpen(false);
    };

    const handleResize = () => {
        // Fix: Don't close if virtual keyboard opens (active element is inside dropdown)
        if (document.activeElement && document.activeElement.closest('.portal-dropdown-menu')) {
          return;
        }
        if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
        // Mouse and Touch events for outside clicking
        document.addEventListener('mousedown', handleOutsideInteraction);
        document.addEventListener('touchstart', handleOutsideInteraction);
        
        window.addEventListener('resize', handleResize);
        
        // Capture phase true to detect window scroll
        window.addEventListener('scroll', handleScroll, true); 
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction);
      document.removeEventListener('touchstart', handleOutsideInteraction);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [isOpen]);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(o => 
      String(o.label).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div className={`relative ${className}`}>
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={toggleDropdown}
        className={`
          w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all duration-300
          ${isOpen 
             ? 'bg-slate-900 border-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.15)]' 
             : 'bg-[#0f172a] border-slate-700/50 hover:border-slate-600 hover:bg-slate-900/50'
          }
        `}
      >
        <span className={`truncate font-mono ${selectedOption ? 'text-white' : 'text-slate-500'}`}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <svg 
          className={`w-4 h-4 text-slate-500 transition-transform duration-300 ${isOpen ? 'rotate-180 text-sky-500' : ''}`} 
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Portal Menu */}
      {isOpen && createPortal(
        <div 
          ref={dropdownRef}
          className="portal-dropdown-menu absolute z-[99999] flex flex-col bg-[#0f172a]/95 backdrop-blur-xl border border-slate-700 rounded-xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in fade-in zoom-in-95 duration-100"
          style={{ 
            top: coords.top, 
            left: coords.left, 
            width: coords.width,
            maxHeight: menuHeight || 300 
          }}
        >
          {/* Search Bar */}
          {options.length > 10 && !disableSearch && (
            <div className="p-2 border-b border-white/5 bg-slate-900 sticky top-0 z-10">
              <input 
                // Removed autoFocus to fix mobile keyboard glitch
                type="text"
                placeholder={t('viewer.search')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-600 focus:border-sky-500/50 outline-none font-mono"
                onClick={(e) => e.stopPropagation()} 
              />
            </div>
          )}

          {/* Options List */}
          <div className="overflow-y-auto custom-scrollbar flex-1 p-1">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => {
                const isSelected = String(value) === String(option.value);
                return (
                  <div
                    key={option.value}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                    }}
                    className={`
                      px-3 py-2.5 rounded-lg cursor-pointer text-sm font-mono flex items-center justify-between group transition-colors
                      ${isSelected 
                        ? 'bg-sky-600 text-white shadow-md' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                      }
                    `}
                  >
                    <span className="truncate">{option.label}</span>
                    {isSelected && (
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-500 font-mono uppercase tracking-widest">
                {t('viewer.no_results')}
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};