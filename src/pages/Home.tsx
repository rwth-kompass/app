import { useState, useEffect, useRef } from 'react';
import { GraduationCap, Info, Loader2, Boxes, Bot, Trash2, Sun, Moon } from 'lucide-react';
import { useTranslationProvider } from '../hooks/useTranslationProvider';
import { useNavigate } from 'react-router-dom';
import LanguageSelector from '../components/LanguageSelector';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAccepted, setIsAccepted] = useState(true);
  const [isModelOpen, setIsModelOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [starterQuestions, setStarterQuestions] = useState<string[]>([]);
  const [externalLink, setExternalLink] = useState<{ url: string; isOpen: boolean }>({ url: '', isOpen: false });
  const [isLightMode, setIsLightMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    return saved === 'light';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const modelRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const contentQueueRef = useRef<string>('');
  const animationFrameRef = useRef<number | null>(null);

  const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3003';

  useEffect(() => {
    if (isLightMode) {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
    localStorage.setItem('theme', isLightMode ? 'light' : 'dark');
  }, [isLightMode]);

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
    generateStarterQuestions();
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const generateStarterQuestions = () => {
    const questions = [
      'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'
    ];
    const shuffled = [...questions].sort(() => 0.5 - Math.random());
    setStarterQuestions(shuffled.slice(0, 4));
  };

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
    if (shouldAutoScroll) {
      scrollToBottom();
      setTimeout(scrollToBottom, 50);
    }
  }, [messages, isStreaming, isTyping, shouldAutoScroll]);

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
    if (messagesEndRef.current) {
      const scrollContainer = messagesEndRef.current.closest('.overflow-y-auto');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    if (isStreaming || isTyping) {
      const startTyping = () => {
        if (contentQueueRef.current.length > 0) {
          setIsTyping(true);
          const charsToAdd = Math.max(1, Math.floor(contentQueueRef.current.length / 20));
          const chunk = contentQueueRef.current.slice(0, charsToAdd);
          contentQueueRef.current = contentQueueRef.current.slice(charsToAdd);

          setMessages((prev) => {
            const newMessages = [...prev];
            const lastMessage = newMessages[newMessages.length - 1];
            if (lastMessage && lastMessage.role === 'assistant') {
              const updatedContent = lastMessage.content + chunk;
              if (updatedContent !== lastMessage.content) {
                newMessages[newMessages.length - 1] = {
                  ...lastMessage,
                  content: updatedContent
                };
                return newMessages;
              }
            }
            return prev;
          });

          animationFrameRef.current = requestAnimationFrame(startTyping);
        } else if (isStreaming) {
          animationFrameRef.current = requestAnimationFrame(startTyping);
        } else {
          setIsTyping(false);
        }
      };

      animationFrameRef.current = requestAnimationFrame(startTyping);
    } else {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isStreaming, isTyping]);

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput !== undefined ? overrideInput : input;
    if (!textToSend.trim() || textToSend.length > 1000 || isLoading || !selectedModel) return;

    const userMessage: Message = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMessage]);
    if (overrideInput === undefined) {
      setInput('');
    }
    setIsLoading(true);
    contentQueueRef.current = '';
    setShouldAutoScroll(true);

    let assistantMessageAdded = false;
    
    try {
      const response = await fetch(`${SERVER_URL}/api/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [...messages, userMessage],
          stream: true,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Response not ok:', errorText);
        throw new Error('Chat completion failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      assistantMessageAdded = true;
      setIsStreaming(true);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = (buffer + chunk).split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;
            if (trimmedLine.startsWith('data: ')) {
              const data = trimmedLine.slice(6).trim();
              if (data === '[DONE]') {
                continue; 
              }
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices[0]?.delta?.content || '';
                if (content) {
                  contentQueueRef.current += content;
                  if (!isTyping) setIsTyping(true);
                }
              } catch (e) {
                console.error('Error parsing stream chunk', e, trimmedLine);
              }
            }
          }
        }
      }
    } catch {
      setMessages((prev) => {
        if (assistantMessageAdded) {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.role === 'assistant') {
            return [
              ...newMessages.slice(0, -1),
              { ...lastMessage, content: t('chat.error_message') }
            ];
          }
        }
        return [...prev, { role: 'assistant', content: t('chat.error_message') }];
      });
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Use a slightly larger buffer for isAtBottom to handle various zoom levels/resolutions
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 50;
    if (isStreaming || isTyping) {
      if (isAtBottom) {
        setShouldAutoScroll(true);
      } else {
        setShouldAutoScroll(false);
      }
    }
  };

  return (
    <div className={`flex h-[100dvh] w-full overflow-hidden font-sans transition-colors duration-300 ${
      isLightMode ? 'bg-[#f5f5f5] text-gray-800' : 'bg-[#161616] text-gray-200'
    }`}>
      <div className="flex-1 flex flex-col relative w-full h-full">
        <header className={`px-4 py-3 flex items-center justify-between fixed top-0 left-0 right-0 z-30 transition-all duration-300 bg-gradient-to-b ${
          isLightMode ? 'from-[#f5f5f5] via-[#f5f5f5]/95' : 'from-[#161616] via-[#161616]/95'
        } to-transparent`}>
          <div className="flex-1 flex items-center gap-2">
            <LanguageSelector />
            <button
              onClick={() => setIsLightMode(!isLightMode)}
              className={`flex items-center justify-center w-7.5 h-7.5 rounded-full transition-all duration-300 border ${
                isLightMode 
                  ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-600' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300'
              }`}
              title={isLightMode ? 'Switch to dark mode' : 'Switch to light mode'}
            >
              {isLightMode ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>

          <div className="flex-1 flex justify-center">
            {messages.length > 0 && (
              <button
                onClick={() => {
                  setMessages([]);
                  generateStarterQuestions();
                }}
                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all duration-300 border text-xs ${
                  isLightMode 
                    ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-600 hover:text-gray-900' 
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
                }`}
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
              className={`flex items-center gap-2 px-2.5 py-1.5 rounded-full transition-all duration-300 border text-xs ${
                isLightMode 
                  ? 'bg-black/5 hover:bg-black/10 border-black/10 text-gray-600 hover:text-gray-900' 
                  : 'bg-white/5 hover:bg-white/10 border-white/10 text-gray-300 hover:text-white'
              }`}
              title={t('info.title')}
            >
              <Info size={16} />
              <span className="hidden md:inline text-xs tracking-wider">{t('info.title')}</span>
            </button>
          </div>
        </header>

        <div 
          className="flex-1 overflow-y-auto px-4 md:px-0 relative z-10"
          onScroll={handleScroll}
        >
          <div className="max-w-3xl mx-auto py-8 pt-24 pb-48">
            {messages.length === 0 ? (
              <div className={`h-full flex flex-col items-center justify-center mt-20 md:mt-32 opacity-50 px-4 text-center transition-colors duration-300 ${
                isLightMode ? 'text-gray-600' : ''
              }`}>
                <GraduationCap size={64} className="md:w-20 md:h-20" />
                <h2 className="text-xl md:text-2xl font-semibold mt-4">{t('chat.title')}</h2>
                <p className={`text-xs md:text-sm mt-2 max-w-md transition-colors duration-300 ${isLightMode ? 'text-gray-500' : 'text-gray-400'}`}>{t('chat.privacy_warning')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8 max-w-2xl w-full px-4">
                  {starterQuestions.map((qKey) => (
                    <button
                      key={qKey}
                      onClick={() => handleSend(t(`chat.starter_questions.${qKey}`))}
                      disabled={!isAccepted || isLoading}
                      className={`text-left p-4 rounded-xl border text-sm transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] ${
                        isLightMode
                          ? 'bg-white border-black/5 hover:border-black/20 text-gray-700 shadow-sm'
                          : 'bg-white/5 border-white/5 hover:border-white/20 text-gray-300 shadow-lg'
                      }`}
                    >
                      {t(`chat.starter_questions.${qKey}`)}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => {
                const privacyRegex = /^\[(DATENSCHUTZ|PRIVACY)\]/i;
                const abortRegex = /^\[(ABBRUCH|ABORT)\]/i;
                const offTopicRegex = /^\[OFF-TOPIC\]/i;
                const isPrivacy = msg.role === 'assistant' && privacyRegex.test(msg.content.trim());
                const isAbort = msg.role === 'assistant' && abortRegex.test(msg.content.trim());
                const isOffTopic = msg.role === 'assistant' && offTopicRegex.test(msg.content.trim());
                const hasTable = msg.role === 'assistant' && /\|.+\|/.test(msg.content) && msg.content.includes('|---');

                return (
                  <div key={idx} className={`mb-6 md:mb-8 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`px-3 py-2 md:px-4 md:py-2.5 rounded-[20px] md:rounded-[24px] transition-colors duration-300 ${
                      hasTable ? 'max-w-full w-full' : 'max-w-[90%] md:max-w-[85%]'
                    } ${
                      msg.role === 'user' 
                        ? isLightMode
                          ? 'bg-white text-gray-800 rounded-br-lg border border-black/[0.08] shadow-sm'
                          : 'bg-[#212121] text-white rounded-br-lg border border-white/[0.05]'
                        : isAbort
                          ? isLightMode
                            ? 'bg-red-500/15 border border-red-500/50 text-red-800 rounded-bl-lg shadow-[0_0_20px_rgba(239,68,68,0.1)]'
                            : 'bg-red-500/10 border border-red-500/40 text-red-100 rounded-bl-lg shadow-[0_0_20px_rgba(239,68,68,0.08)]'
                          : isPrivacy
                            ? isLightMode
                              ? 'bg-yellow-500/15 border border-yellow-500/50 text-yellow-800 rounded-bl-lg shadow-[0_0_20px_rgba(234,179,8,0.1)]'
                              : 'bg-yellow-500/10 border border-yellow-500/40 text-yellow-100 rounded-bl-lg shadow-[0_0_20px_rgba(234,179,8,0.08)]'
                            : isOffTopic
                              ? isLightMode
                                ? 'bg-blue-500/15 border border-blue-500/50 text-blue-800 rounded-bl-lg shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                : 'bg-blue-500/10 border border-blue-500/40 text-blue-100 rounded-bl-lg shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                              : isLightMode ? 'text-gray-800' : 'text-gray-200'
                    }`}>
                      {msg.role === 'assistant' && (
                        <div className={`flex items-center gap-2 mb-1.5 text-xs transition-colors duration-300 ${
                          isAbort
                            ? isLightMode ? 'text-red-700 opacity-100 font-bold' : 'text-red-400 opacity-100 font-bold'
                            : isPrivacy 
                              ? isLightMode ? 'text-yellow-700 opacity-100 font-bold' : 'text-yellow-400 opacity-100 font-bold' 
                              : isOffTopic
                                ? isLightMode ? 'text-blue-700 opacity-100 font-bold' : 'text-blue-400 opacity-100 font-bold'
                                : 'opacity-50'
                        }`}>
                          <GraduationCap size={14} />
                          {t('chat.assistant')}
                        </div>
                      )}
                      <div className="text-sm md:text-[15px] leading-relaxed break-words markdown-content overflow-hidden">
                        {msg.role === 'assistant' && msg.content === '' && isStreaming && !isTyping ? (
                          <div className="flex items-center gap-1.5 py-1">
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                            <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                          </div>
                        ) : (
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              a: ({ node, ...props }) => (
                                <a
                                  {...props}
                                  onClick={(e) => {
                                    e.preventDefault();
                                    setExternalLink({ url: props.href || '', isOpen: true });
                                  }}
                                  className={`underline transition-colors cursor-pointer ${
                                    isLightMode 
                                      ? 'text-blue-600 decoration-blue-600/30 hover:decoration-blue-600/60' 
                                      : 'text-white decoration-white/20 hover:decoration-white/50'
                                  }`}
                                />
                              ),
                              table: ({ node, ...props }) => (
                                <div className="table-wrapper">
                                  <table {...props} />
                                </div>
                              )
                            }}
                          >
                            {isAbort
                              ? msg.content.trim().replace(abortRegex, '').trim()
                              : isPrivacy
                                ? msg.content.trim().replace(privacyRegex, '').trim()
                                : isOffTopic
                                  ? msg.content.trim().replace(offTopicRegex, '').trim()
                                  : msg.content}
                          </ReactMarkdown>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className={`p-4 pb-4 transition-colors duration-300 fixed bottom-0 left-0 right-0 z-20 ${isLightMode ? 'bg-gradient-to-t from-[#f5f5f5] via-[#f5f5f5] to-transparent' : 'bg-gradient-to-t from-[#161616] via-[#161616] to-transparent'}`}>
          <div className="max-w-3xl mx-auto relative group px-4 md:px-0">
            <div className={`relative flex items-start w-full rounded-[24px] md:rounded-[30px] border transition-all duration-300 p-1.5 md:p-2 pr-2 md:pr-2 shadow-xl ${
              isLightMode 
                ? 'bg-white border-black/[0.08] focus-within:border-black/15 shadow-black/[0.03]' 
                : 'bg-[#212121] border-white/[0.03] focus-within:border-white/10 shadow-black/40'
            }`}>
              <div className="flex items-center pt-0.5" ref={modelRef}>
                {models.length === 0 ? (
                  <div className={`flex items-center h-9 md:h-10 px-2 md:px-3 rounded-full cursor-wait opacity-50 ${
                    isLightMode ? 'hover:bg-black/5' : 'hover:bg-white/5'
                  }`}>
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setIsModelOpen(!isModelOpen)}
                      className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 border ${
                        isLightMode
                          ? isModelOpen ? 'bg-black/10 border-black/15' : 'border-black/10 hover:bg-black/5'
                          : isModelOpen ? 'bg-white/15 border-white/20' : 'border-white/10 hover:bg-white/5'
                      }`}
                      title={models.find(m => m.id === selectedModel)?.name || selectedModel}
                    >
                      <Boxes size={18} className={`transition-colors duration-300 ${isLightMode ? 'text-gray-600' : 'text-gray-200'}`} />
                    </button>

                    {isModelOpen && (
                      <div className={`absolute bottom-full left-0 mb-3 w-64 border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200 z-50 transition-colors ${
                        isLightMode ? 'bg-white border-black/10' : 'bg-[#212121] border-white/10'
                      }`}>
                        <div className={`p-2 border-b ${isLightMode ? 'border-black/5' : 'border-white/5'}`}>
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
                              className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                                isLightMode
                                  ? selectedModel === model.id ? 'text-gray-900 font-bold bg-black/5' : 'text-gray-500 hover:bg-black/5'
                                  : selectedModel === model.id ? 'text-white font-bold bg-white/5' : 'text-gray-400 hover:bg-white/5'
                              }`}
                            >
                              <div className="flex flex-col items-start">
                                <span className="text-sm">{model.name || model.id}</span>
                                <span className="text-[10px] opacity-40 font-mono">{model.id}</span>
                              </div>
                              {selectedModel === model.id && (
                                <Bot size={16} className={`ml-auto ${isLightMode ? 'text-gray-900' : 'text-white'}`} />
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
                className={`flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm md:text-[15px] py-2 md:py-2.5 px-2 md:px-3 outline-none disabled:opacity-50 scrollbar-thin transition-colors duration-300 ${
                  isLightMode ? 'text-gray-800 placeholder:text-gray-400' : 'text-gray-200 placeholder:text-gray-500'
                }`}
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
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading || !isAccepted}
                  className={`flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-full transition-all duration-300 flex-shrink-0 ${
                    input.trim() && !isLoading && isAccepted 
                      ? isLightMode ? 'bg-gray-900 text-white hover:opacity-90' : 'bg-white text-black hover:opacity-90'
                      : isLightMode ? 'bg-black/5 text-gray-400 opacity-50' : 'bg-white/5 text-white opacity-50'
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
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-md ${
          isLightMode ? 'bg-white/90' : 'bg-black/95'
        }`}>
          <div className={`max-w-md w-full rounded-3xl p-5 md:p-7 border shadow-2xl animate-in fade-in zoom-in duration-300 ${
            isLightMode ? 'bg-white border-black/10' : 'bg-[#212121] border-white/5'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-xl md:text-2xl font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{t('privacy.title')}</h3>
              <LanguageSelector align="right"/>
            </div>
            <div className={`text-sm md:text-[15px] space-y-4 mb-8 leading-relaxed ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
              <p dangerouslySetInnerHTML={{ __html: t('privacy.paragraph1') }} />
              <p dangerouslySetInnerHTML={{ __html: t('privacy.paragraph2') }} />
              <p className={`text-[11px] md:text-xs italic ${isLightMode ? 'text-gray-500' : 'text-gray-500'}`}>
                {t('privacy.paragraph3')}
              </p>
            </div>
            <button
              onClick={handleAccept}
              className={`w-full py-3.5 font-bold rounded-full transition-all cursor-pointer active:scale-[0.98] ${
                isLightMode ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'
              }`}
            >
              {t('privacy.accept_button')}
            </button>
          </div>
        </div>
      )}

      {externalLink.isOpen && (
        <div className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm p-4 ${
          isLightMode ? 'bg-black/40' : 'bg-black/80'
        }`}>
          <div className={`max-w-lg w-full rounded-[24px] p-6 md:p-7 border shadow-2xl animate-in fade-in zoom-in duration-200 ${
            isLightMode ? 'bg-white border-black/10' : 'bg-[#212121] border-white/10'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-bold ${isLightMode ? 'text-gray-900' : 'text-white'}`}>{t('external_link.title')}</h3>
              <LanguageSelector align="right" />
            </div>
            
            <p className={`text-sm leading-relaxed mb-4 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
              {t('external_link.message')}
            </p>

            <div className={`rounded-xl p-3 mb-6 border ${
              isLightMode ? 'bg-gray-100 border-black/5' : 'bg-black/20 border-white/5'
            }`}>
              <span className="text-[9px] font-bold text-gray-500 uppercase tracking-widest block mb-0.5">
                {t('external_link.url_label')}
              </span>
              <span className={`text-xs break-all font-mono opacity-80 ${isLightMode ? 'text-gray-600' : 'text-gray-400'}`}>
                {externalLink.url}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setExternalLink({ ...externalLink, isOpen: false })}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all active:scale-[0.98] ${
                  isLightMode ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-white/5 text-gray-400 hover:bg-white/10'
                }`}
              >
                {t('external_link.cancel')}
              </button>
              <button
                onClick={() => {
                  window.open(externalLink.url, '_blank', 'noopener,noreferrer');
                  setExternalLink({ ...externalLink, isOpen: false });
                }}
                className={`flex-1 py-3 text-sm font-bold rounded-xl transition-all active:scale-[0.98] ${
                  isLightMode ? 'bg-gray-900 text-white hover:bg-gray-800' : 'bg-white text-black hover:bg-gray-200'
                }`}
              >
                {t('external_link.continue')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
