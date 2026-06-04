import { queryAI, type AIResult } from "@/lib/ai";
import { detectFramework } from "@/lib/detect";

export type Solution = {
  rank: number;
  title: string;
  confidence: string;
  effort: string;
  snippet: string;
};

export type Analysis = {
  explanation: string;
  rootCause: string;
  category: string;
  severity: "Low" | "Medium" | "High";
  confidence: string;
  fixTime: string;
  solutions: Solution[];
  prevention: string;
  errorMap: string[];
  learningTips: string[];
  diagnostics?: Array<{ label: string; value: string }>;
  nextActions?: string[];
  confidenceReason?: string;
  impact?: string;
};

type Evidence = {
  command?: string;
  headline: string;
  lines: string[];
  packageName?: string;
  projectFrame?: string;
};

type Pattern = {
  id: string;
  category: string;
  severity: Analysis["severity"];
  fixTime: string;
  keywords: RegExp[];
  explain: (evidence: Evidence, framework?: string) => Omit<Analysis, "confidence">;
};

type AnalyzeOptions = {
  framework?: string;
  useAI?: boolean;
};

const MAX_INPUT_LENGTH = 24_000;
const MIN_INPUT_LENGTH = 8;

function makeSolution(
  rank: number,
  title: string,
  confidence: string,
  effort: string,
  snippet: string
): Solution {
  return { rank, title, confidence, effort, snippet };
}

function cleanText(input: string) {
  return input
    .replace(/\r\n/g, "\n")
    .replace(/\u0000/g, "")
    .trim()
    .slice(0, MAX_INPUT_LENGTH);
}

function meaningfulLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractHeadline(lines: string[]) {
  return (
    lines.find((line) =>
      /error|warning|exception|failed|cannot|can't|invalid|missing|denied|not found|timeout|crash|panic|traceback/i.test(
        line
      )
    ) ||
    lines[0] ||
    "the pasted issue"
  ).slice(0, 220);
}

function extractProjectFrame(lines: string[]) {
  return lines.find((line) =>
    /(?:src|app|pages|components|lib|server|client|api|routes|supabase|prisma|test|tests)[\\/][\w./-]+(?::\d+(?::\d+)?)?/i.test(
      line
    )
  );
}

function extractCommand(lines: string[]) {
  return lines.find((line) =>
    /^(?:[$>]\s*)?(?:npm|pnpm|yarn|bun|npx|node|next|python|py|pip|tsx|ts-node|cargo|go|composer|php|dotnet|docker|kubectl)\b/i.test(
      line
    )
  );
}

