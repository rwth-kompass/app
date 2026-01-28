import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslationProvider } from '../hooks/useTranslationProvider';
import { ChevronLeft, Info, Heart } from 'lucide-react';

export default function InfoPage() {
  const { t } = useTranslationProvider();
  const navigate = useNavigate();
  const [isLightMode, setIsLightMode] = useState(() => document.documentElement.classList.contains('light'));

  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsLightMode(document.documentElement.classList.contains('light'));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  return (
    <div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${
      isLightMode ? 'bg-[#f5f5f5] text-gray-800' : 'bg-[#161616] text-gray-200'
    }`}>
      <header className={`px-4 py-3 flex items-center justify-between backdrop-blur-xl sticky top-0 z-30 ${
        isLightMode ? 'bg-[#f5f5f5]/80' : 'bg-[#161616]/80'
      }`}>
        <div className="flex-1">
          <button
            onClick={() => navigate('/')}
            className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all border text-xs font-medium ${
              isLightMode 
                ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-600 hover:text-gray-900' 
                : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">{t('info.back')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-10 md:space-y-12">
          <div className="text-center space-y-4">
            <div className={`inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl mb-2 shadow-inner border ${
              isLightMode ? 'bg-black/5 border-black/5' : 'bg-white/5 border-white/5'
            }`}>
              <Info className={isLightMode ? 'text-gray-800' : 'text-white'} size={28} />
            </div>
            <h2 className={`text-2xl md:text-3xl font-extrabold tracking-tight ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{t('info.title')}</h2>
          </div>

          <div className="grid gap-5 md:gap-6">
            <div className={`rounded-3xl p-6 md:p-8 border transition-all group ${
              isLightMode 
                ? 'bg-white border-black/[0.05] hover:border-black/10 shadow-sm' 
                : 'bg-[#212121] border-white/[0.03] hover:border-white/10'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 md:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <Info size={22} className="md:w-6 md:h-6" />
                </div>
                <h3 className={`text-lg md:text-xl font-bold uppercase tracking-wide text-xs md:text-base font-bold uppercase tracking-wider tracking-tighter ${
                  isLightMode ? 'text-gray-900' : 'text-white'
                }`}>{t('info.about_title')}</h3>
              </div>
              <p className={`leading-relaxed text-sm md:text-base ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {t('info.about_text')}
              </p>
            </div>

            <div className={`rounded-3xl p-6 md:p-8 border transition-all group ${
              isLightMode 
                ? 'bg-white border-black/[0.05] hover:border-black/10 shadow-sm' 
                : 'bg-[#212121] border-white/[0.03] hover:border-white/10'
            }`}>
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 md:p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                  <Heart size={22} className="md:w-6 md:h-6" />
                </div>
                <h3 className={`text-lg md:text-xl font-bold uppercase tracking-wide text-xs md:text-base font-bold uppercase tracking-wider tracking-tighter ${
                  isLightMode ? 'text-gray-900' : 'text-white'
                }`}>{t('info.credits_title')}</h3>
              </div>
              <p className={`leading-relaxed text-sm md:text-base ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {t('info.credits_text')}
              </p>
            </div>
          </div>

          <footer className="text-center opacity-30 text-xs">
            © {new Date().getFullYear()} {t('chat.title')} • Aachen, Germany
            <br />
            https://github.com/rwth-kompass/app
          </footer>
        </div>
      </main>
    </div>
  );
}

