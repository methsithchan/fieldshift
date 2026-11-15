import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 30;

// Basic in-memory rate limiting: IP -> timestamps array
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (recent.length >= MAX_REQUESTS_PER_WINDOW) {
    rateLimitMap.set(ip, recent);
    return false; // Rate limit exceeded
  }
  recent.push(now);
  rateLimitMap.set(ip, recent);
  return true;
}

export async function POST(request: NextRequest) {
  // Extract client IP for rate limiting
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    request.headers.get("x-real-ip") ||
    "127.0.0.1";

  if (!checkRateLimit(ip)) {
    return NextResponse.json(
      {
        answer:
          "You have asked several questions recently. Please wait a moment or speak directly with your local Agrarian Service Centre officer for immediate assistance.",
        rateLimited: true,
      },
      { status: 429 }
    );
  }

  let body: {
    question?: string;
    screen?: string;
    screenContext?: string;
    language?: "en" | "si" | "ta";
    staticHelp?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON request body" },
      { status: 400 }
    );
  }

  const { question, screen, screenContext, language = "en", staticHelp = "" } = body;

  if (!question || typeof question !== "string") {
    return NextResponse.json(
      { error: "Missing or invalid question parameter" },
      { status: 400 }
    );
  }

  // Input length enforcement (max 300 characters)
  const trimmedQuestion = question.trim().slice(0, 300);

  const apiKey = process.env.GEMINI_API_KEY;
  // Google AI Studio standard free tier Flash model (15 RPM, 1M TPM, 1500 RPD)
  const model = process.env.GEMINI_MODEL || "gemini-1.5-flash";

  // Fallback text if API key is not configured or fails
  const fallbackAnswer = staticHelp
    ? `${staticHelp}\n\n(For field-specific guidance, please consult your local Agrarian Services Centre or Department of Agriculture extension officer).`
    : "Please refer to your local Agrarian Service Centre or Department of Agriculture extension officer for specific agricultural advice.";

  if (!apiKey) {
    return NextResponse.json({
      answer: fallbackAnswer,
      isFallback: true,
      reason: "API key not configured in environment; returned static screen help.",
    });
  }

  // System prompt and instructions strictly enforcing boundaries
  const systemInstruction = `You are a respectful, concise agricultural assistant for Sri Lankan smallholder farmers using the "Field Shift" decision-support tool.
Current screen: "${screen || "general"}".
Screen context: ${screenContext || "No additional context."}
User language: "${language}".

STRICT SAFETY AND COMPLIANCE RULES:
1. Answer ONLY from the provided screen context and results.
2. Respond in short, clear, plain language in the user's language (${language === "si" ? "Sinhala" : language === "ta" ? "Tamil" : "English"}).
3. NEVER provide pesticide, insecticide, herbicide, fertilizer formulation, dosage, or chemical advice.
4. NEVER guarantee or predict crop yields or financial profits.
5. If the user asks about fertilizers, chemicals, diseases, or financial projections, politely state that you cannot advise on chemicals/yields, and explicitly refer them to their local Agrarian Service Centre (ගොවිජන සේවා මධ්‍යස්ථානය / கமநல சேவை மையம்) or Department of Agriculture (DOA).
6. If you are unsure or the context does not contain the answer, say honestly that you do not know and suggest consulting the local agricultural extension officer.
7. Keep answers to 2-4 short sentences max.`;

  const promptText = `${systemInstruction}\n\nFarmer Question: "${trimmedQuestion}"\nAnswer:`;

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: promptText }] }],
        generationConfig: {
          maxOutputTokens: 200,
          temperature: 0.2,
        },
      }),
    });

    if (!response.ok) {
      console.warn(`Gemini API returned status ${response.status}`);
      return NextResponse.json({
        answer: fallbackAnswer,
        isFallback: true,
      });
    }

    const data = await response.json();
    const candidateText =
      data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim();

    if (!candidateText) {
      return NextResponse.json({
        answer: fallbackAnswer,
        isFallback: true,
      });
    }

    return NextResponse.json({
      answer: candidateText,
      isFallback: false,
    });
  } catch (err) {
    console.error("Gemini API call failed:", err);
    return NextResponse.json({
      answer: fallbackAnswer,
      isFallback: true,
    });
  }
}
