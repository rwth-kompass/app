import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { GraduationCap, Info, Loader2, Boxes, Bot, Trash2 } from 'lucide-react';
import { useTranslationProvider } from '../hooks/useTranslationProvider';
import LanguageSelector from '../components/LanguageSelector';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Model {
  id: string;
  name: string;
}

export default function Home() {
  const { t } = useTranslationProvider();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [models, setModels] = useState<Model[]>([]);
  const [selectedModel, setSelectedModel] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAccepted, setIsAccepted] = useState(true);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);



  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3003';

  useEffect(() => {
    const accepted = document.cookie.split('; ').some(row => row.startsWith('privacy-accepted='));
    setIsAccepted(accepted);
    fetchModels();

    const handleClickOutside = (event: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(event.target as Node)) {
        setIsModelOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 100;
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
      textareaRef.current.style.overflowY = scrollHeight > maxHeight ? 'auto' : 'hidden';
    }
  }, [input]);

  const handleAccept = () => {
    const date = new Date();
    date.setTime(date.getTime() + (30 * 24 * 60 * 60 * 1000));
    // document.cookie = `privacy-accepted=true; expires=${date.toUTCString()}; path=/`;
    setIsAccepted(true);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchModels = async () => {
    try {
      const response = await axios.get(`${SERVER_URL}/api/models`);
      const modelsData = response.data.data;
      if (Array.isArray(modelsData) && modelsData.length > 0) {
        setModels(modelsData);
        if (!selectedModel) {
          setSelectedModel(modelsData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async () => {
    if (!input.trim() || input.length > 1000 || isLoading || !selectedModel) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await axios.post(`${SERVER_URL}/api/chat/completions`, {
        model: selectedModel,
        messages: [...messages, userMessage],
      });

      const assistantMessage: Message = response.data.choices[0].message;
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: t('chat.error_message') }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen bg-[#161616] text-gray-200 overflow-hidden font-sans">
      <div className="flex-1 flex flex-col relative w-full">
        <header className="px-4 py-3 flex items-center justify-between sticky top-0 z-20 bg-gradient-to-b from-[#161616] via-[#161616]/80 to-transparent">
          <div className="flex-1 flex items-center">
            <LanguageSelector />
          </div>

          <div className="flex-1 flex justify-center">
            {messages.length > 0 && (
              <button
                onClick={() => setMessages([])}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-xs text-gray-300 hover:text-white"
                title={t('chat.clear_chat')}
              >
                <Trash2 size={14} />
                <span className="hidden md:inline tracking-wider font-medium">{t('chat.clear_chat')}</span>
              </button>
            )}
          </div>

          <div className="flex-1 flex justify-end">
            <button
              onClick={() => navigate('/info')}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-all border border-white/10 text-xs text-gray-300 hover:text-white"
              title={t('info.title')}
            >
              <Info size={16} />
              <span className="hidden md:inline text-xs tracking-wider">{t('info.title')}</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-4 md:px-0 relative z-10 -mt-14 pt-14">
          <div className="max-w-3xl mx-auto py-8">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center mt-20 md:mt-32 opacity-50 px-4 text-center">
                <GraduationCap size={64} className="md:w-20 md:h-20" />
                <h2 className="text-xl md:text-2xl font-semibold mt-4">{t('chat.title')}</h2>
                <p className="text-xs md:text-sm text-gray-400 mt-2 max-w-md">{t('chat.privacy_warning')}</p>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isPrivacy = msg.content.trim().startsWith('[DATENSCHUTZ]');
                
                return (
                  <div key={idx} className={`mb-6 md:mb-8 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[90%] md:max-w-[85%] px-3 py-2 md:px-4 md:py-2.5 rounded-[20px] md:rounded-[24px] ${
                      msg.role === 'user' 
                        ? 'bg-[#212121] text-white rounded-br-lg border border-white/[0.05]' 
                        : isPrivacy
                          ? 'bg-yellow-500/10 border border-yellow-500/40 text-yellow-200/90 rounded-bl-lg shadow-[0_0_20px_rgba(234,179,8,0.08)]'
                          : 'text-gray-200'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className={`flex items-center gap-2 mb-1.5 text-xs ${isPrivacy ? 'text-yellow-400 opacity-100 font-bold' : 'opacity-50'}`}>
                          <GraduationCap size={14} />
                          {t('chat.assistant')}
                        </div>
                      )}
                      <div className="text-sm md:text-[15px] leading-relaxed break-words markdown-content">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                          }}
                        >
                          {isPrivacy ? msg.content.trim().replace('[DATENSCHUTZ]', '').trim() : msg.content}
                        </ReactMarkdown>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="p-4 bg-[#161616]">
          <div className="max-w-3xl mx-auto relative group">
            <div className="relative flex items-start w-full bg-[#212121] rounded-[24px] md:rounded-[30px] border border-white/[0.03] focus-within:border-white/10 transition-all p-1.5 md:p-2 pr-2 md:pr-2">
              <div className="flex items-center pt-0.5" ref={modelRef}>
                {models.length === 0 ? (
                  <div className="flex items-center h-9 md:h-10 px-2 md:px-3 rounded-full hover:bg-white/5 cursor-wait opacity-50">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsModelOpen(!isModelOpen)}
                      className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all border border-white/10 ${
                        isModelOpen ? 'bg-white/15 border-white/20' : 'hover:bg-white/5'
                      }`}
                      title={models.find(m => m.id === selectedModel)?.name || selectedModel}
                    >
                      <Boxes size={18} className="text-gray-200" />
                    </button>

                    {isModelOpen && (
                      <div className="absolute bottom-full left-0 mb-3 w-64 bg-[#212121] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50">
                        <div className="p-2 border-b border-white/5">
                          <span className="px-3 py-1 text-[10px] font-bold text-gray-500 uppercase tracking-widest">{t('chat.models') || 'Models'}</span>
                        </div>
                        <div className="py-1 max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10">
                          {models.map((model) => (
                            <button
                              key={model.id}
                              onClick={() => {
                                setSelectedModel(model.id);
                                setIsModelOpen(false);
                              }}
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-white/5 ${
                                selectedModel === model.id ? 'text-white font-bold bg-white/5' : 'text-gray-400'
                              }`}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm">{model.name || model.id}</span>
                                <span className="text-[10px] opacity-40 font-mono">{model.id}</span>
                              </div>
                              {selectedModel === model.id && (
                                <Bot size={16} className="ml-auto text-white" />
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <textarea
                ref={textareaRef}
                value={input}
                disabled={!isAccepted}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                placeholder={isAccepted ? t('chat.placeholder') : t('chat.placeholder_accept_first')}
                rows={1}
                maxLength={1000}
                className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm md:text-[15px] py-2 md:py-2.5 px-2 md:px-3 outline-none disabled:opacity-50 scrollbar-thin scrollbar-thumb-white/10"
              />

              {input.length >= 500 && (
                <div className={`absolute -top-6 right-4 text-[10px] font-mono transition-colors ${
                  input.length >= 1000 ? 'text-red-500' : input.length > 700 ? 'text-yellow-500' : 'text-gray-500/50'
                }`}>
                  {input.length}/1000 characters
                </div>
              )}

              <div className="pt-0.5">
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading || !isAccepted}
                  className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all flex-shrink-0 ${
                    input.trim() && !isLoading && isAccepted ? 'bg-white text-black hover:opacity-90' : 'bg-white/5 text-white opacity-50'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <GraduationCap size={18} />
                  )}
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-center opacity-30">
              {t('chat.warning')}
            </div>
          </div>
        </div>
      </div>

      {!isAccepted && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md">
          <div className="bg-[#212121] max-w-md w-full rounded-3xl p-5 md:p-7 border border-white/5 shadow-2xl animate-in fade-in zoom-in duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl md:text-2xl font-bold text-white">{t('privacy.title')}</h3>
              <LanguageSelector align="right"/>
            </div>
            <div className="text-gray-400 text-sm md:text-[15px] space-y-4 mb-8 leading-relaxed">
              <p dangerouslySetInnerHTML={{ __html: t('privacy.paragraph1') }} />
              <p dangerouslySetInnerHTML={{ __html: t('privacy.paragraph2') }} />
              <p className="text-[11px] md:text-xs text-gray-500 italic">
                {t('privacy.paragraph3')}
              </p>
            </div>
            <button
              onClick={handleAccept}
              className="w-full py-3.5 bg-white text-black font-bold rounded-full hover:bg-gray-200 transition-all cursor-pointer active:scale-[0.98]"
            >
              {t('privacy.accept_button')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
