"use client";

import { useState, useRef, useEffect } from "react";
import { LanguageCode } from "@/data/translations";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: string;
}

interface HelpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageCode;
  screenId: string;
  staticHelpText: string;
  screenContextText: string;
}

const QUICK_PROMPTS: Record<LanguageCode, string[]> = {
  en: [
    "🌧️ Will my crop get enough rainfall?",
    "🌤️ What is the 7-day model weather forecast?",
    "🌱 Why rotate with Green Gram or Cowpea?",
    "☀️ What should I do during a dry spell?",
  ],
  si: [
    "🌧️ මගේ බෝගයට ප්‍රමාණවත් වැසි ලැබේද?",
    "🌤️ ඉදිරි දින 7 කාලගුණ අනාවැකිය කුමක්ද?",
    "🌱 මුං හෝ කවුපි සමඟ බෝග මාරුව හොඳ ඇයි?",
    "☀️ නියඟයක් ආවොත් කුමක් කළ යුතුද?",
  ],
  ta: [
    "🌧️ எனது பயிருக்கு போதுமான மழை கிடைக்குமா?",
    "🌤️ அடுத்த 7 நாள் வானிலை முன்னறிவிப்பு என்ன?",
    "🌱 பாசிப்பயறு அல்லது தட்டப்பயறு சுழற்சி ஏன் நல்லது?",
    "☀️ வறட்சி ஏற்பட்டால் என்ன செய்ய வேண்டும்?",
  ],
};

const UI_LABELS = {
  en: {
    title: "Field Shift AI Assistant",
    subtitle: "Conversational Agronomy & Weather Intelligence",
    welcome: "Hello! I am your Field Shift agronomy assistant. Ask me anything about seasonal rainfall, weather forecasts, drought strategies, or crop rotation benefits for your farm.",
    inputPlaceholder: "Ask about rainfall, weather, soil moisture, crops...",
    send: "Send",
    thinking: "Thinking...",
    disclaimer: "Field Shift AI provides decision support grounded in NASA & Meteomatics data. Confirm chemical spray dosages with your local Agrarian Service Center.",
    clearChat: "Clear chat",
  },
  si: {
    title: "ෆීල්ඩ් ෂිෆ්ට් කෘෂි AI සහකාර",
    subtitle: "දේශගුණ හා බෝග මාරු බුද්ධිමය මඟපෙන්වීම",
    welcome: "ආයුබෝවන්! මම ඔබගේ කෘෂි සහකාර AI. ඔබේ ප්‍රදේශයේ වැසි රටාව, කාලගුණ අනාවැකි, නියඟ කළමනාකරණය හෝ බෝග මාරුවේ වාසි පිළිබඳ ඕනෑම දෙයක් අසන්න.",
    inputPlaceholder: "වැසි, කාලගුණය, පස් තෙතමනය හෝ බෝග ගැන අසන්න...",
    send: "යවන්න",
    thinking: "සිතමින් පවතී...",
    disclaimer: "නාසා සහ Meteomatics දත්ත පදනම් කරගත් කෘෂි මඟපෙන්වීමකි. රසායනික ද්‍රව්‍ය මාත්‍රා ප්‍රාදේශීය ගොවිජන සේවා නිලධාරියාගෙන් තහවුරු කරගන්න.",
    clearChat: "කතාබහ හිස් කරන්න",
  },
  ta: {
    title: "ஃபீல்ட் ஷிப்ட் விவசாய AI உதவியாளர்",
    subtitle: "காலநிலை மற்றும் பயிர் சுழற்சி வழிகாட்டல்",
    welcome: "வணக்கம்! நான் உங்கள் விவசாய AI உதவியாளர். உங்கள் பகுதிக்கான மழை அளவு, வானிலை முன்னறிவிப்பு, வறட்சி மேலாண்மை அல்லது பயிர் சுழற்சி குறித்து எதையும் கேட்கலாம்.",
    inputPlaceholder: "மழை, வானிலை, மண் ஈரப்பதம், பயிர்கள் பற்றி கேட்கவும்...",
    send: "அனுப்பு",
    thinking: "சிந்திக்கிறது...",
    disclaimer: "நாசா மற்றும் Meteomatics தரவு அடிப்படையிலான விவசாய வழிகாட்டல். பூச்சிக்கொல்லி அளவுகளுக்கு உங்கள் கமநல சேவை மையத்தை அணுகவும்.",
    clearChat: "அரட்டையை அழிக்க",
  },
};

