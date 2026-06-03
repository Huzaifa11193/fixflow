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

function genericAnalysis(): Analysis {
  return {
    explanation:
      "FixFlow could not match a specific high-confidence pattern, but the stack trace can still be triaged systematically.",
    rootCause:
      "The pasted text needs more surrounding context or belongs to a pattern not yet in the local analyzer.",
    category: "General debugging",
    severity: "Medium",
    confidence: "58%",
    fixTime: "10-30 min",
    solutions: [
      makeSolution(
        1,
        "Find the first frame inside your code",
        "75%",
        "Low",
        `Start at the earliest stack frame that points to your project files.`
      ),
      makeSolution(
        2,
        "Reduce to the smallest reproducible case",
        "66%",
        "Medium",
        `Comment out recent changes until the error disappears, then re-add one block at a time.`
      ),
      makeSolution(
        3,
        "Add missing context",
        "60%",
        "Low",
        `Paste the command you ran, package versions, and the full stack trace.`
      ),
    ],
    prevention:
      "Capture full stack traces, commands, recent changes, and environment details for each bug.",
    errorMap: ["Error occurs", "Relevant stack frame is found", "Small fix is tested"],
    learningTips: [
      "A shorter reproduction beats a longer guess.",
      "Recent changes are usually the highest-signal clue.",
      "Exact error text matters.",
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

  if (/traceback|importerror|python|django|flask/.test(source)) {
    return pythonAnalysis();
  }

  if (/typeerror|cannot read prop|undefined is not a function|is not a function/.test(source)) {
    return typeErrorAnalysis();
  }

  return genericAnalysis();
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
    const analysis = normalizeAIResult(local, ai);

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
