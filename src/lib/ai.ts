// Use the global `fetch` available in the Next.js runtime

type AIResult = {
  explanation?: string;
  rootCause?: string;
  solutions?: Array<{ rank: number; title: string; confidence?: string; effort?: string; snippet?: string }>;
  prevention?: string;
  raw?: unknown;
};

const OPENAI_KEY = process.env.OPENAI_API_KEY;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;
const GOOGLE_KEY = process.env.GOOGLE_API_KEY; // Gemini / Google Generative API key
const GROQ_KEY = process.env.GROQ_API_KEY; // Groq cloud API key
const GROQ_URL = process.env.GROQ_API_URL || "https://api.groq.cloud/v1";

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
        { role: "system", content: "You are an expert senior engineer who outputs a JSON object with fields: explanation, rootCause, solutions (array of {rank,title,confidence,effort,snippet}), prevention. Respond with only valid JSON." },
        { role: "user", content: prompt },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    }),
  });
  const data = await res.json();
  // best-effort to extract assistant content
  const content = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || JSON.stringify(data);
  return String(content);
}

async function callAnthropic(prompt: string): Promise<string> {
  if (!ANTHROPIC_KEY) throw new Error("Anthropic key not configured");

  const body = {
    model: process.env.ANTHROPIC_MODEL || "claude-2.1",
    prompt: `\n\nHuman: ${prompt}\n\nAssistant:`,
    max_tokens_to_sample: 1000,
    temperature: 0.1,
  };

  const res = await fetch("https://api.anthropic.com/v1/complete", {
    method: "POST",
    headers: {
      "x-api-key": ANTHROPIC_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  const text = data?.completion || JSON.stringify(data);
  return String(text);
}

// Placeholder for Google Gemini. Implement concrete call when endpoint and auth is configured.
async function callGoogleGemini(prompt: string): Promise<string> {
  if (!GOOGLE_KEY) throw new Error("Google API key not configured");
  const model = process.env.GOOGLE_MODEL || "models/text-bison-001";
  const url = `https://generativelanguage.googleapis.com/v1beta2/${model}:generateText?key=${GOOGLE_KEY}`;
  const body = {
    prompt: { text: prompt },
    temperature: Number(process.env.GOOGLE_TEMPERATURE || 0.1),
    maxOutputTokens: Number(process.env.GOOGLE_MAX_TOKENS || 1000),
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  // Google returns { candidates: [{ content }] } in many versions
  const content = data?.candidates?.[0]?.content || data?.output?.[0]?.content || data?.candidates?.[0]?.text || JSON.stringify(data);
  return String(content);
}

// Placeholder for Groq cloud.
async function callGroq(prompt: string): Promise<string> {
  if (!GROQ_KEY) throw new Error("Groq API key not configured");
  // Best-effort generic Groq Cloud completion endpoint
  const url = `${GROQ_URL}/complete`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    const content = data?.output || data?.result || data?.choices?.[0]?.text || JSON.stringify(data);
    return String(content);
  } catch (err) {
    throw new Error(`Groq call failed: ${String(err)}`);
  }
}

function tryParseJSON(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    // try to extract code block
    const m = text.match(/```(?:json)?([\s\S]*?)```/i);
    if (m) {
      try {
        return JSON.parse(m[1].trim());
      } catch {}
    }
  }
  return null;
}

export async function queryAI(input: string, frameworkHint?: string): Promise<AIResult | null> {
  const provider = (process.env.AI_PROVIDER || "").toLowerCase();
  const prompt = `Analyze the following error or stack trace and return a JSON object with fields: explanation, rootCause, solutions (array of objects with rank,title,confidence,effort,snippet), prevention. Include concise code snippets where appropriate.\n\nFramework hint: ${frameworkHint || "none"}\n\nInput:\n${input}`;

  let raw: string | null = null;

  // provider selection
  try {
    if (provider === "anthropic" && ANTHROPIC_KEY) {
      raw = await callAnthropic(prompt);
    } else if (provider === "openai" && OPENAI_KEY) {
      raw = await callOpenAI(prompt);
    } else if (provider === "google" && GOOGLE_KEY) {
      raw = await callGoogleGemini(prompt);
    } else if (provider === "groq" && GROQ_KEY) {
      raw = await callGroq(prompt);
    } else {
      // fallback order: OpenAI, Anthropic
      if (OPENAI_KEY) raw = await callOpenAI(prompt);
      else if (ANTHROPIC_KEY) raw = await callAnthropic(prompt);
      else if (GOOGLE_KEY) raw = await callGoogleGemini(prompt);
      else if (GROQ_KEY) raw = await callGroq(prompt);
      else return null;
    }
  } catch (err) {
    console.warn("AI provider call failed:", err);
    return null;
  }

  const parsed = tryParseJSON(raw || "");
  if (parsed) {
    const out: AIResult = {
      explanation: parsed.explanation || parsed.explainer || parsed.summary || undefined,
      rootCause: parsed.rootCause || parsed.root_cause || parsed.cause || undefined,
      solutions: parsed.solutions || parsed.fixes || undefined,
      prevention: parsed.prevention || parsed.advice || undefined,
      raw,
    };
    return out;
  }

  // If not parseable, put raw AI text into explanation
  return { explanation: raw || undefined, raw };
}
