"use client";

import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, X, Send, Bot, Building2, MapPin, BadgePercent, Landmark, Sparkles } from 'lucide-react';

interface ChatMessage {
  id: string;
  replyToId?: string;
  role: 'user' | 'assistant';
  content: string;
}

interface MicrositeChatbotProps {
  slug: string;
  propertyTitle: string;
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export default function MicrositeChatbot({ slug, propertyTitle }: MicrositeChatbotProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome message
  useEffect(() => {
    setMessages([
      {
        id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(),
        role: 'assistant',
        content: `Hi there! I am your AI assistant for **${propertyTitle}**. Ask me anything about the property pricing, specs, amenities, or nearby colleges, schools, malls, and hospital locations.`
      }
    ]);
  }, [propertyTitle]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  // Accessibility: Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  useEffect(() => {
    let scrollY = 0;
    if (isOpen) {
      scrollY = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
    } else {
      const top = document.body.style.top;
      if (top) {
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        window.scrollTo(0, parseInt(top || '0') * -1);
      }
    }
    return () => {
      if (document.body.style.position === 'fixed') {
        const top = document.body.style.top;
        document.body.style.position = '';
        document.body.style.top = '';
        document.body.style.width = '';
        if (top) {
          window.scrollTo(0, parseInt(top || '0') * -1);
        }
      }
    };
  }, [isOpen]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsgId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString();
    const userMsg: ChatMessage = { id: userMsgId, role: 'user', content: text };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);
    console.log('Sending message to AI:', text);

    try {
      const response = await fetch(`${API_URL}/smart-links/${slug}/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ id: m.id, replyToId: m.replyToId, role: m.role, content: m.content }))
        }),
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch response: ${response.status} - ${errorText}`);
      }

      const responseJson = await response.json() as { data: { id: string, replyToId: string, answer: string } };
      console.log('AI Response raw JSON:', responseJson);
      
      const data = responseJson.data;
      if (!data || !data.answer) {
        throw new Error('Invalid response format: missing data or answer');
      }

      console.log('AI Response unwrapped data:', data);
      setMessages(prev => [...prev, { id: data.id, replyToId: data.replyToId, role: 'assistant', content: data.answer }]);
    } catch (error) {
      console.error('Chat error details:', error);
      setMessages(prev => [
        ...prev,
        { id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(), role: 'assistant', content: 'Oops! I had trouble connecting. Please try again in a moment.' }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuestion = (question: string) => {
    handleSendMessage(question);
  };

  return (
    <>
      {/* Floating Chat Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-[88px] md:bottom-6 right-6 z-[9999] px-4 md:px-5 py-3 md:py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_8px_30px_rgb(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgb(79,70,229,0.3)] transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-2.5 border border-white/10 group"
        aria-label="Open Chatbot"
      >
        {isOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <>
            <Sparkles className="h-5 w-5 animate-pulse" />
            <span className="font-bold text-sm tracking-wide pr-1">Ask AI</span>
          </>
        )}
      </button>

      {/* Premium Chat Panel */}
      {isOpen && (
        <div className="fixed bottom-0 md:bottom-24 left-0 md:left-auto right-0 md:right-6 z-[9999] w-full md:w-[380px] h-[85dvh] md:h-[520px] max-h-[calc(100dvh-40px)] md:max-h-[calc(100vh-120px)] rounded-t-3xl md:rounded-3xl bg-slate-900 border-t border-slate-700/50 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.5)] md:shadow-2xl flex flex-col overflow-hidden transition-transform duration-300 translate-y-0 overscroll-contain">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground border-b border-slate-700/50 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-2 rounded-2xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                <Bot className="h-5 w-5" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900"></span>
              </div>
              <div>
                <h3 className="font-extrabold text-sm text-white flex items-center gap-1.5">
                  Property Virtual Assistant <Sparkles className="h-3.5 w-3.5 text-indigo-400 animate-pulse" />
                </h3>
                <p className="text-[10px] text-slate-400 font-medium">SiteBank AI Broker</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800/50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 overscroll-contain">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                    <Bot className="h-4 w-4" />
                  </div>
                )}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-none'
                      : 'bg-slate-800/80 text-slate-200 border border-slate-700/30 rounded-tl-none font-medium'
                  }`}
                  style={{ whiteSpace: 'pre-wrap' }}
                  dangerouslySetInnerHTML={{
                    __html: (msg.content || '')
                      // simple bold parsing
                      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                      // bullet list parsing
                      .replace(/^- (.*)/gm, '• $1')
                  }}
                />
              </div>
            ))}
            
            {isLoading && (
              <div className="flex gap-2.5 justify-start">
                <div className="h-8 w-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Bot className="h-4 w-4" />
                </div>
                <div className="bg-slate-800/80 border border-slate-700/30 rounded-2xl rounded-tl-none px-4 py-3 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce"></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                  <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggestions */}
          {messages.length === 1 && (
            <div className="px-4 py-2 border-t border-slate-800/30 flex flex-wrap gap-1.5 bg-slate-950/20">
              <button
                onClick={() => handleQuickQuestion('What is the price of this property?')}
                className="text-xs min-h-[44px] px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700/40 hover:text-white transition-all flex items-center gap-1.5"
              >
                <BadgePercent className="h-3.5 w-3.5 text-blue-400" /> Price Details
              </button>
              <button
                onClick={() => handleQuickQuestion('Show me nearby schools and colleges')}
                className="text-xs min-h-[44px] px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700/40 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Landmark className="h-3.5 w-3.5 text-emerald-400" /> Schools & Colleges
              </button>
              <button
                onClick={() => handleQuickQuestion('What are the nearby malls and hospitals?')}
                className="text-xs min-h-[44px] px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700/40 hover:text-white transition-all flex items-center gap-1.5"
              >
                <MapPin className="h-3.5 w-3.5 text-rose-400" /> Malls & Hospitals
              </button>
              <button
                onClick={() => handleQuickQuestion('What are the specifications of the property?')}
                className="text-xs min-h-[44px] px-3 py-2 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold border border-slate-700/40 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Building2 className="h-3 w-3 text-purple-400" /> Specifications
              </button>
            </div>
          )}

          {/* Footer Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(inputValue);
            }}
            className="p-3 bg-slate-950/40 border-t border-slate-850 flex gap-2 pb-safe"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask about this property..."
              className="flex-1 bg-slate-800 text-slate-100 rounded-xl px-3.5 py-2 text-base md:text-sm border border-slate-700/30 focus:outline-none focus:border-blue-500/80 placeholder-slate-500 font-medium"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isLoading}
              className="p-2 rounded-xl bg-primary text-primary-foreground hover:opacity-90 text-white shadow-md disabled:opacity-40 transition-all flex items-center justify-center"
            >
              <Send className="h-4.5 w-4.5" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