export default function HelpSheet({
  isOpen,
  onClose,
  lang,
  screenId,
  staticHelpText,
  screenContextText,
}: HelpSheetProps) {
  const labels = UI_LABELS[lang] || UI_LABELS.en;
  const quickPrompts = QUICK_PROMPTS[lang] || QUICK_PROMPTS.en;

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "initial-welcome",
      role: "assistant",
      text: labels.welcome,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll on new messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: trimmed,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText("");
    setLoading(true);

    try {
      // Build conversation payload for Gemini
      const conversationPayload = newMessages
        .filter((m) => m.id !== "initial-welcome")
        .map((m) => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.text,
        }));

      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: conversationPayload,
          question: trimmed,
          screen: screenId,
          context: screenContextText,
          language: lang,
        }),
      });

      const data = await res.json();

      if (data?.answer) {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: data.answer,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      } else {
        // Fallback to static guidance if API unavailable
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            text: staticHelpText || labels.welcome,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          text: staticHelpText || "Unable to reach the server. Please check your internet connection.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(inputText);
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "initial-welcome",
        role: "assistant",
        text: labels.welcome,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="relative w-full max-w-lg rounded-t-3xl sm:rounded-3xl bg-white shadow-2xl flex flex-col h-[85vh] sm:h-[650px] overflow-hidden border border-neutral-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Gemini-Style Chat Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-neutral-100 bg-neutral-50/80 backdrop-blur-xs">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-full bg-linear-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center text-sm font-bold shadow-xs">
              ✨
            </span>
            <div>
              <h3 className="text-sm font-bold text-neutral-900 leading-tight">
                {labels.title}
              </h3>
              <p className="text-[11px] text-neutral-500 font-medium">
                {labels.subtitle}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={handleClearChat}
              title={labels.clearChat}
              className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg text-xs font-semibold hover:bg-neutral-100 transition-colors"
            >
              ↻
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full w-8 h-8 flex items-center justify-center text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 transition-colors"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Chat Messages Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5 bg-[#FAF9F6]">
          {messages.map((m) => {
            const isUser = m.role === "user";
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isUser ? "items-end" : "items-start"} animate-in fade-in duration-150`}
              >
                <div className="flex items-start gap-2 max-w-[88%]">
                  {!isUser && (
                    <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center shrink-0 mt-0.5">
                      ✨
                    </span>
                  )}
                  <div
                    className={`p-3.5 text-xs sm:text-sm leading-relaxed shadow-2xs ${
                      isUser
                        ? "bg-neutral-950 text-white rounded-2xl rounded-tr-xs"
                        : "bg-white text-neutral-900 border border-neutral-200/80 rounded-2xl rounded-tl-xs whitespace-pre-line"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
                <span className="text-[10px] text-neutral-400 mt-1 px-1">
                  {m.timestamp}
                </span>
              </div>
            );
          })}

          {/* Thinking / Typing Animation */}
          {loading && (
            <div className="flex items-center gap-2 text-neutral-400 text-xs animate-in fade-in">
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 text-xs flex items-center justify-center">
                ✨
              </span>
              <div className="bg-white border border-neutral-200/80 rounded-2xl rounded-tl-xs px-3.5 py-2.5 flex items-center gap-1.5 shadow-2xs">
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.15s]" />
                <div className="w-1.5 h-1.5 rounded-full bg-neutral-400 animate-bounce [animation-delay:0.3s]" />
                <span className="text-[11px] text-neutral-500 font-medium ml-1">
                  {labels.thinking}
                </span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Chips */}
        <div className="p-2 border-t border-neutral-100 bg-white overflow-x-auto flex gap-1.5 shrink-0 no-scrollbar">
          {quickPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              disabled={loading}
              onClick={() => sendMessage(prompt)}
              className="whitespace-nowrap rounded-full bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-[11px] font-semibold px-3 py-1.5 transition active:scale-95 disabled:opacity-50 shrink-0 cursor-pointer"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Chat Input Bar */}
        <form
          onSubmit={handleFormSubmit}
          className="p-3 border-t border-neutral-200 bg-white flex items-center gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={labels.inputPlaceholder}
            disabled={loading}
            className="flex-1 min-h-[44px] rounded-full border border-neutral-300 bg-neutral-50 px-4 text-xs sm:text-sm text-neutral-900 focus:outline-hidden focus:border-black focus:bg-white transition"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            aria-label={labels.send}
            className="w-11 h-11 rounded-full bg-black text-white flex items-center justify-center font-bold text-sm shadow-xs hover:bg-neutral-800 disabled:opacity-40 transition active:scale-95 shrink-0 cursor-pointer disabled:cursor-not-allowed"
          >
            ↑
          </button>
        </form>

        {/* Footer Disclaimer */}
        <div className="px-4 py-1.5 bg-neutral-50 border-t border-neutral-100 text-[10px] text-neutral-400 text-center leading-tight">
          {labels.disclaimer}
        </div>
      </div>
    </div>
  );
}
