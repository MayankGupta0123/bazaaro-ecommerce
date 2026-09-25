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
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-md flex justify-end">
      <div className="w-full max-w-md bg-bazaaro-surface h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-300 border-l border-slate-700/50">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-700/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-bazaaro-dark border border-bazaaro-border/80 flex items-center justify-center text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-base text-slate-100">Bazaaro AI Dost</h3>
              <p className="text-xs text-slate-400">Your AI Shopping Assistant</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetChat}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
              title="Reset Chat"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 hover:bg-slate-800 p-2 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-bazaaro-surface">
          {messages.map((msg) => {
            const isUser = msg.role === 'user';
            const referencedIds = !isUser ? extractProductIds(msg.content) : [];
            const referencedProducts = referencedIds
              .map((id) => products.find((p) => p.id === id) || extraProducts[id])
              .filter(Boolean) as Product[];

            return (
              <div
                key={msg.id}
                className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-8 h-8 rounded-full bg-bazaaro-dark border border-bazaaro-border/80 text-cyan-400 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[85%] space-y-2`}>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed ${
                      isUser
                        ? 'bg-slate-700 text-slate-100 rounded-br-sm'
                        : 'bg-bazaaro-dark/90 text-slate-300 border border-bazaaro-border/80 rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {cleanMessageText(msg.content)}
                    </div>
                    <div
                      className={`text-[10px] mt-2 font-medium ${
                        isUser ? 'text-slate-300 text-right' : 'text-slate-500'
                      }`}
                    >
                      {msg.timestamp}
                    </div>
                  </div>

                  {/* Render Embedded Product Recommendations */}
                  {referencedProducts.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
                        Recommended Products:
                      </div>
                      {referencedProducts.map((prod) => (
                         <div
                         key={prod.id}
                         className="p-3 rounded-xl bg-slate-800/30 border border-slate-700/50 flex items-center gap-3 hover:border-slate-600 transition-colors"
                       >
                         <div className="w-14 h-14 shrink-0 rounded-xl bg-white flex items-center justify-center p-1.5 overflow-hidden shadow-xs border border-slate-700/40">
                           <img
                             src={prod.images[0]}
                             alt={prod.name}
                             referrerPolicy="no-referrer"
                             className="w-full h-full object-contain"
                           />
                         </div>
                         <div className="flex-1 min-w-0">
                           <div className="text-xs font-semibold text-slate-200 truncate mb-1">
                             {prod.name}
                           </div>
                           <div className="text-xs font-medium text-slate-300">
                             {formatINR(prod.price)}
                           </div>
                         </div>
                         <div className="flex flex-col gap-1.5 shrink-0">
                           <button
                             onClick={() => {
                               onSelectProduct(prod);
                             }}
                             className="px-2.5 py-1.5 rounded-lg hover:bg-slate-700 border border-slate-600 text-slate-300 text-[10px] font-semibold transition-colors cursor-pointer"
                           >
                             View
                           </button>
                           <button
                             onClick={() => {
                               onAddToCart(prod);
                             }}
                             className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-white text-slate-900 text-[10px] font-semibold transition-colors cursor-pointer"
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
                 <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center shrink-0 mt-1">
                   <User className="w-4 h-4" />
                 </div>
               )}
             </div>
           );
         })}

         {loading && (
           <div className="flex gap-3 justify-start items-center text-sm text-slate-500">
             <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center shrink-0">
               <Bot className="w-4 h-4" />
             </div>
             <div className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50 text-slate-400 rounded-bl-sm flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-75"></span>
               <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-pulse delay-150"></span>
               <span className="ml-2 text-xs font-medium text-slate-400 tracking-wide">Thinking...</span>
             </div>
           </div>
         )}

         <div ref={messagesEndRef} />
       </div>

       {/* Quick Prompts */}
       <div className="p-3 border-t border-slate-700/50 bg-bazaaro-surface overflow-x-auto flex gap-2 scrollbar-none">
         {QUICK_PROMPTS.map((prompt) => (
           <button
             key={prompt}
             onClick={() => handleSend(prompt)}
             className="text-xs whitespace-nowrap px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 hover:border-slate-500 hover:bg-slate-700 text-slate-300 hover:text-slate-100 transition-colors cursor-pointer shrink-0"
           >
             {prompt}
           </button>
         ))}
       </div>

       {/* Input Bar */}
       <div className="p-4 bg-bazaaro-surface border-t border-slate-700/50">
         <form
           onSubmit={(e) => {
             e.preventDefault();
             handleSend(input);
           }}
           className="flex items-center gap-3 relative"
         >
           <input
             type="text"
             value={input}
             onChange={(e) => setInput(e.target.value)}
             placeholder="Ask about specs, deals, or comparisons..."
             className="flex-1 px-4 py-3.5 pr-12 text-sm border border-slate-700 rounded-xl focus:border-slate-500 outline-hidden bg-slate-800/50 text-slate-200 transition-colors"
           />
           <button
             type="submit"
             disabled={!input.trim() || loading}
             className="absolute right-2 p-2 bg-slate-100 hover:bg-white disabled:opacity-50 text-slate-900 rounded-lg transition-colors cursor-pointer"
           >
             <Send className="w-4 h-4" />
           </button>
         </form>
         <div className="text-[10px] text-center text-slate-500 mt-3 font-medium">
           Powered by Gemini AI
         </div>
       </div>
     </div>
   </div>
  );
};
