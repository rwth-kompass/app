import { useNavigate } from 'react-router-dom';
import { useTranslationProvider } from '../hooks/useTranslationProvider';
import { ChevronLeft, Info, Heart } from 'lucide-react';

export default function InfoPage() {
  const { t } = useTranslationProvider();
  const navigate = useNavigate();

  return (
    <div className="flex flex-col min-h-screen bg-[#161616] text-gray-200 font-sans">
      <header className="px-4 py-3 flex items-center justify-between bg-[#161616]/80 backdrop-blur-xl sticky top-0 z-30">
        <div className="flex-1">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-xs font-medium text-gray-300 hover:text-white"
          >
            <ChevronLeft size={16} />
            <span className="hidden sm:inline">{t('info.back')}</span>
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-8 md:py-12">
        <div className="max-w-3xl mx-auto space-y-10 md:space-y-12">
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-white/5 mb-2 shadow-inner border border-white/5">
              <Info className="text-white" size={28} />
            </div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">{t('info.title')}</h2>
          </div>

          <div className="grid gap-5 md:gap-6">
            <div className="bg-[#212121] rounded-3xl p-6 md:p-8 border border-white/[0.03] hover:border-white/10 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 md:p-2.5 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                  <Info size={22} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wide text-xs md:text-base font-bold uppercase tracking-wider tracking-tighter">{t('info.about_title')}</h3>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">
                {t('info.about_text')}
              </p>
            </div>

            <div className="bg-[#212121] rounded-3xl p-6 md:p-8 border border-white/[0.03] hover:border-white/10 transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-2 md:p-2.5 rounded-xl bg-red-500/10 text-red-400 group-hover:scale-110 transition-transform">
                  <Heart size={22} className="md:w-6 md:h-6" />
                </div>
                <h3 className="text-lg md:text-xl font-bold text-white uppercase tracking-wide text-xs md:text-base font-bold uppercase tracking-wider tracking-tighter">{t('info.credits_title')}</h3>
              </div>
              <p className="text-gray-400 leading-relaxed text-sm md:text-base">
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

