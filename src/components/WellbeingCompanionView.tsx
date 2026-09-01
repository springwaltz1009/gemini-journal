import React, { useState, useRef, useEffect } from 'react';
import { 
  HeartHandshake, 
  Sparkles, 
  Send, 
  RotateCcw, 
  Trash2, 
  Loader2, 
  AlertCircle, 
  MessageSquare, 
  Lightbulb, 
  HelpCircle, 
  FileText,
  ShieldCheck,
  Compass,
  BookOpen
} from 'lucide-react';
import Markdown from 'react-markdown';
import { ChatMessage, ActiveTab } from '../types';
import { auth } from '../firebase';

interface WellbeingCompanionViewProps {
  onNavigateToTab: (tab: ActiveTab) => void;
}

export const WellbeingCompanionView: React.FC<WellbeingCompanionViewProps> = ({ onNavigateToTab }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFailedRequest, setLastFailedRequest] = useState<{ prompt?: string; mode?: string } | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll when messages update
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (customPrompt?: string, mode?: string) => {
    const textToSend = (customPrompt !== undefined ? customPrompt : inputPrompt).trim();
    if (!textToSend && !mode && messages.length === 0) return;

    setError(null);
    setIsLoading(true);
    setLastFailedRequest({ prompt: textToSend, mode });

    let displayUserText = textToSend;
    if (!displayUserText && mode) {
      if (mode === 'unpack') displayUserText = 'Help me unpack what is on my mind';
      else if (mode === 'reflect_on') displayUserText = 'What might I reflect on?';
      else if (mode === 'next_step') displayUserText = 'Help me think of a gentle next step';
      else displayUserText = `[Reflection Request: ${mode}]`;
    }

    let updatedMessages = [...messages];
    if (displayUserText) {
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        sender: 'user',
        text: displayUserText,
        timestamp: Date.now(),
      };
      updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
    }

    if (!customPrompt) {
      setInputPrompt('');
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Your session has expired. Please sign in again.');
      }

      const idToken = await currentUser.getIdToken();

      // CONTEXT ISOLATION: Send ONLY explicitly exchanged companion conversation history
      const response = await fetch('/api/gemini/companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          conversationHistory: updatedMessages,
          prompt: textToSend || undefined,
          mode: mode || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      const companionMessage: ChatMessage = {
        id: `companion-${Date.now()}`,
        sender: 'gemini',
        text: data.text || 'I am here with you. What would you like to explore next?',
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, companionMessage]);
      setLastFailedRequest(null);
    } catch (err: any) {
      console.error('Wellbeing Companion error:', err);
      setError(err.message || 'Failed to receive a response. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearConversation = () => {
    setMessages([]);
    setError(null);
    setLastFailedRequest(null);
    setInputPrompt('');
  };

  return (
    <div id="wellbeing-companion-view" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-12 space-y-4">
      {/* Header & Purpose Banner */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-[#F4EBE2] text-[#CB997E] flex items-center justify-center shrink-0 shadow-2xs">
            <HeartHandshake className="w-5 h-5 text-[#B76935]" />
          </div>
          <div>
            <h1 className="font-serif text-xl font-bold text-[#3D3631] tracking-tight">
              Wellbeing Companion
            </h1>
            <p className="text-xs text-[#7A726D] mt-0.5 max-w-xl leading-relaxed">
              A private conversational space to unpack feelings, explore thoughts, and reflect through life experiences.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {messages.length > 0 && (
            <button
              id="clear-companion-chat-btn"
              onClick={handleClearConversation}
              className="px-3 py-1.5 text-xs text-[#7A726D] hover:text-[#C85A54] hover:bg-[#FDF0EE] border border-[#E5E0D5] rounded-lg transition-colors flex items-center space-x-1.5 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Chat</span>
            </button>
          )}
        </div>
      </div>

      {/* Visible Non-Clinical Disclaimer Banner */}
      <div 
        id="companion-non-clinical-disclaimer" 
        className="px-4 py-2.5 bg-[#F9F6F0] border border-[#E5E0D5] rounded-lg text-xs text-[#7A726D] flex items-center justify-between gap-3"
      >
        <div className="flex items-center space-x-2">
          <ShieldCheck className="w-4 h-4 text-[#6B705C] shrink-0" />
          <span>
            <strong>Non-Clinical Space:</strong> This companion provides supportive personal reflection and is not medical, psychiatric, or mental-health care.
          </span>
        </div>
      </div>

      {/* Quick Action Prompt Chips */}
      <div className="bg-[#FAF8F2] border border-[#E5E0D5] rounded-xl p-3 shadow-2xs">
        <div className="text-[11px] font-mono text-[#7A726D] uppercase tracking-wider mb-2 flex items-center space-x-1">
          <Sparkles className="w-3 h-3 text-[#CB997E]" />
          <span>Conversational Reflection Starters</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            id="quick-companion-unpack-btn"
            onClick={() => handleSendMessage(undefined, 'unpack')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F5F2EA] text-[#4A433F] border border-[#E5E0D5] rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <FileText className="w-3.5 h-3.5 text-[#7A726D]" />
            <span>Help me unpack this</span>
          </button>

          <button
            id="quick-companion-reflect-btn"
            onClick={() => handleSendMessage(undefined, 'reflect_on')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F5F2EA] text-[#4A433F] border border-[#E5E0D5] rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#8A817C]" />
            <span>What might I reflect on?</span>
          </button>

          <button
            id="quick-companion-next-step-btn"
            onClick={() => handleSendMessage(undefined, 'next_step')}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F5F2EA] text-[#4A433F] border border-[#E5E0D5] rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <Lightbulb className="w-3.5 h-3.5 text-[#CB997E]" />
            <span>Help me think of a gentle next step</span>
          </button>

          <button
            id="quick-companion-overwhelmed-btn"
            onClick={() => handleSendMessage("I am feeling a bit overwhelmed right now and need a quiet space to slow down and sort through my thoughts.")}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F5F2EA] text-[#4A433F] border border-[#E5E0D5] rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <span>Feeling overwhelmed</span>
          </button>

          <button
            id="quick-companion-reframe-btn"
            onClick={() => handleSendMessage("How might I look at a recent frustrating situation with fresh perspective and self-compassion?")}
            disabled={isLoading}
            className="px-3 py-1.5 bg-[#FFFFFF] hover:bg-[#F5F2EA] text-[#4A433F] border border-[#E5E0D5] rounded-lg text-xs font-medium flex items-center space-x-1.5 transition-colors cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <span>Reframe a situation</span>
          </button>
        </div>
      </div>

      {/* Main Conversational Thread */}
      <div className="bg-[#FFFFFF] border border-[#E5E0D5] rounded-xl shadow-xs flex flex-col h-[520px]">
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF8F2] text-[#6B705C] flex items-center justify-center border border-[#E5E0D5]">
                <MessageSquare className="w-6 h-6" />
              </div>
              <div className="max-w-md space-y-1.5">
                <h3 className="font-serif font-bold text-base text-[#3D3631]">
                  Your Personal Reflection Space
                </h3>
                <p className="text-xs text-[#7A726D] leading-relaxed">
                  Type what is on your mind below, choose one of the reflection chips above, or talk through an experience. Your companion will listen, clarify, and ask thoughtful questions.
                </p>
              </div>

              {/* Distinction from Journal Canvas & Compass */}
              <div className="pt-4 border-t border-[#E5E0D5]/70 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg text-left">
                <div 
                  onClick={() => onNavigateToTab('write')}
                  className="p-3 bg-[#FAF8F2] hover:bg-[#F5F2EA] border border-[#E5E0D5] rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#3D3631]">
                    <BookOpen className="w-3.5 h-3.5 text-[#6B705C]" />
                    <span>Journal Canvas</span>
                  </div>
                  <p className="text-[11px] text-[#7A726D] mt-1">
                    Write and privately save journal entries with mood tags.
                  </p>
                </div>

                <div 
                  onClick={() => onNavigateToTab('compass')}
                  className="p-3 bg-[#FAF8F2] hover:bg-[#F5F2EA] border border-[#E5E0D5] rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center space-x-1.5 text-xs font-semibold text-[#3D3631]">
                    <Compass className="w-3.5 h-3.5 text-[#CB997E]" />
                    <span>Reflection Compass</span>
                  </div>
                  <p className="text-[11px] text-[#7A726D] mt-1">
                    Generate a structured 5-dimension deep dive from a saved journal.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] sm:max-w-[78%] p-3.5 rounded-xl text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-[#3D3631] text-[#FDFCF0] rounded-br-xs shadow-2xs'
                        : 'bg-[#FAF8F2] text-[#4A433F] border border-[#E5E0D5] rounded-bl-xs shadow-2xs'
                    }`}
                  >
                    {msg.sender === 'gemini' ? (
                      <div className="prose prose-sm prose-stone max-w-none text-[#4A433F] [&>p]:mb-2 [&>p:last-child]:mb-0 [&>ul]:list-disc [&>ul]:pl-4 [&>ol]:list-decimal [&>ol]:pl-4 [&>h1]:text-sm [&>h2]:text-sm [&>h3]:text-xs">
                        <Markdown>{msg.text}</Markdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-[#A39B94] font-mono mt-1 px-1">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}

              {isLoading && (
                <div className="flex items-center space-x-2 text-[#7A726D] p-3 bg-[#FAF8F2] rounded-xl border border-[#E5E0D5] w-fit">
                  <Loader2 className="w-4 h-4 animate-spin text-[#CB997E]" />
                  <span className="text-xs italic">Companion is reflecting on what you shared...</span>
                </div>
              )}

              {error && (
                <div className="p-3 bg-[#FDF0EE] border border-[#E9BEB9] rounded-xl text-[#C85A54] text-xs flex items-center justify-between gap-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-[#C85A54] shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                  {lastFailedRequest && (
                    <button
                      onClick={() => handleSendMessage(lastFailedRequest.prompt, lastFailedRequest.mode)}
                      disabled={isLoading}
                      className="px-2.5 py-1 bg-[#FFFFFF] border border-[#E9BEB9] hover:bg-[#FDF0EE] text-[#C85A54] font-medium text-xs rounded-md flex items-center space-x-1 cursor-pointer shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  )}
                </div>
              )}

              <div ref={chatEndRef} />
            </>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-[#FAF8F2] border-t border-[#E5E0D5] rounded-b-xl">
          <div className="flex items-end space-x-2">
            <textarea
              ref={inputRef}
              id="companion-chat-input"
              rows={2}
              value={inputPrompt}
              onChange={(e) => setInputPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder="Type what's on your mind, explore feelings, or talk through a situation... (Enter to send)"
              className="flex-1 p-2.5 bg-[#FFFFFF] border border-[#E5E0D5] rounded-lg text-sm text-[#4A433F] placeholder:text-[#A39B94] focus:outline-none focus:border-[#B7BCA9] resize-none leading-relaxed transition-colors disabled:opacity-50"
            />
            <button
              id="companion-send-btn"
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!inputPrompt.trim() && messages.length === 0)}
              className="p-2.5 bg-[#3D3631] hover:bg-[#2B2521] text-[#FDFCF0] rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center shrink-0"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-[#DDBEA9]" />
              )}
            </button>
          </div>
          <div className="mt-1.5 flex items-center justify-between text-[10px] text-[#A39B94] font-mono px-1">
            <span>Shift + Enter for new line</span>
            <span>Messages are private and isolated to this conversation</span>
          </div>
        </div>
      </div>
    </div>
  );
};
