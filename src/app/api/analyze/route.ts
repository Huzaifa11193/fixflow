import { NextResponse } from "next/server";

import { queryAI } from "@/lib/ai";
import { detectFramework } from "@/lib/detect";

type Solution = {
  rank: number;
  title: string;
  confidence: string;
  effort: string;
  snippet: string;
};

type Analysis = {
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

const headers = {
  "Cache-Control": "no-store",
};

function makeSolution(
  rank: number,
  title: string,
  confidence: string,
  effort: string,
  snippet: string
): Solution {
  return { rank, title, confidence, effort, snippet };
}

function hydrationAnalysis(): Analysis {
  return {
    explanation:
      "React expected the browser to hydrate markup that matched the server HTML, but a value changed before hydration finished.",
    rootCause:
      "A component is rendering browser-only or time-sensitive output during the first render.",
    category: "React hydration",
    severity: "Medium",
    confidence: "92%",
    fixTime: "2-8 min",
    solutions: [
      makeSolution(
        1,
        "Move unstable values into useEffect",
        "92%",
        "Low",
        `"use client";\n\nconst [mounted, setMounted] = useState(false);\n\nuseEffect(() => {\n  setMounted(true);\n}, []);\n\nif (!mounted) return <span suppressHydrationWarning />;`
      ),
      makeSolution(
        2,
        "Render a deterministic server fallback",
        "84%",
        "Low",
        `const displayTime = mounted\n  ? new Date().toLocaleTimeString()\n  : "--:--";\n\nreturn <span>{displayTime}</span>;`
      ),
      makeSolution(
        3,
        "Disable SSR for truly client-only widgets",
        "73%",
        "Medium",
        `import dynamic from "next/dynamic";\n\nconst ClientClock = dynamic(() => import("./client-clock"), {\n  ssr: false,\n});`
      ),
    ],
    prevention:
      "Keep the first render deterministic. Avoid Date, Math.random, window, localStorage, and locale-only formatting during SSR.",
    errorMap: ["Server renders HTML", "Client computes a different value", "React detects mismatch"],
    learningTips: [
      "Audit first render for Date.now, Math.random, window, and localStorage.",
      "Use mounted state for browser-only UI.",
      "Prefer stable placeholders for values that change immediately.",
    ],
  };
}

function dependencyAnalysis(text: string): Analysis {
  const missing =
    text.match(/cannot find module\s+['"]([^'"]+)['"]/i)?.[1] ||
    text.match(/cannot find module\s+(@?[\w./-]+)/i)?.[1] ||
    text.match(/module not found:\s*(?:can't resolve\s*)?['"]?(@?[\w./-]+)['"]?/i)?.[1] ||
    text.match(/modulenotfounderror:\s*no module named\s+['"]?([\w.-]+)['"]?/i)?.[1];

  return {
    explanation:
      "The runtime or bundler cannot resolve a package or local module referenced by the code.",
    rootCause: missing
      ? `The module "${missing}" is missing, misnamed, or resolved from the wrong path.`
      : "A dependency or import path cannot be resolved from the current project.",
    category: "Dependency resolution",
    severity: "High",
    confidence: "86%",
    fixTime: "3-12 min",
    solutions: [
      makeSolution(
        1,
        "Install or restore the missing dependency",
        "88%",
        "Low",
        `npm install ${missing && !missing.startsWith(".") ? missing : "<package-name>"}`
      ),
      makeSolution(
        2,
        "Check import path and filename casing",
        "78%",
        "Low",
        `// Windows may hide casing mistakes that fail in CI/Linux\nimport { thing } from "@/lib/example";`
      ),
      makeSolution(
        3,
        "Rebuild dependency artifacts",
        "68%",
        "Medium",
        `Remove stale generated output, reinstall packages, then restart the dev server.`
      ),
    ],
    prevention:
      "Keep package installs committed through the lockfile and avoid casing mismatches in import paths.",
    errorMap: ["Import is requested", "Resolver searches project and node_modules", "Module is missing or mismatched"],
    learningTips: [
      "Read the first unresolved module name before chasing stack frames.",
      "Compare package.json, lockfile, and import path.",
      "Restart the dev server after installing new packages.",
    ],
  };
}

function tailwindAnalysis(): Analysis {
  return {
    explanation:
      "Tailwind styles are not being generated or applied for the class you expect.",
    rootCause:
      "The class may be dynamic, outside Tailwind content scanning, overridden by CSS, or invalid for the installed Tailwind version.",
    category: "Styling",
    severity: "Low",
    confidence: "82%",
    fixTime: "2-10 min",
    solutions: [
      makeSolution(
        1,
        "Avoid fully dynamic class names",
        "88%",
        "Low",
        `const tones = {\n  success: "bg-emerald-400 text-[#071015]",\n  danger: "bg-rose-400 text-white",\n};`
      ),
      makeSolution(
        2,
        "Confirm Tailwind scans the file",
        "76%",
        "Low",
        `// Make sure components/pages are inside scanned app or src paths.`
      ),
      makeSolution(
        3,
        "Check conflicting styles",
        "64%",
        "Medium",
        `// Inspect computed styles and remove stronger conflicting selectors.`
      ),
    ],
    prevention:
      "Use explicit class maps for variants and keep UI files in Tailwind-scanned directories.",
    errorMap: ["Class appears in JSX", "Tailwind scans source", "CSS is generated and applied"],
    learningTips: [
      "Tailwind cannot generate classes it cannot see as strings.",
      "Variant maps are safer than string concatenation.",
      "Computed styles reveal overrides quickly.",
    ],
  };
}

function typeErrorAnalysis(): Analysis {
  return {
    explanation:
      "JavaScript tried to access or call something that is undefined, null, or not the expected type.",
    rootCause:
      "A value is missing at runtime, often due to async data, optional props, wrong API shape, or an unguarded nested property.",
    category: "Runtime TypeError",
    severity: "Medium",
    confidence: "80%",
    fixTime: "5-15 min",
    solutions: [
      makeSolution(
        1,
        "Guard optional data before use",
        "84%",
        "Low",
        `if (!user) return null;\n\nreturn <Profile name={user.name ?? "Unknown"} />;`
      ),
      makeSolution(
        2,
        "Validate API response shape",
        "72%",
        "Medium",
        `const items = Array.isArray(data?.items) ? data.items : [];`
      ),
      makeSolution(
        3,
        "Trace the first bad assignment",
        "66%",
        "Medium",
        `console.log({ value, type: typeof value });`
      ),
    ],
    prevention:
      "Type API boundaries and render fallback states while async data is loading.",
    errorMap: ["Value is expected", "Runtime value is missing", "Property access or function call fails"],
    learningTips: [
      "The first stack frame in your code usually matters most.",
      "Optional chaining hides crashes but not broken data flow.",
      "Good loading and empty states prevent many TypeErrors.",
    ],
  };
}

function pythonAnalysis(): Analysis {
  return {
    explanation:
      "Python cannot import a referenced module or name from the current environment.",
    rootCause:
      "The package may not be installed in the active environment, the file name may shadow a package, or the import path is wrong.",
    category: "Python import",
    severity: "Medium",
    confidence: "78%",
    fixTime: "4-15 min",
    solutions: [
      makeSolution(1, "Verify the active environment", "82%", "Low", `python -m pip show <package>`),
      makeSolution(2, "Install into the same interpreter", "78%", "Low", `python -m pip install <package>`),
      makeSolution(3, "Check local file shadowing", "65%", "Medium", `# Avoid files named like installed packages, e.g. requests.py`),
    ],
    prevention:
      "Use project virtual environments and install packages with the same interpreter that runs the app.",
    errorMap: ["Python starts", "Import path is searched", "Module or name is not found"],
    learningTips: [
      "Use python -m pip to avoid installing into the wrong Python.",
      "Check sys.path when imports behave strangely.",
      "Local filenames can shadow real packages.",
    ],
  };
}

function envConfigAnalysis(): Analysis {
  return {
    explanation:
      "The app is trying to read a configuration value that is missing, unavailable in the current runtime, or named differently than the code expects.",
    rootCause:
      "An environment variable, API key, project URL, or runtime secret is not configured for the process handling this request.",
    category: "Environment config",
    severity: "High",
    confidence: "84%",
    fixTime: "3-10 min",
    solutions: [
      makeSolution(
        1,
        "Verify the exact env variable names",
        "88%",
        "Low",
        `// Next.js browser env values must start with NEXT_PUBLIC_\nNEXT_PUBLIC_SUPABASE_URL=https://...\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...`
      ),
      makeSolution(
        2,
        "Restart the dev server after editing env files",
        "82%",
        "Low",
        `# Stop the current dev server, then run:\nnpm run dev`
      ),
      makeSolution(
        3,
        "Keep server-only secrets out of client components",
        "72%",
        "Medium",
        `// Use non-public keys only in API routes or server utilities.\nconst secret = process.env.SERVICE_ROLE_KEY;`
      ),
    ],
    prevention:
      "Document required env variables in .env.example and restart the dev server whenever .env.local changes.",
    errorMap: ["Code requests config", "Runtime env is checked", "Missing value breaks feature"],
    learningTips: [
      "Client-exposed Next.js env values need the NEXT_PUBLIC_ prefix.",
      "Env files are read at process startup.",
      "Never expose service-role or private API keys in client code.",
    ],
  };
}

function reactHookAnalysis(): Analysis {
  return {
    explanation:
      "React detected that a hook is being called in an invalid place or with unstable dependencies.",
    rootCause:
      "Hooks must run in the same order on every render and dependency arrays must include values used inside effects or callbacks.",
    category: "React hooks",
    severity: "Medium",
    confidence: "82%",
    fixTime: "4-12 min",
    solutions: [
      makeSolution(
        1,
        "Move hooks to the top level of the component",
        "86%",
        "Low",
        `function Component() {\n  const [value, setValue] = useState(null);\n\n  if (!value) return null;\n  return <div>{value}</div>;\n}`
      ),
      makeSolution(
        2,
        "Include dependencies used inside effects",
        "78%",
        "Low",
        `useEffect(() => {\n  loadUser(userId);\n}, [userId]);`
      ),
      makeSolution(
        3,
        "Wrap event logic in callbacks when needed",
        "66%",
        "Medium",
        `const handleSave = useCallback(() => {\n  save(formState);\n}, [formState]);`
      ),
    ],
    prevention:
      "Keep hooks at the top of components and treat dependency warnings as data-flow bugs, not noise.",
    errorMap: ["Component renders", "Hook order/dependency is checked", "React warns or crashes"],
    learningTips: [
      "Hooks cannot run inside conditionals, loops, or nested functions.",
      "Effect dependencies describe the values the effect reads.",
      "Stable callbacks reduce accidental reruns but should not hide missing dependencies.",
    ],
  };
}

function networkAnalysis(): Analysis {
  return {
    explanation:
      "A request to another service failed before the app received the expected response.",
    rootCause:
      "The target URL may be wrong, blocked by CORS, offline, protected by auth, or returning a non-JSON error page.",
    category: "Network/API",
    severity: "Medium",
    confidence: "79%",
    fixTime: "5-20 min",
    solutions: [
      makeSolution(
        1,
        "Check status code and response body before parsing",
        "84%",
        "Low",
        `const res = await fetch(url);\nconst text = await res.text();\nif (!res.ok) throw new Error(text || res.statusText);\nconst data = JSON.parse(text);`
      ),
      makeSolution(
        2,
        "Verify the API URL and method",
        "76%",
        "Low",
        `fetch("/api/analyze", {\n  method: "POST",\n  headers: { "Content-Type": "application/json" },\n  body: JSON.stringify(payload),\n});`
      ),
      makeSolution(
        3,
        "Handle CORS/auth separately",
        "68%",
        "Medium",
        `// Confirm cookies/tokens are sent and the server allows your origin.`
      ),
    ],
    prevention:
      "Always check response.ok and parse defensive text before assuming a JSON response.",
    errorMap: ["Client sends request", "Server/network responds", "Client parses or handles error"],
    learningTips: [
      "A 500 HTML page will crash code that blindly calls response.json.",
      "CORS errors are browser-enforced and may not reach your server logs.",
      "Auth failures often look like parsing errors when the server returns an HTML login page.",
    ],
  };
}

function buildAnalysis(): Analysis {
  return {
    explanation:
      "The app failed during compilation, bundling, or development-server module loading.",
    rootCause:
      "The build cache may be stale, a generated chunk may be missing, or the dev server is serving files from an older build.",
    category: "Build/dev server",
    severity: "High",
    confidence: "81%",
    fixTime: "3-15 min",
    solutions: [
      makeSolution(
        1,
        "Restart the dev server on a clean port",
        "86%",
        "Low",
        `# Stop old dev servers, then run:\nnpm run dev -- --hostname 127.0.0.1 --port 3000`
      ),
      makeSolution(
        2,
        "Clear the Next.js build cache",
        "78%",
        "Medium",
        `# Stop dev server first, then remove .next and rebuild.`
      ),
      makeSolution(
        3,
        "Fix the first TypeScript or ESLint error",
        "72%",
        "Medium",
        `npm run lint\nnpm run build`
      ),
    ],
    prevention:
      "Avoid running multiple stale dev servers after production builds; restart the server after major route or dependency changes.",
    errorMap: ["Code changes", "Next compiles chunks", "Stale/missing chunk causes runtime failure"],
    learningTips: [
      "A clean production build can pass while an old dev server still serves stale chunks.",
      "Multiple ports can hide which server you are testing.",
      "Restart after adding routes, API handlers, or dependencies.",
    ],
  };
}

function authAnalysis(): Analysis {
  return {
    explanation:
      "Authentication failed or the app could not access the expected user session.",
    rootCause:
      "Supabase credentials, redirect URLs, session persistence, email confirmation, or row-level security may be misconfigured.",
    category: "Auth/session",
    severity: "High",
    confidence: "80%",
    fixTime: "5-20 min",
    solutions: [
      makeSolution(
        1,
        "Verify Supabase URL and publishable key",
        "84%",
        "Low",
        `NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co\nNEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key`
      ),
      makeSolution(
        2,
        "Check redirect and email confirmation settings",
        "76%",
        "Medium",
        `// Supabase Auth > URL Configuration\n// Add your local URL, e.g. http://127.0.0.1:3004`
      ),
      makeSolution(
        3,
        "Confirm RLS policies for user-owned rows",
        "70%",
        "Medium",
        `using (auth.uid() = user_id)\nwith check (auth.uid() = user_id)`
      ),
    ],
    prevention:
      "Keep auth URLs, env variables, and RLS policies documented together before adding new protected pages.",
    errorMap: ["User submits auth form", "Supabase validates session", "App reads protected data"],
    learningTips: [
      "A valid client key is not enough if redirect URLs are missing.",
      "Email confirmation can block immediate login depending on project settings.",
      "RLS errors often look like empty history or failed inserts.",
    ],
  };
}

function extractMeaningfulLines(text: string) {
  return text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function extractErrorHeadline(lines: string[]) {
  return (
    lines.find((line) =>
      /error|warning|exception|failed|cannot|can't|invalid|missing|denied|not found|timeout|crash/i.test(
        line
      )
    ) ||
    lines[0] ||
    "the pasted issue"
  );
}

function extractProjectFrame(lines: string[]) {
  return lines.find((line) =>
    /(?:src|app|pages|components|lib|server|client|api|routes)[\\/][\w./-]+(?::\d+)?/i.test(
      line
    )
  );
}

function extractCommand(lines: string[]) {
  return lines.find((line) =>
    /^(?:npm|pnpm|yarn|bun|npx|node|next|python|pip|tsx|ts-node|cargo|go|composer)\b/i.test(
      line.replace(/^[$>]\s*/, "")
    )
  );
}

function inferGenericCategory(headline: string, text: string) {
  const source = `${headline}\n${text}`.toLowerCase();

  if (/syntaxerror|unexpected token|unterminated|parse error/.test(source)) {
    return {
      category: "Syntax/parse error",
      severity: "High" as const,
      confidence: "76%",
      fixTime: "3-12 min",
    };
  }

  if (/referenceerror|is not defined|cannot access .* before initialization/.test(source)) {
    return {
      category: "Undefined reference",
      severity: "Medium" as const,
      confidence: "74%",
      fixTime: "4-15 min",
    };
  }

  if (/typescript|type .* is not assignable|property .* does not exist|ts\d+/.test(source)) {
    return {
      category: "TypeScript type error",
      severity: "Medium" as const,
      confidence: "73%",
      fixTime: "5-20 min",
    };
  }

  if (/permission|eacces|eperm|access denied|denied/.test(source)) {
    return {
      category: "Permission/access error",
      severity: "Medium" as const,
      confidence: "72%",
      fixTime: "5-20 min",
    };
  }

  if (/database|sql|postgres|supabase|relation .* does not exist|duplicate key/.test(source)) {
    return {
      category: "Database/runtime data",
      severity: "High" as const,
      confidence: "72%",
      fixTime: "8-30 min",
    };
  }

  return {
    category: "General debugging",
    severity: "Medium" as const,
    confidence: "66%",
    fixTime: "8-25 min",
  };
}

function genericRootCause({
  command,
  framework,
  headline,
  projectFrame,
}: {
  command?: string;
  framework?: string;
  headline: string;
  projectFrame?: string;
}) {
  if (projectFrame) {
    return `The strongest clue is this project file/frame: "${projectFrame}". Start there because it is closer to your code than framework internals.`;
  }

  if (command) {
    return `The failure happened while running "${command}". The next clue is usually the first error line after that command, plus any config or dependency it loads.`;
  }

  if (framework && framework !== "Auto") {
    return `The ${framework} stack reported "${headline}". The likely cause is a mismatch between what that framework expected and what the current code/config provided.`;
  }

  return `The pasted error headline is "${headline}". FixFlow could not map it to a named pattern yet, so the safest path is to isolate the exact value, file, or config item mentioned there.`;
}

function genericAnalysis(text: string, framework?: string): Analysis {
  const lines = extractMeaningfulLines(text);
  const headline = extractErrorHeadline(lines);
  const projectFrame = extractProjectFrame(lines);
  const command = extractCommand(lines);
  const inferred = inferGenericCategory(headline, text);
  const hint =
    framework && framework !== "Auto"
      ? ` in the ${framework} stack`
      : "";
  const firstInspectionTarget =
    projectFrame || command || headline;

  return {
    explanation:
      `FixFlow did not find a named high-confidence pattern yet, but it identified "${headline}"${hint} as the main clue and built a focused debugging plan from it.`,
    rootCause: genericRootCause({
      command,
      framework,
      headline,
      projectFrame,
    }),
    category: inferred.category,
    severity: inferred.severity,
    confidence: inferred.confidence,
    fixTime: inferred.fixTime,
    solutions: [
      makeSolution(
        1,
        projectFrame
          ? "Open the referenced project file first"
          : "Start from the extracted error headline",
        projectFrame ? "82%" : "74%",
        "Low",
        projectFrame
          ? `Open this location and inspect the values used on that line:\n${projectFrame}`
          : `Use this as the debugging anchor:\n${headline}`
      ),
      makeSolution(
        2,
        "Add one temporary diagnostic near the failing path",
        "70%",
        "Medium",
        `console.log("FixFlow debug", {\n  clue: ${JSON.stringify(firstInspectionTarget)},\n  route: typeof window !== "undefined" ? window.location.pathname : "server",\n});`
      ),
      makeSolution(
        3,
        command ? "Re-run the exact failing command" : "Retest the exact failing action",
        "66%",
        "Low",
        command
          ? `${command.replace(/^[$>]\s*/, "")}\n# If the output changes, paste the new first error line back into FixFlow.`
          : `Repeat the same click, route, request, or build step after one focused change.`
      ),
    ],
    prevention:
      `When this happens again, save the headline "${headline}", the triggering action, and the first project file/command in the report.`,
    errorMap: [
      headline,
      projectFrame ? "Project frame found" : command ? "Command identified" : "Clue isolated",
      "One focused fix is tested",
    ],
    learningTips: [
      projectFrame
        ? "A project-owned stack frame is usually more useful than framework internals."
        : "When no file path is present, the first error headline becomes the debugging anchor.",
      command
        ? "Keep the exact failing command with the error output."
        : "Add the route, button, or user action that triggered the error.",
      "After each fix, compare the new first error line with the previous one.",
    ],
  };
}

function analyzeLocally(text: string, framework?: string): Analysis {
  const source = `${text}\n${framework ?? ""}`.toLowerCase();

  if (/hydration|server.*client|text content did not match|hydrate/.test(source)) {
    return hydrationAnalysis();
  }

  if (/module not found|cannot find module|modulenotfounderror|prisma|npm err|pnpm|yarn/.test(source)) {
    return dependencyAnalysis(text);
  }

  if (/tailwind|class not applying|tailwindcss/.test(source)) {
    return tailwindAnalysis();
  }

  if (/env|environment variable|api key|publishable key|secret|process\.env|missing.*key|not configured/.test(source)) {
    return envConfigAnalysis();
  }

  if (/invalid hook call|react hook|exhaustive-deps|rules of hooks|useeffect|usememo|usecallback/.test(source)) {
    return reactHookAnalysis();
  }

  if (/fetch|network|cors|failed to fetch|unexpected token.*html|response\.json|json.*parse|http 4\d\d|http 5\d\d|500 internal server error|server error page|html error page/.test(source)) {
    return networkAnalysis();
  }

  if (/auth|session|login|signup|sign in|sign up|supabase|row level security|rls|not authenticated|unauthorized/.test(source)) {
    return authAnalysis();
  }

  if (/webpack|chunk|cannot find module '\.\/\d+\.js'|next build|compiled with warnings|failed to compile|eslint|typescript|module build failed|stale/i.test(source)) {
    return buildAnalysis();
  }

  if (/traceback|importerror|python|django|flask/.test(source)) {
    return pythonAnalysis();
  }

  if (/typeerror|cannot read prop|undefined is not a function|is not a function/.test(source)) {
    return typeErrorAnalysis();
  }

  return genericAnalysis(text, framework);
}

function normalizeAIResult(
  local: Analysis,
  ai: Awaited<ReturnType<typeof queryAI>> | null
): Analysis {
  if (!ai) return local;

  const solutions = Array.isArray(ai.solutions)
    ? ai.solutions
        .filter((solution) => solution && solution.title)
        .slice(0, 3)
        .map((solution, index) => ({
          rank: Number(solution.rank) || index + 1,
          title: String(solution.title),
          confidence: String(solution.confidence || local.solutions[index]?.confidence || "70%"),
          effort: String(solution.effort || local.solutions[index]?.effort || "Medium"),
          snippet: String(solution.snippet || local.solutions[index]?.snippet || "Review the referenced file and apply the described fix."),
        }))
    : local.solutions;

  return {
    ...local,
    explanation: ai.explanation || local.explanation,
    rootCause: ai.rootCause || local.rootCause,
    solutions: solutions.length > 0 ? solutions : local.solutions,
    prevention: ai.prevention || local.prevention,
  };
}

function addAdvancedContext(
  analysis: Analysis,
  text: string,
  framework?: string
): Analysis {
  const hasStackFrame = /\bat\s+.+:\d+|traceback|line\s+\d+/i.test(text);
  const mentionsInstall = /npm|pnpm|yarn|pip|bundle|composer|cargo|go get/i.test(text);
  const hasFilePath = /(?:src|app|pages|components|lib|server|client)[\\/][\w./-]+/i.test(text);

  const diagnostics = [
    {
      label: "Pattern",
      value: analysis.category,
    },
    {
      label: "Framework hint",
      value: framework || "Auto detected",
    },
    {
      label: "Evidence",
      value: hasStackFrame
        ? "Stack frame or line number found"
        : hasFilePath
          ? "Project file path found"
          : "Needs more stack context",
    },
    {
      label: "Environment clue",
      value: mentionsInstall ? "Package manager mentioned" : "No package manager clue",
    },
  ];

  const nextActions = [
    analysis.solutions[0]?.title
      ? `Try first: ${analysis.solutions[0].title}.`
      : "Start with the first relevant stack frame in your code.",
    hasFilePath
      ? "Open the referenced project file and inspect the exact line."
      : "Paste the exact file path and line number if the first fix is unclear.",
    "Run the app again after applying one fix, then compare the new error output.",
  ];

  const confidenceReason =
    analysis.confidence === "92%" || analysis.confidence === "86%"
      ? "High-confidence pattern match based on recognizable error wording."
      : "Moderate confidence because the pasted text has limited framework-specific context.";

  const impact =
    analysis.severity === "High"
      ? "Likely blocks build, startup, or runtime execution until fixed."
      : analysis.severity === "Medium"
        ? "Likely affects a visible workflow or produces noisy runtime failures."
        : "Usually localized and unlikely to block the whole app.";

  return {
    ...analysis,
    diagnostics,
    nextActions,
    confidenceReason,
    impact,
  };
}

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const text = typeof body?.text === "string" ? body.text.trim() : "";
    const framework = typeof body?.framework === "string" ? body.framework : undefined;

    if (text.length < 8) {
      return NextResponse.json(
        {
          ok: false,
          error: "Paste at least a few words from the error or stack trace.",
        },
        { status: 400, headers }
      );
    }

    const detected = detectFramework(text);
    const local = analyzeLocally(text, framework || detected.framework);
    const ai = await queryAI(text, framework || detected.framework).catch(() => null);
    const analysis = addAdvancedContext(
      normalizeAIResult(local, ai),
      text,
      framework || detected.framework
    );

    return NextResponse.json(
      {
        ok: true,
        detected,
        analysis,
      },
      { status: 200, headers }
    );
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Analysis failed.",
      },
      { status: 500, headers }
    );
  }
}
