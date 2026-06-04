// Use the global `fetch` available in the Next.js runtime.

export type AIResult = {
  explanation?: string;
  rootCause?: string;
  category?: string;
  severity?: "Low" | "Medium" | "High";
  confidence?: string;
  fixTime?: string;
  solutions?: Array<{ rank: number; title: string; confidence?: string; effort?: string; snippet?: string }>;
  prevention?: string;
  errorMap?: string[];
  learningTips?: string[];
  raw?: unknown;
};

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY; // Gemini / Google Generative API key
const GROQ_KEY = process.env.GROQ_API_KEY; // Groq cloud API key
const GROQ_URL = process.env.GROQ_API_URL || "https://api.groq.com/openai/v1";

const JSON_INSTRUCTIONS =
  "You are FixFlow, a senior debugging assistant. Return only valid JSON with fields: explanation, rootCause, category, severity (Low|Medium|High), fixTime, solutions (array of {rank,title,confidence,effort,snippet}), prevention, errorMap (array), learningTips (array). Be specific to the pasted error. Do not invent project files, package versions, or web citations.";

type ProviderName = "openai" | "anthropic" | "google" | "groq";

class AIProviderError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = "AIProviderError";
    this.status = status;
  }
}

async function readProviderResponse(res: Response) {
  const text = await res.text();

  if (!res.ok) {
    throw new AIProviderError(
      `AI provider returned ${res.status}: ${text.slice(0, 300)}`,
      res.status
    );
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractOpenAIContent(data: unknown) {
  const record = data as {
    choices?: Array<{ message?: { content?: string }; text?: string }>;
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };

  return (
    record.output_text ||
    record.choices?.[0]?.message?.content ||
    record.choices?.[0]?.text ||
    record.output?.flatMap((item) => item.content || []).find((item) => item.type === "output_text" || item.text)?.text ||
    JSON.stringify(data)
  );
}

async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error("OpenAI key not configured");

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: JSON_INSTRUCTIONS },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      response_format: { type: "json_object" },
      max_tokens: 1000,
    }),
  });
  const data = await readProviderResponse(res);
  return String(extractOpenAIContent(data));
}

async function callAnthropic(prompt: string): Promise<string> {
  if (!ANTHROPIC_KEY) throw new Error("Anthropic key not configured");

  const body = {
    model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-latest",
    system: JSON_INSTRUCTIONS,
    messages: [{ role: "user", content: prompt }],
    max_tokens: 1000,
    temperature: 0.1,
  };

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await readProviderResponse(res) as {
    content?: Array<{ type?: string; text?: string }>;
  };
  const text = data?.content?.find((item) => item.type === "text")?.text || JSON.stringify(data);
  return String(text);
}

async function callGoogleGemini(prompt: string): Promise<string> {
  if (!GOOGLE_KEY) throw new Error("Google API key not configured");
  const configuredModel = process.env.GOOGLE_MODEL?.trim();
  const modelCandidates = [
    configuredModel,
    "gemini-2.0-flash",
    "gemini-1.5-flash-latest",
    "gemini-1.5-pro-latest",
  ].filter((model): model is string => Boolean(model));

  const body = {
    contents: [{ role: "user", parts: [{ text: `${JSON_INSTRUCTIONS}\n\n${prompt}` }] }],
    generationConfig: {
      temperature: Number(process.env.GOOGLE_TEMPERATURE || 0.1),
      maxOutputTokens: Number(process.env.GOOGLE_MAX_TOKENS || 1000),
      responseMimeType: "application/json",
    },
  };

  let lastError: unknown = null;

  for (const model of modelCandidates) {
    const normalizedModel = model.startsWith("models/") ? model : `models/${model}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/${normalizedModel}:generateContent?key=${GOOGLE_KEY}`;

    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await readProviderResponse(res) as {
        candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
      };
      const content = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("") || JSON.stringify(data);
      return String(content);
    } catch (error) {
      lastError = error;

      if (!(error instanceof Error) || !/AI provider returned 404/.test(error.message)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Gemini call failed because no configured model was available.");
}

async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_KEY) throw new Error("Groq API key not configured");
  const url = `${GROQ_URL.replace(/\/$/, "")}/chat/completions`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: JSON_INSTRUCTIONS },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        response_format: { type: "json_object" },
      }),
    });
    const data = await readProviderResponse(res);
    const content = extractOpenAIContent(data);
    return String(content);
  } catch (err) {
    if (err instanceof AIProviderError) {
      throw new AIProviderError(`Groq call failed: ${err.message}`, err.status);
    }

    throw new Error(`Groq call failed: ${String(err)}`);
  }
}

