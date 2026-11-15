"use client";

import { useState } from "react";
import { LanguageCode, TRANSLATIONS } from "@/data/translations";

interface HelpSheetProps {
  isOpen: boolean;
  onClose: () => void;
  lang: LanguageCode;
  screenId: string;
  staticHelpText: string;
  screenContextText: string;
}

export default function HelpSheet({
  isOpen,
  onClose,
  lang,
  screenId,
  staticHelpText,
  screenContextText,
}: HelpSheetProps) {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const t = TRANSLATIONS[lang] || TRANSLATIONS.en;

  if (!isOpen) return null;

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setAnswer(null);
    setErrorMsg(null);

    try {
      const res = await fetch("/api/help", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: question.trim(),
          screen: screenId,
          screenContext: screenContextText,
          language: lang,
          staticHelp: staticHelpText,
        }),
      });

      const data = await res.json();
      if (res.ok && data?.answer) {
        setAnswer(data.answer);
      } else {
        setAnswer(staticHelpText);
      }
    } catch {
      setAnswer(staticHelpText);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4 backdrop-blur-xs transition-opacity animate-in fade-in">
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white p-6 shadow-2xl sm:rounded-2xl max-h-[90vh] flex flex-col overflow-y-auto"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🌾</span>
            <h3 className="text-lg font-bold text-gray-900">{t.helpSheetTitle}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Static Help Guidance */}
        <div className="my-4 rounded-xl border border-blue-100 bg-blue-50/70 p-4 text-sm text-blue-950 space-y-2">
          <div className="font-semibold text-blue-900 flex items-center gap-1.5">
            <span>💡</span>
            <span>About this step:</span>
          </div>
          <p className="leading-relaxed">{staticHelpText}</p>
        </div>

        {/* Q&A Assistant Section */}
        <div className="space-y-3 pt-2">
          <div className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Ask a Question about this Screen:
          </div>

          <form onSubmit={handleAsk} className="space-y-2">
            <div className="relative">
              <input
                type="text"
                value={question}
                maxLength={300}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder={t.askQuestionPlaceholder}
                className="w-full rounded-xl border border-gray-300 bg-gray-50/50 px-4 py-3 text-sm text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:bg-white focus:outline-hidden pr-16"
              />
              <span className="absolute right-3 top-3.5 text-[10px] text-gray-400 font-mono">
                {question.length}/300
              </span>
            </div>

            <button
              type="submit"
              disabled={loading || !question.trim()}
              className="w-full rounded-xl bg-blue-600 py-3 text-sm font-bold text-white shadow-xs hover:bg-blue-700 disabled:bg-gray-200 disabled:text-gray-400 transition-colors cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? t.askingStatus : t.askButton}
            </button>
          </form>

          {/* AI Response Display */}
          {answer && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4 text-sm text-emerald-950 space-y-1.5 animate-in fade-in">
              <div className="text-xs font-bold text-emerald-800 flex items-center gap-1">
                <span>🌱</span>
                <span>Guidance:</span>
              </div>
              <p className="leading-relaxed">{answer}</p>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-lg bg-red-50 p-3 text-xs text-red-700">
              {errorMsg}
            </div>
          )}
        </div>

        {/* Official Extension Service Disclaimer */}
        <div className="mt-5 border-t border-gray-100 pt-3 text-[11px] leading-relaxed text-gray-500">
          <span className="font-semibold text-gray-700">Official Notice: </span>
          {t.helpDisclaimer}
        </div>
      </div>
    </div>
  );
}
