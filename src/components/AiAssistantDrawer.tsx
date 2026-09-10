import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Send,
  Sparkles,
  Bot,
  User,
  ShoppingBag,
  ArrowUpRight,
  RotateCcw,
  Zap,
  HelpCircle
} from 'lucide-react';
import { ChatMessage, Product } from '../types';
import { formatINR } from '../utils/format';

interface AiAssistantDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

const QUICK_PROMPTS = [
  '💻 Best coding laptop under ₹70,000',
  '📱 OnePlus 12R vs Galaxy S24 Ultra',
  '🎧 Best ANC earbuds under ₹5,000',
  '⚡ Dhamaka electronics deals today',
];

export const AiAssistantDrawer: React.FC<AiAssistantDrawerProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onAddToCart,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      role: 'assistant',
      content: `Namaste! I am your **Bazaaro AI Dost** — your personalized Indian electronics shopping advisor at Bazaaro (*"Sab kuch, ek bazaar mein"*). 🇮🇳\n\nTell me what you're looking for, your budget in ₹ INR, or ask me to compare processors, battery life, camera quality, and student/EMI deals!`,
      timestamp: 'Just now',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [extraProducts, setExtraProducts] = useState<Record<string, Product>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (userText: string) => {
    const text = userText.trim();
    if (!text || loading) return;

    const userMessage: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      // Build catalog summary for server-side AI context
      const catalogSummary = products
        .map((p) => `${p.name} (ID: ${p.id}) - Price: ₹${p.price} (M.R.P: ₹${p.originalPrice}), Brand: ${p.brand}, Category: ${p.category}, Rating: ${p.rating}/5`)
        .join('\n');

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          catalogSummary,
        }),
      });

      const data = await response.json();

      if (Array.isArray(data.recommendedProducts) && data.recommendedProducts.length > 0) {
        const map: Record<string, Product> = {};
        data.recommendedProducts.forEach((p: Product) => {
          map[p.id] = p;
        });
        setExtraProducts((prev) => ({ ...prev, ...map }));
      }

      const assistantMessage: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'assistant',
        content: data.reply || 'Namaste! How else can I assist you with electronics today?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      console.error('Chat error:', err);
      setMessages((prev) => [
        ...prev,
        {
          id: `a_${Date.now()}`,
          role: 'assistant',
          content: 'Namaste! I encountered a brief network delay. Please ask me again or check our catalog items directly.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: `m_${Date.now()}`,
        role: 'assistant',
        content: `Namaste! New conversation started. What electronic gadget are you looking for today?`,
        timestamp: 'Just now',
      },
    ]);
  };

  // Extract products referenced like [PRODUCT:p1] in text
  const extractProductIds = (text: string): string[] => {
    const matches = text.match(/\[PRODUCT:([a-zA-Z0-9_-]+)\]/g);
    if (!matches) return [];
    return matches.map((m) => m.replace('[PRODUCT:', '').replace(']', ''));
  };

  // Clean raw text from [PRODUCT:px] tags for rendering
  const cleanMessageText = (text: string): string => {
    return text.replace(/\[PRODUCT:([a-zA-Z0-9_-]+)\]/g, '');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-slate-900 to-amber-950 text-white">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-slate-950 font-bold shadow-sm">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-bold text-sm">Bazaaro AI Dost</h3>
                <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-slate-950">
                  GEMINI
                </span>
              </div>
              <p className="text-[10px] text-amber-200/80">Tech Shopping Guru • INR Pricing</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-300 hover:text-white p-1 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const referencedIds = !isUser ? extractProductIds(msg.content) : [];
            const referencedProducts = referencedIds
              .map((id) => products.find((p) => p.id === id) || extraProducts[id])
              .filter(Boolean) as Product[];

            return (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-slate-900 text-white rounded-br-xs shadow-xs'
                        : 'bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs shadow-xs'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {cleanMessageText(msg.content)}
                    </div>
                    <div
                      className={`text-[9px] mt-1.5 ${
                        isUser ? 'text-slate-400 text-right' : 'text-slate-400'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Render Embedded Product Recommendations */}
                  {referencedProducts.length > 0 && (
                    <div className="space-y-2 pt-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                        Recommended from Bazaaro:
                      </div>
                      {referencedProducts.map((prod) => (
                        <div
                          key={prod.id}
                          className="p-2.5 rounded-xl bg-white border border-amber-200/90 shadow-xs flex items-center gap-2.5"
                        >
                          <img
                            src={prod.images[0]}
                            alt={prod.name}
                            referrerPolicy="no-referrer"
                            className="w-12 h-12 object-contain rounded-lg bg-slate-50 p-1 border border-slate-100 shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-xs font-bold text-slate-900 truncate">
                              {prod.name}
                            </div>
                            <div className="text-[11px] font-black text-amber-600">
                              {formatINR(prod.price)}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <button
                              onClick={() => {
                                onSelectProduct(prod);
                              }}
                              className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-800 text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              Specs
                            </button>
                            <button
                              onClick={() => {
                                onAddToCart(prod);
                              }}
                              className="px-2 py-1 rounded bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-semibold transition-colors cursor-pointer"
                            >
                              Add
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {isUser && (
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex gap-2.5 justify-start items-center text-xs text-slate-500">
              <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4" />
              </div>
              <div className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-600 rounded-bl-xs flex items-center gap-1.5 shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-100"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-bounce delay-200"></span>
                <span className="ml-1 text-[11px] font-medium text-slate-500">Bazaaro AI Dost is thinking...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        <div className="p-2 border-t border-slate-100 bg-white overflow-x-auto flex gap-1.5 scrollbar-none">
          {QUICK_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              onClick={() => handleSend(prompt)}
              className="text-[11px] whitespace-nowrap px-2.5 py-1 rounded-full bg-slate-100 hover:bg-amber-100 hover:text-amber-900 text-slate-700 font-medium transition-colors cursor-pointer shrink-0"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about specs, budget in ₹, deals..."
              className="flex-1 px-3.5 py-2 text-xs border border-slate-300 rounded-full focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-hidden bg-slate-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="p-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 disabled:opacity-50 text-white rounded-full transition-all shadow-xs cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="text-[10px] text-center text-slate-400 mt-1.5">
            Powered by Gemini • 100% Genuine Indian Specs & Deals
          </div>
        </div>
      </div>
    </div>
  );
};