function hasProviderKey(provider: ProviderName) {
  if (provider === "openai") return Boolean(OPENAI_KEY);
  if (provider === "anthropic") return Boolean(ANTHROPIC_KEY);
  if (provider === "google") return Boolean(GOOGLE_KEY);
  return Boolean(GROQ_KEY);
}

function buildProviderOrder(selectedProvider: string): ProviderName[] {
  const preferred = selectedProvider as ProviderName;
  const defaultOrder: ProviderName[] = ["openai", "anthropic", "google", "groq"];
  const quotaFallbackOrder: ProviderName[] = ["google", "groq", "openai", "anthropic"];
  const order = selectedProvider === "google"
    ? quotaFallbackOrder
    : defaultOrder;

  if (["openai", "anthropic", "google", "groq"].includes(selectedProvider)) {
    return [preferred, ...order.filter((provider) => provider !== preferred)]
      .filter((provider) => hasProviderKey(provider));
  }

  return order.filter((provider) => hasProviderKey(provider));
}

async function callProvider(provider: ProviderName, prompt: string) {
  if (provider === "openai") return callOpenAI(prompt);
  if (provider === "anthropic") return callAnthropic(prompt);
  if (provider === "google") return callGoogleGemini(prompt);
  return callGroq(prompt);
}

function summarizeProviderFailures(failures: Array<{ provider: ProviderName; error: unknown }>) {
  return failures
    .map(({ provider, error }) => {
      const status = error instanceof AIProviderError && error.status
        ? ` ${error.status}`
        : "";
      const message = error instanceof Error
        ? error.message.replace(/\s+/g, " ").slice(0, 180)
        : String(error).slice(0, 180);

      return `${provider}${status}: ${message}`;
    })
    .join(" | ");
}

function tryParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    // try to extract code block
    const m = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
    if (m) {
      try {
        return JSON.parse(m[1].trim());
      } catch {}
    }

    const firstObject = text.match(/\{[\s\S]*\}/);
    if (firstObject) {
      try {
        return JSON.parse(firstObject[0]);
      } catch {}
    }
  }
  return null;
}

export async function queryAI(input: string, frameworkHint?: string): Promise<AIResult | null> {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const prompt = `Analyze the following error or stack trace. Include concise code snippets where appropriate. Rank fixes by likelihood and lowest risk.\n\nFramework hint: ${frameworkHint || "none"}\n\nInput:\n${input}`;

  let raw: string | null = null;
  const providerOrder = buildProviderOrder(provider);

  if (!providerOrder.length) return null;

  const failures: Array<{ provider: ProviderName; error: unknown }> = [];

  for (const nextProvider of providerOrder) {
    try {
      raw = await callProvider(nextProvider, prompt);
      break;
    } catch (error) {
      failures.push({ provider: nextProvider, error });
    }
  }

  if (!raw) {
    console.warn(
      "AI provider unavailable; using local FixFlow analysis.",
      summarizeProviderFailures(failures)
    );
    return null;
  }

  const parsed = tryParseJSON(raw || "");
  if (parsed) {
    const out: AIResult = {
      explanation: parsed.explanation || parsed.explainer || parsed.summary || undefined,
      rootCause: parsed.rootCause || parsed.root_cause || parsed.cause || undefined,
      category: parsed.category || undefined,
      severity: parsed.severity || undefined,
      confidence: parsed.confidence || undefined,
      fixTime: parsed.fixTime || parsed.fix_time || undefined,
      solutions: parsed.solutions || parsed.fixes || undefined,
      prevention: parsed.prevention || parsed.advice || undefined,
      errorMap: parsed.errorMap || parsed.error_map || undefined,
      learningTips: parsed.learningTips || parsed.learning_tips || undefined,
      raw,
    };
    return out;
  }

  // If not parseable, put raw AI text into explanation
  return { explanation: raw || undefined, raw };
}
