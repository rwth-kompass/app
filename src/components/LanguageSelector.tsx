import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Flag } from 'lucide-react';
import { useTranslationProvider } from '../hooks/useTranslationProvider';

export const languages = [
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'jp', name: '日本語', flag: '🇯🇵' },
  { code: 'cn', name: '中文', flag: '🇨🇳' },
  { code: 'ua', name: 'Українська', flag: '🇺🇦' },
];

export default function LanguageSelector({ align = 'left' }: { align?: 'left' | 'right' }) {
  const { i18n, changeLanguage } = useTranslationProvider();
  const [isOpen, setIsOpen] = useState(false);
  const [isLightMode, setIsLightMode] = useState(() => document.documentElement.classList.contains('light'));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 px-2.5 py-1.5 pl-3 rounded-full transition-all border text-[11px] font-bold uppercase tracking-wider ${
          isLightMode 
            ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-600' 
            : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
        }`}
      >
        <span>{i18n.language}</span>
        <ChevronDown size={12} className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className={`absolute top-full ${align === 'right' ? 'right-0' : 'left-0'} mt-2 w-48 border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200 z-[60] ${
          isLightMode ? 'bg-white border-black/10' : 'bg-[#212121] border-white/10'
        }`}>
          <div className="py-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => {
                  changeLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isLightMode
                    ? i18n.language === lang.code ? 'text-gray-900 font-bold bg-black/5' : 'text-gray-500 hover:bg-black/5'
                    : i18n.language === lang.code ? 'text-white font-bold bg-white/5' : 'text-gray-400 hover:bg-white/5'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
                {i18n.language === lang.code && (
                  <div className="ml-auto">
                    <Flag size={15}/>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