function extractPackageName(text: string) {
  return (
    text.match(/cannot find module\s+['"]([^'"]+)['"]/i)?.[1] ||
    text.match(/module not found:\s*(?:can't resolve\s*)?['"]?(@?[\w./-]+)['"]?/i)?.[1] ||
    text.match(/modulenotfounderror:\s*no module named\s+['"]?([\w.-]+)['"]?/i)?.[1] ||
    text.match(/package\s+['"]?(@?[\w./-]+)['"]?\s+not found/i)?.[1]
  );
}

function collectEvidence(text: string): Evidence {
  const lines = meaningfulLines(text);

  return {
    command: extractCommand(lines),
    headline: extractHeadline(lines),
    lines,
    packageName: extractPackageName(text),
    projectFrame: extractProjectFrame(lines),
  };
}

function scorePattern(pattern: Pattern, source: string) {
  return pattern.keywords.reduce((score, keyword) => {
    return keyword.test(source) ? score + 1 : score;
  }, 0);
}

function confidenceFromScore(score: number, evidence: Evidence) {
  const evidenceBoost = [evidence.projectFrame, evidence.command, evidence.packageName].filter(Boolean).length;
  const confidence = Math.min(94, 58 + score * 9 + evidenceBoost * 4);
  return `${confidence}%`;
}

function firstInspectionSnippet(evidence: Evidence) {
  if (evidence.projectFrame) {
    return `Open this project-owned location first:\n${evidence.projectFrame}`;
  }

  if (evidence.command) {
    return `${evidence.command.replace(/^[$>]\s*/, "")}\n# Re-run it after one change and compare the first new error line.`;
  }

  return `Use this as the debugging anchor:\n${evidence.headline}`;
}

const patterns: Pattern[] = [
  {
    id: "next-hydration",
    category: "React hydration",
    severity: "Medium",
    fixTime: "2-12 min",
    keywords: [/hydration/i, /text content did not match/i, /server.*client/i, /hydrate/i],
    explain: () => ({
      explanation:
        "React received browser markup that did not match the HTML rendered on the server during the first client render.",
      rootCause:
        "The first render is using browser-only, time-sensitive, random, locale-specific, or persisted data before hydration has finished.",
      category: "React hydration",
      severity: "Medium",
      fixTime: "2-12 min",
      solutions: [
        makeSolution(
          1,
          "Render a stable first pass",
          "92%",
          "Low",
          `"use client";\n\nconst [mounted, setMounted] = useState(false);\n\nuseEffect(() => {\n  setMounted(true);\n}, []);\n\nreturn <span>{mounted ? browserValue : fallbackValue}</span>;`
        ),
        makeSolution(
          2,
          "Move browser-only reads into effects",
          "86%",
          "Low",
          `useEffect(() => {\n  const saved = window.localStorage.getItem("theme");\n  setTheme(saved ?? "system");\n}, []);`
        ),
        makeSolution(
          3,
          "Disable SSR only for truly client-only widgets",
          "72%",
          "Medium",
          `import dynamic from "next/dynamic";\n\nconst ClientOnlyChart = dynamic(() => import("./client-only-chart"), {\n  ssr: false,\n});`
        ),
      ],
      prevention:
        "Keep initial markup deterministic. Avoid Date, Math.random, window, localStorage, and locale-only formatting in the first render.",
      errorMap: ["Server renders HTML", "Client renders first pass", "Markup differs", "Hydration fails"],
      learningTips: [
        "Hydration compares the server HTML with the client's first render.",
        "Effects run after hydration, so they are safer for browser-only values.",
        "Use stable placeholders instead of rendering changing values immediately.",
      ],
    }),
  },
  {
    id: "dependency-resolution",
    category: "Dependency resolution",
    severity: "High",
    fixTime: "3-15 min",
    keywords: [/module not found/i, /cannot find module/i, /can't resolve/i, /modulenotfounderror/i, /npm err/i, /pnpm/i, /yarn/i],
    explain: (evidence) => ({
      explanation:
        "The runtime or bundler could not resolve a package, generated client, or local import path required by the code.",
      rootCause: evidence.packageName
        ? `The resolver cannot find "${evidence.packageName}". It may be uninstalled, generated output may be missing, or the import path/casing may be wrong.`
        : "A dependency or import path is missing, misnamed, generated in the wrong place, or resolved from the wrong working directory.",
      category: "Dependency resolution",
      severity: "High",
      fixTime: "3-15 min",
      solutions: [
        makeSolution(
          1,
          "Verify the missing module exactly",
          "88%",
          "Low",
          evidence.packageName && !evidence.packageName.startsWith(".")
            ? `npm ls ${evidence.packageName}\nnpm install ${evidence.packageName}`
            : firstInspectionSnippet(evidence)
        ),
        makeSolution(
          2,
          "Check aliases, relative paths, and filename casing",
          "78%",
          "Low",
          `// Confirm tsconfig paths, import spelling, and case-sensitive filenames.\nimport { thing } from "@/lib/example";`
        ),
        makeSolution(
          3,
          "Regenerate dependency artifacts when needed",
          "70%",
          "Medium",
          `# Examples depending on the stack:\nnpx prisma generate\nnpm install\nnpm run build`
        ),
      ],
      prevention:
        "Commit lockfile changes, keep generated clients reproducible, and avoid import casing that only works on Windows.",
      errorMap: ["Import requested", "Resolver checks aliases and node_modules", "Module missing or mismatched"],
      learningTips: [
        "The unresolved module name is usually the fastest clue.",
        "Local path errors and package errors need different fixes.",
        "Restart the dev server after adding dependencies or generated clients.",
      ],
    }),
  },
  {
    id: "typescript",
    category: "TypeScript type error",
    severity: "Medium",
    fixTime: "5-25 min",
    keywords: [/ts\d{3,5}/i, /type .* is not assignable/i, /property .* does not exist/i, /argument of type/i, /implicitly has an/i],
    explain: (evidence) => ({
      explanation:
        "TypeScript found a mismatch between the value your code can produce and the type the current API or component expects.",
      rootCause:
        evidence.projectFrame
          ? `The likely mismatch is near "${evidence.projectFrame}". Inspect the declared type, the actual value, and any optional fields used there.`
          : "A value, prop, generic, or API response shape does not match the declared contract.",
      category: "TypeScript type error",
      severity: "Medium",
      fixTime: "5-25 min",
      solutions: [
        makeSolution(1, "Fix the data contract, not just the symptom", "82%", "Medium", firstInspectionSnippet(evidence)),
        makeSolution(2, "Narrow optional or unknown values before use", "76%", "Low", `if (!user?.id) return null;\n\nreturn <Profile userId={user.id} />;`),
        makeSolution(3, "Type external responses at the boundary", "70%", "Medium", `const items = Array.isArray(data?.items) ? data.items : [];`),
      ],
      prevention:
        "Type API boundaries and props close to where data enters the app, then let components receive already-normalized data.",
      errorMap: ["Value is produced", "Type contract is checked", "Mismatch blocks build"],
      learningTips: [
        "The TypeScript error code and the first project file are the useful clues.",
        "Avoid silencing errors with any unless the boundary is intentionally unsafe.",
        "Optional fields need explicit loading, empty, or fallback states.",
      ],
    }),
  },
  {
    id: "runtime-typeerror",
    category: "Runtime TypeError",
    severity: "Medium",
    fixTime: "5-20 min",
    keywords: [/typeerror/i, /cannot read prop/i, /cannot read properties/i, /undefined is not a function/i, /is not a function/i, /null is not an object/i],
    explain: (evidence) => ({
      explanation:
        "JavaScript tried to read, call, or destructure a value that was undefined, null, or not the shape your code expected.",
      rootCause:
        evidence.projectFrame
          ? `The failing access is probably near "${evidence.projectFrame}", often after async data, optional props, or a changed API response.`
          : "A runtime value is missing or has a different shape than the code assumes.",
      category: "Runtime TypeError",
      severity: "Medium",
      fixTime: "5-20 min",
      solutions: [
        makeSolution(1, "Guard the value before access", "84%", "Low", `if (!user) return null;\n\nreturn <Profile name={user.name ?? "Unknown"} />;`),
        makeSolution(2, "Validate response shape before rendering", "76%", "Medium", `const items = Array.isArray(data?.items) ? data.items : [];`),
        makeSolution(3, "Trace the first bad assignment", "68%", "Low", `console.log("FixFlow trace", { value, type: typeof value });`),
      ],
      prevention:
        "Render loading and empty states, and normalize external data before deeply nested components use it.",
      errorMap: ["Expected value", "Actual value missing", "Property access fails"],
      learningTips: [
        "Runtime TypeErrors are data-flow problems first.",
        "The first stack frame in your code is usually more useful than library frames.",
        "Optional chaining prevents crashes but can hide broken state if overused.",
      ],
    }),
  },
  {
    id: "react-hooks",
    category: "React hooks",
    severity: "Medium",
    fixTime: "4-15 min",
    keywords: [/invalid hook call/i, /rules of hooks/i, /react hook/i, /exhaustive-deps/i, /useeffect/i, /usememo/i, /usecallback/i],
    explain: () => ({
      explanation:
        "React detected invalid hook ordering or an effect/callback that does not describe the values it depends on.",
      rootCause:
        "Hooks must run in the same order on every render, and dependency arrays must include the values read inside the hook.",
      category: "React hooks",
      severity: "Medium",
      fixTime: "4-15 min",
      solutions: [
        makeSolution(1, "Move hooks to the top level", "86%", "Low", `function Component() {\n  const [value, setValue] = useState(null);\n\n  if (!value) return null;\n  return <div>{value}</div>;\n}`),
        makeSolution(2, "Include values used inside effects", "80%", "Low", `useEffect(() => {\n  loadUser(userId);\n}, [userId]);`),
        makeSolution(3, "Remove duplicate React versions", "68%", "Medium", `npm ls react react-dom`),
      ],
      prevention:
        "Treat hook lint warnings as data-flow feedback and keep hooks outside conditionals, loops, and nested functions.",
      errorMap: ["Component renders", "Hook order/dependencies checked", "React warns or crashes"],
      learningTips: [
        "Hooks are matched by call order, not by name.",
        "Dependency arrays document what a hook reads.",
        "Duplicate React installs can also cause invalid hook calls.",
      ],
    }),
  },
  {
    id: "env-config",
    category: "Environment config",
    severity: "High",
    fixTime: "3-12 min",
    keywords: [/env/i, /environment variable/i, /api key/i, /secret/i, /process\.env/i, /not configured/i, /publishable key/i],
    explain: () => ({
      explanation:
        "The app is reading configuration that is missing, named differently, scoped to the wrong runtime, or loaded after the server started.",
      rootCause:
        "An environment variable, API key, redirect URL, or runtime secret is unavailable to the code handling the request.",
      category: "Environment config",
      severity: "High",
      fixTime: "3-12 min",
      solutions: [
        makeSolution(1, "Check exact variable names and runtime scope", "88%", "Low", `NEXT_PUBLIC_SUPABASE_URL=https://...\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...\n# Server-only secrets should not use NEXT_PUBLIC_.`),
        makeSolution(2, "Restart after editing env files", "82%", "Low", `npm run dev`),
        makeSolution(3, "Keep private keys in server code only", "74%", "Medium", `// API route or server utility only\nconst key = process.env.SERVICE_ROLE_KEY;`),
      ],
      prevention:
        "Keep required variables in .env.example and restart the process after env changes.",
      errorMap: ["Code requests config", "Runtime reads env", "Missing value breaks feature"],
      learningTips: [
        "Browser-exposed Next variables need NEXT_PUBLIC_.",
        "Env files are read at process startup.",
        "Never expose service-role or private keys to client components.",
      ],
    }),
  },
  {
    id: "network-api",
    category: "Network/API",
    severity: "Medium",
    fixTime: "5-25 min",
    keywords: [/fetch/i, /cors/i, /failed to fetch/i, /json.*parse/i, /unexpected token.*html/i, /http 4\d\d/i, /http 5\d\d/i, /timeout/i],
    explain: () => ({
      explanation:
        "A request failed before the app received the expected response, or the client parsed a response as the wrong format.",
      rootCause:
        "The URL, method, auth, CORS policy, status handling, or response parser does not match what the server actually returned.",
      category: "Network/API",
      severity: "Medium",
      fixTime: "5-25 min",
      solutions: [
        makeSolution(1, "Read status and text before parsing JSON", "84%", "Low", `const res = await fetch(url);\nconst text = await res.text();\nif (!res.ok) throw new Error(text || res.statusText);\nconst data = JSON.parse(text);`),
        makeSolution(2, "Verify URL, method, headers, and auth", "76%", "Low", `fetch("/api/analyze", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(payload),\n});`),
        makeSolution(3, "Separate CORS from server failures", "68%", "Medium", `// Check the Network tab status, preflight request, and server logs together.`),
      ],
      prevention:
        "Handle non-2xx responses before parsing and log the status, route, and response content type.",
      errorMap: ["Client sends request", "Server/network responds", "Client handles status and body"],
      learningTips: [
        "A server HTML error page can break response.json().",
        "CORS failures are enforced by the browser.",
        "Auth failures often look like parsing failures when redirects return HTML.",
      ],
    }),
  },
  {
    id: "auth-session",
    category: "Auth/session",
    severity: "High",
    fixTime: "5-25 min",
    keywords: [/auth/i, /session/i, /login/i, /sign in/i, /sign up/i, /supabase/i, /rls/i, /row level security/i, /unauthorized/i, /not authenticated/i],
    explain: () => ({
      explanation:
        "Authentication failed or the app could not read a valid user session for the protected operation.",
      rootCause:
        "Credentials, redirect URLs, cookie/session persistence, email confirmation, or row-level security policies may be misconfigured.",
      category: "Auth/session",
      severity: "High",
      fixTime: "5-25 min",
      solutions: [
        makeSolution(1, "Verify Supabase client env values", "84%", "Low", `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key`),
        makeSolution(2, "Check auth redirects and email confirmation", "76%", "Medium", `// Supabase Auth URL configuration should include your local and production origins.`),
        makeSolution(3, "Confirm RLS policies for user-owned data", "72%", "Medium", `using (auth.uid() = user_id)\nwith check (auth.uid() = user_id)`),
      ],
      prevention:
        "Document auth URLs, env variables, and RLS policies together before adding protected pages.",
      errorMap: ["User submits request", "Auth/session is checked", "Protected data is read or blocked"],
      learningTips: [
        "A valid publishable key is not enough if redirect URLs are wrong.",
        "Email confirmation settings can block immediate login.",
        "RLS errors often appear as empty data or failed inserts.",
      ],
    }),
  },
  {
    id: "build-tooling",
    category: "Build/dev server",
    severity: "High",
    fixTime: "3-20 min",
    keywords: [/webpack/i, /chunk/i, /next build/i, /failed to compile/i, /eslint/i, /module build failed/i, /stale/i, /turbopack/i],
    explain: () => ({
      explanation:
        "The app failed during compilation, bundling, linting, or development-server module loading.",
      rootCause:
        "The first compiler error, stale cache, missing generated chunk, or unsupported dependency shape is blocking the build pipeline.",
      category: "Build/dev server",
      severity: "High",
      fixTime: "3-20 min",
      solutions: [
        makeSolution(1, "Fix the first compiler-owned error", "84%", "Medium", `npm run lint\nnpm run build`),
        makeSolution(2, "Restart the dev server cleanly", "78%", "Low", `npm run dev -- --hostname 127.0.0.1 --port 3000`),
        makeSolution(3, "Clear stale framework cache after stopping dev", "70%", "Medium", `# Stop the dev server first, then remove the framework build cache and rebuild.`),
      ],
      prevention:
        "Restart dev servers after dependency, route, or generated-client changes and keep CI running lint/build.",
      errorMap: ["Source changes", "Compiler builds graph", "First build error blocks runtime"],
      learningTips: [
        "The first build error is usually more important than later cascades.",
        "Multiple dev servers can make you test stale output.",
        "Cache clearing should happen after stopping the server.",
      ],
    }),
  },
  {
    id: "python-import",
    category: "Python import",
    severity: "Medium",
    fixTime: "4-18 min",
    keywords: [/traceback/i, /importerror/i, /modulenotfounderror/i, /django/i, /flask/i, /python/i],
    explain: (evidence) => ({
      explanation:
        "Python could not import a module or name from the active interpreter environment.",
      rootCause: evidence.packageName
        ? `"${evidence.packageName}" is missing from the active environment, shadowed by a local file, or imported from the wrong path.`
        : "The active interpreter, virtual environment, file name, or package path does not match the import.",
      category: "Python import",
      severity: "Medium",
      fixTime: "4-18 min",
      solutions: [
        makeSolution(1, "Verify the active interpreter", "82%", "Low", `python -c "import sys; print(sys.executable)"`),
        makeSolution(2, "Install into that same interpreter", "78%", "Low", `python -m pip install ${evidence.packageName || "<package>"}`),
        makeSolution(3, "Check local file shadowing", "66%", "Medium", `# Avoid files named like installed packages, e.g. requests.py or django.py`),
      ],
      prevention:
        "Use a project virtual environment and install packages with the interpreter that runs the app.",
      errorMap: ["Python starts", "Import path is searched", "Module/name not found"],
      learningTips: [
        "python -m pip avoids installing into the wrong interpreter.",
        "Local filenames can shadow installed packages.",
        "Tracebacks should be read from the bottom error plus first project frame.",
      ],
    }),
  },
  {
    id: "database",
    category: "Database/runtime data",
    severity: "High",
    fixTime: "8-35 min",
    keywords: [/database/i, /postgres/i, /sql/i, /relation .* does not exist/i, /duplicate key/i, /foreign key/i, /prisma/i, /migration/i],
    explain: () => ({
      explanation:
        "The application and database schema or data constraints disagree during a query or write.",
      rootCause:
        "A migration may be missing, a table/column name may be wrong, a constraint is being violated, or policies are blocking the operation.",
      category: "Database/runtime data",
      severity: "High",
      fixTime: "8-35 min",
      solutions: [
        makeSolution(1, "Confirm the schema exists in the target database", "82%", "Medium", `# Check migrations and the actual connected database before changing code.`),
        makeSolution(2, "Validate inserted data against constraints", "74%", "Medium", `// Log the payload shape and required IDs before the insert/update.`),
        makeSolution(3, "Check RLS or permission policies", "70%", "Medium", `// Verify the authenticated user is allowed to read/write the row.`),
      ],
      prevention:
        "Run migrations in every environment and test create/read/update paths with realistic user permissions.",
      errorMap: ["Query/write requested", "Schema and policies checked", "Database rejects mismatch"],
      learningTips: [
        "Database errors often name the exact table, column, or constraint.",
        "A local database can differ from production unless migrations are enforced.",
        "Policy failures can look like missing data.",
      ],
    }),
  },
];

function genericAnalysis(evidence: Evidence, framework?: string): Analysis {
  const hint = framework && framework !== "Auto" ? ` in the ${framework} stack` : "";

  return {
    explanation:
      `FixFlow did not find a high-confidence named pattern, but it isolated "${evidence.headline}"${hint} as the main clue.`,
    rootCause:
      evidence.projectFrame
        ? `The strongest project-owned clue is "${evidence.projectFrame}". Start there before chasing framework internals.`
        : evidence.command
          ? `The failure happened while running "${evidence.command}". Inspect the first error line after that command and the config/dependencies it loads.`
          : `The pasted headline is "${evidence.headline}". More stack context would improve confidence, but this is the safest debugging anchor.`,
    category: "General debugging",
    severity: "Medium",
    confidence: evidence.projectFrame || evidence.command ? "70%" : "62%",
    fixTime: "8-30 min",
    solutions: [
      makeSolution(1, evidence.projectFrame ? "Open the referenced project file" : "Start from the extracted headline", "74%", "Low", firstInspectionSnippet(evidence)),
      makeSolution(2, "Add one targeted diagnostic", "68%", "Medium", `console.log("FixFlow debug", {\n  clue: ${JSON.stringify(evidence.projectFrame || evidence.headline)},\n});`),
      makeSolution(3, "Retest the exact failing action", "64%", "Low", evidence.command ? evidence.command.replace(/^[$>]\s*/, "") : "Repeat the same route, request, click, or build step."),
    ],
    prevention:
      "Keep the full error headline, triggering action, command, and first project file together when reporting bugs.",
    errorMap: [evidence.headline, evidence.projectFrame ? "Project frame found" : "Main clue isolated", "Focused fix tested"],
    learningTips: [
      "Prefer project-owned stack frames over framework internals.",
      "Apply one change at a time so the next error output remains meaningful.",
      "If the first fix fails, paste the new first error line back into FixFlow.",
    ],
  };
}

function analyzeLocally(text: string, framework?: string): Analysis {
  const evidence = collectEvidence(text);
  const source = `${text}\n${framework || ""}`.toLowerCase();
  const ranked = patterns
    .map((pattern) => ({ pattern, score: scorePattern(pattern, source) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score);

  if (!ranked[0]) return genericAnalysis(evidence, framework);

  const base = ranked[0].pattern.explain(evidence, framework);
  return {
    ...base,
    confidence: confidenceFromScore(ranked[0].score, evidence),
  };
}

function safeString(value: unknown, fallback: string, max = 1200) {
  return typeof value === "string" && value.trim()
    ? value.trim().slice(0, max)
    : fallback;
}

function safeSeverity(value: unknown, fallback: Analysis["severity"]) {
  return value === "Low" || value === "Medium" || value === "High" ? value : fallback;
}

function normalizeSolutions(value: unknown, fallback: Solution[]) {
  if (!Array.isArray(value)) return fallback;

  const normalized = value
    .filter((solution) => solution && typeof solution === "object")
    .slice(0, 3)
    .map((solution, index) => {
      const record = solution as Partial<Solution>;
      return makeSolution(
        Number.isFinite(Number(record.rank)) ? Number(record.rank) : index + 1,
        safeString(record.title, fallback[index]?.title || "Inspect the referenced failing path", 160),
        safeString(record.confidence, fallback[index]?.confidence || "70%", 24),
        safeString(record.effort, fallback[index]?.effort || "Medium", 24),
        safeString(record.snippet, fallback[index]?.snippet || "Review the referenced file and apply the described fix.", 1800)
      );
    });

  return normalized.length ? normalized : fallback;
}

function isUsefulAI(ai: AIResult | null) {
  if (!ai) return false;
  const enoughText =
    typeof ai.explanation === "string" && ai.explanation.trim().length > 20 &&
    typeof ai.rootCause === "string" && ai.rootCause.trim().length > 20;
  const hasSolutions = Array.isArray(ai.solutions) && ai.solutions.some((solution) => solution?.title);

  return enoughText || hasSolutions;
}

function mergeAI(local: Analysis, ai: AIResult | null): Analysis {
  if (!isUsefulAI(ai)) return local;

  const merged: Analysis = {
    ...local,
    explanation: safeString(ai?.explanation, local.explanation),
    rootCause: safeString(ai?.rootCause, local.rootCause),
    category: safeString(ai?.category, local.category, 80),
    severity: safeSeverity(ai?.severity, local.severity),
    fixTime: safeString(ai?.fixTime, local.fixTime, 40),
    confidence: local.confidence,
    solutions: normalizeSolutions(ai?.solutions, local.solutions),
    prevention: safeString(ai?.prevention, local.prevention),
    errorMap: Array.isArray(ai?.errorMap) && ai.errorMap.length >= 2
      ? ai.errorMap.slice(0, 5).map((item) => safeString(item, "Step", 120))
      : local.errorMap,
    learningTips: Array.isArray(ai?.learningTips) && ai.learningTips.length
      ? ai.learningTips.slice(0, 4).map((item) => safeString(item, "Review the error carefully.", 180))
      : local.learningTips,
  };

  return merged;
}

function addAdvancedContext(analysis: Analysis, text: string, framework?: string): Analysis {
  const evidence = collectEvidence(text);
  const hasStackFrame = /\bat\s+.+:\d+|traceback|line\s+\d+|:\d+:\d+/i.test(text);
  const hasVersionClue = /\b(?:next|react|node|python|typescript|tailwind|supabase|prisma|vite|webpack|turbopack)[\s@:/-]*v?\d/i.test(text);
  const mentionsInstall = /\b(?:npm|pnpm|yarn|bun|pip|bundle|composer|cargo|go get|dotnet|docker)\b/i.test(text);

  const diagnostics = [
    { label: "Pattern", value: analysis.category },
    { label: "Framework hint", value: framework || "Auto detected" },
    {
      label: "Evidence",
      value: hasStackFrame
        ? "Stack frame or line number found"
        : evidence.projectFrame
          ? "Project file path found"
          : "Needs more stack context",
    },
    { label: "Version clue", value: hasVersionClue ? "Version/package clue found" : "No version clue" },
    { label: "Environment clue", value: mentionsInstall ? "Tooling/package command mentioned" : "No tooling command" },
    { label: "Input quality", value: evidence.lines.length >= 3 ? "Multi-line trace" : "Short report" },
  ];

  const nextActions = [
    analysis.solutions[0]?.title ? `Try first: ${analysis.solutions[0].title}.` : "Start with the first project-owned frame.",
    evidence.projectFrame ? "Open the referenced project file and inspect the exact line." : "Paste the exact file path and line number if the first fix is unclear.",
    evidence.command ? `Re-run: ${evidence.command.replace(/^[$>]\s*/, "")}.` : "Repeat the same failing route, click, request, or build step.",
  ];

  const numericConfidence = Number.parseInt(analysis.confidence, 10);
  const confidenceReason =
    numericConfidence >= 84
      ? "High confidence from a recognizable error pattern plus concrete evidence in the paste."
      : numericConfidence >= 70
        ? "Moderate confidence from a matching pattern, but more project context would improve precision."
        : "Lower confidence because the paste has limited stack, version, or project-file evidence.";

  const impact =
    analysis.severity === "High"
      ? "Likely blocks build, startup, authentication, data writes, or a core runtime path until fixed."
      : analysis.severity === "Medium"
        ? "Likely affects a visible workflow or creates repeated runtime failures."
        : "Usually localized and unlikely to block the whole app.";

  return {
    ...analysis,
    diagnostics,
    nextActions,
    confidenceReason,
    impact,
  };
}

export async function analyzeError(input: string, options: AnalyzeOptions = {}) {
  const text = cleanText(input);

  if (text.length < MIN_INPUT_LENGTH) {
    throw new Error("Paste at least a few words from the error or stack trace.");
  }

  const detected = detectFramework(text);
  const framework = options.framework && options.framework !== "Auto"
    ? options.framework
    : detected.framework || detected.language;
  const local = analyzeLocally(text, framework);
  const ai = options.useAI === false
    ? null
    : await queryAI(text, framework).catch(() => null);
  const analysis = addAdvancedContext(mergeAI(local, ai), text, framework);

  return {
    detected,
    analysis,
  };
}
