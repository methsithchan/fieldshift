import { NextRequest, NextResponse } from "next/server";
import { CLIMATE_HAZARD_ADVICE } from "@/data/crop_sourcing";

export const maxDuration = 30;

// ---------------------------------------------------------------------------
// In-memory sliding-window rate limiter (per IP, 20 req / 60 s)
// ---------------------------------------------------------------------------
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) ?? [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent);
    return false;
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

// ---------------------------------------------------------------------------
// Gemini REST API configuration
// ---------------------------------------------------------------------------
// Model & endpoint sourced from Google AI Studio docs & API response:
//   Endpoint: https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent
//   Key is sent via x-goog-api-key header (never in URL query params).
//   Default model: gemini-3.5-flash-lite — fast, lightweight free-tier model.
//   Override via GEMINI_MODEL env var if needed.
const GEMINI_MODEL_DEFAULT = "gemini-3.5-flash-lite";
const GEMINI_ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
const GEMINI_TIMEOUT_MS = 10_000;

const GLOSSARY = {
  en: {
    bookName: "the crop recommendations book",
    mulch: "mulch",
    droughtTolerantVarieties: "drought-tolerant varieties",
    shortDurationVarieties: "short-duration varieties",
    improveDrainage: "improve drainage",
    raisedBeds: "raised beds",
    irrigate: "irrigate",
  },
  si: {
    bookName: "බෝග නිර්දේශ පොත",
    mulch: "වසුන්",
    droughtTolerantVarieties: "නියඟයට ඔරොත්තු දෙන ප්‍රභේද",
    shortDurationVarieties: "කෙටි කාලීන ප්‍රභේද",
    improveDrainage: "ජලාපවහනය වැඩිදියුණු කිරීම",
    raisedBeds: "උස් පාත්ති",
    irrigate: "ජල සම්පාදනය කිරීම",
  },
  ta: {
    bookName: "பயிர் பரிந்துரை நூல்",
    mulch: "மூடாக்கு",
    droughtTolerantVarieties: "வறட்சியைத் தாங்கும் ரகங்கள்",
    shortDurationVarieties: "குறுகிய கால ரகங்கள்",
    improveDrainage: "வடிகால் வசதியை மேம்படுத்துதல்",
    raisedBeds: "மேட்டுப்பாத்திகள்",
    irrigate: "நீர்ப்பாசனம் செய்தல்",
  },
};

function getPlainScreenName(screen: string): string {
  const s = screen.toLowerCase().trim();
  if (s.includes("1") || s.includes("lang")) return "language selection page";
  if (s.includes("2") || s.includes("loc")) return "location selection page";
  if (s.includes("3") || s.includes("current")) return "current crops page";
  if (s.includes("4") || s.includes("consider")) return "alternative crops selection page";
  if (s.includes("5") || s.includes("result")) return "results page";
  return "this page";
}

