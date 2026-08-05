import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { getContextualHelp } from '@/services/ai-knowledge-base';

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const formatMessage = (content: string) => {
  const lines = content.split('\n');
  return lines.map((line, idx) => {
    if (line.startsWith('**') && line.endsWith('**')) {
      return <div key={idx} className="font-bold text-base mt-3 mb-2 text-primary">{line.slice(2, -2)}</div>;
    } else if (line.startsWith('###')) {
      return <div key={idx} className="font-semibold text-sm mt-2 mb-1 text-foreground">{line.slice(3).trim()}</div>;
    } else if (line.startsWith('📍')) {
      return <div key={idx} className="ml-3 my-1 text-sm text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-950/30 px-2 py-1 rounded border-l-2 border-amber-400">{line}</div>;
    } else if (line.startsWith('▶')) {
      return <div key={idx} className="ml-3 my-1 text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/30 px-2 py-1 rounded border-l-2 border-blue-400">{line}</div>;
    } else if (line.startsWith('✓')) {
      return <div key={idx} className="ml-3 my-1 text-sm text-green-600 dark:text-green-400 font-medium bg-green-50 dark:bg-green-950/30 px-2 py-1 rounded border-l-2 border-green-400">{line}</div>;
    } else if (line.startsWith('⚠')) {
      return <div key={idx} className="ml-3 my-1 text-sm text-orange-600 dark:text-orange-400 font-medium bg-orange-50 dark:bg-orange-950/30 px-2 py-1 rounded border-l-2 border-orange-400">{line}</div>;
    } else if (line.startsWith('•')) {
      return <div key={idx} className="ml-3 my-0.5 text-sm">• {line.slice(2)}</div>;
    } else if (/^\d+\./.test(line)) {
      return <div key={idx} className="ml-3 my-1 text-sm">{line}</div>;
    } else if (line.trim() === '') {
      return <div key={idx} className="h-1" />;
    } else {
      return <div key={idx} className="text-sm my-1">{line}</div>;
    }
  });
};

export default function AIAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      type: 'assistant',
      content: "Hi there! 👋 I'm your Campus Hub guide. I'm here to help you navigate the platform and accomplish whatever you need. What would you like to do today? (e.g., post a lost item, file a complaint, sell something, find study partners, etc.)",
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    return getContextualHelp(userMessage);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI thinking time
    setTimeout(() => {
      const assistantResponse: Message = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: generateAIResponse(inputValue),
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantResponse]);
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Window */}
      {isOpen && (
        <Card className="absolute bottom-20 right-0 w-[340px] max-w-[calc(100vw-2rem)] max-h-[75vh] h-[400px] shadow-2xl flex flex-col border border-primary/30 bg-background overflow-hidden rounded-xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-primary via-primary/90 to-primary/80 text-primary-foreground p-5 flex justify-between items-center flex-shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-foreground/20 rounded-lg">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-lg">Campus Hub AI</h3>
                <p className="text-xs text-primary-foreground/80">Step-by-step guidance</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-primary-foreground hover:bg-primary-foreground/20 p-1 rounded-lg transition"
            >
              <X size={20} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-b from-background/50 to-background">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[320px] px-4 py-3 rounded-xl text-sm leading-relaxed ${
                    message.type === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none shadow-md'
                      : 'bg-muted text-foreground rounded-bl-none border border-primary/20 shadow-sm'
                  }`}
                >
                  {message.type === 'user' ? (
                    <div className="whitespace-pre-wrap break-words">{message.content}</div>
                  ) : (
                    <div className="space-y-1">{formatMessage(message.content)}</div>
                  )}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-muted text-foreground px-4 py-3 rounded-xl rounded-bl-none border border-primary/20">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form
            onSubmit={handleSendMessage}
            className="border-t border-primary/10 p-4 bg-background flex gap-2 flex-shrink-0"
          >
            <Input
              type="text"
              placeholder="Ask me anything..."
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
              className="bg-muted/50 border-primary/20 focus:border-primary text-sm"
            />
            <Button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              size="icon"
              className="bg-primary hover:bg-primary/90 flex-shrink-0"
            >
              <Send size={18} />
            </Button>
          </form>
        </Card>
      )}

      {/* Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-full w-14 h-14 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110"
        size="icon"
      >
        {isOpen ? <ChevronDown size={24} /> : <MessageCircle size={24} />}
      </Button>
    </div>
  );
}