// ---------------------------------------------------------------------------
// System instruction — injected via the API's system_instruction field
// (not embedded in the user prompt) so the model treats it as policy.
// ---------------------------------------------------------------------------
function buildSystemInstruction(
  screen: string,
  context: string,
  language: "en" | "si" | "ta"
): string {
  const langName =
    language === "si" ? "Sinhala" : language === "ta" ? "Tamil" : "English";

  const plainScreen = getPlainScreenName(screen);
  const terms = GLOSSARY[language];

  const hazardGrounding = CLIMATE_HAZARD_ADVICE.map(
    (h) =>
      `- Crop: ${h.cropId} | Condition: ${h.label} | Agronomic Action: "${h.advice}" (source: crop recommendations book, p. ${h.sourcePage})`
  ).join("\n");

  return [
    `You are Field Shift AI, an intelligent, empathetic, and highly knowledgeable agricultural AI specialist assisting Sri Lankan Dry Zone farmers.`,
    `You converse fluently and naturally in ${langName}.`,
    ``,
    `YOUR ROLE & PERSONALITY:`,
    `- Be conversational, practical, and direct like Gemini. Talk like a friendly, experienced Sri Lankan agricultural advisor who genuinely cares about the farmer's livelihood and farm resilience.`,
    `- Keep answers concise (2 to 4 sentences or brief, clear bullet points). Do NOT write overwhelming walls of text.`,
    `- NEVER repeat boilerplate legal disclaimers, canned warnings, or repetitive apologies on every message. Avoid stating "as an AI" or boilerplate like "this does not replace local advice" at the end of every response.`,
    `- Ground your answers directly in the real climate data, the 7-day weather forecast, and the rotation comparison data provided below.`,
    `- When asked about weather or rain, reference the specific numbers (e.g. 7-day model forecast from Meteomatics or NASA 11-year seasonal average).`,
    `- When asked about crop choices or rotations, explain the real trade-offs (water demand, root-zone soil wetness, soil health/nitrogen benefits, drought/wet risks) objectively. Never declare any option to be "the absolute best" or "guaranteed".`,
    `- If asked about specific chemical pesticide or synthetic fertilizer dosages, explain the general principle and warmly recommend confirming the exact dosage with the local Agrarian Service Centre officer (DOA).`,
    ``,
    `CURRENT SCREEN: ${plainScreen}`,
    `CURRENT CONTEXT & DATA FOR THIS FARM:`,
    context,
    ``,
    `AGRONOMIC KNOWLEDGE & ADVICE GROUNDING:`,
    hazardGrounding,
    `- Rice: Water requirement 948–1,232 mm (DOA Mahailluppallama) includes land preparation (puddling) and standing water. Maha rain meets ~74%, but Yala requires substantial tank irrigation.`,
    `- Green Gram: Water use 228 mm (Maha) / 270 mm (Yala) (Annals DOA 2014). Biological nitrogen fixation enriches soil for subsequent crops.`,
    `- Cowpea: Water use 175–288 mm (Liyanage 1992). Highly drought-tolerant, but sensitive to waterlogged soils (avoid poorly drained lowlands in heavy Maha rains). Continuous cowpea increases pest risks.`,
    `- Black Gram: Traditional Dry Zone legume with good drought tolerance. Sowing early November.`,
    `- Maize: Rainfed upland cereal with ~105–110 days duration. Requires well-drained soils.`,
    ``,
    `Use appropriate local terminology in ${langName}:`,
    `- Mulch: "${terms.mulch}"`,
    `- Drought-tolerant varieties: "${terms.droughtTolerantVarieties}"`,
    `- Short-duration varieties: "${terms.shortDurationVarieties}"`,
    `- Improve drainage: "${terms.improveDrainage}"`,
    `- Raised beds: "${terms.raisedBeds}"`,
    `- Irrigation: "${terms.irrigate}"`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  // ---- IP extraction (works behind Vercel / nginx proxies) ----
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        answer: null,
        error: "rate_limited",
        message:
          "You have asked several questions recently. Please wait a moment before trying again.",
      },
      { status: 429 }
    );
  }

  // ---- Parse & validate body ----
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { answer: null, error: "invalid_json" },
      { status: 400 }
    );
  }

  const { question, messages, screen, context, language } = body as {
    question?: unknown;
    messages?: Array<{ role: string; content: string }>;
    screen?: unknown;
    context?: unknown;
    language?: unknown;
  };

  const hasMessages = Array.isArray(messages) && messages.length > 0;
  const hasQuestion = typeof question === "string" && question.trim().length > 0;

  if (!hasMessages && !hasQuestion) {
    return NextResponse.json(
      { answer: null, error: "missing_question_or_messages" },
      { status: 400 }
    );
  }

  const lang: "en" | "si" | "ta" =
    language === "si" || language === "ta" ? language : "en";
  const screenStr = typeof screen === "string" ? screen : "farmer_wizard";
  // Cap context to ~6 KB to avoid ballooning prompt tokens
  const trimmedContext =
    typeof context === "string" ? context.slice(0, 6144) : "";

  // ---- Check API key ----
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      answer: null,
      error: "not_configured",
      message: "Help is unavailable right now.",
    });
  }

  // ---- Call Gemini REST API ----
  const model = process.env.GEMINI_MODEL || GEMINI_MODEL_DEFAULT;
  const url = `${GEMINI_ENDPOINT}/${model}:generateContent`;

  const systemText = buildSystemInstruction(
    screenStr,
    trimmedContext,
    lang
  );

  // Prepare Gemini contents from multi-turn messages or single question
  let contents: Array<{ role?: string; parts: Array<{ text: string }> }> = [];

  if (hasMessages) {
    contents = messages.map((m) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: String(m.content).slice(0, 1000) }],
    }));
  } else {
    contents = [
      {
        role: "user",
        parts: [{ text: String(question).trim().slice(0, 1000) }],
      },
    ];
  }

  const requestBody = {
    system_instruction: {
      parts: [{ text: systemText }],
    },
    contents,
    generationConfig: {
      maxOutputTokens: 512,
      temperature: 0.4,
    },
  };

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), GEMINI_TIMEOUT_MS);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!response.ok) {
      const status = response.status;
      // 429 = quota / rate limit, 403 = key invalid, etc.
      return NextResponse.json({
        answer: null,
        error: status === 429 ? "quota_exceeded" : "api_error",
        message: "Help is unavailable right now.",
      });
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!candidateText) {
      return NextResponse.json({
        answer: null,
        error: "empty_response",
        message: "Help is unavailable right now.",
      });
    }

    return NextResponse.json({ answer: candidateText, error: null });
  } catch (err: unknown) {
    const isTimeout =
      err instanceof Error && err.name === "AbortError";
    return NextResponse.json({
      answer: null,
      error: isTimeout ? "timeout" : "network_error",
      message: "Help is unavailable right now.",
    });
  }
}
