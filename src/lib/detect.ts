export function detectFramework(text: string) {
  const sample = (text || "").toLowerCase();

  const result: { language?: string; framework?: string } = {};

  if (/hydration|hydration failed|react hydrate|server.*client/i.test(text)) {
    result.language = "JavaScript/TypeScript";
    result.framework = "React / Next.js";
    return result;
  }

  if (/traceback/i.test(text) || /module not found:|module "\w+" not found/i.test(text) || /traceback \(most recent call last\)/i.test(text)) {
    if (/django|flask|python/i.test(text)) {
      result.language = "Python";
      if (/django/i.test(text)) result.framework = "Django";
      else if (/flask/i.test(text)) result.framework = "Flask";
      else result.framework = "Python";
    } else if (/module not found|cannot open|importerror|modulenotfounderror/i.test(text)) {
      result.language = "JavaScript/TypeScript";
      result.framework = "Node / Frontend";
    } else {
      result.language = "Python";
    }
    return result;
  }

  if (/cannot read property|cannot read (?:property|properties)|undefined is not a function|typeerror/i.test(text)) {
    result.language = "JavaScript/TypeScript";
    result.framework = /react|next/.test(sample) ? "React / Next.js" : "Node / Browser";
    return result;
  }

  if (/no such file or directory|errno -2|enoent/i.test(text)) {
    result.language = "Node / System";
    return result;
  }

  if (/exception in thread|at java\.|java\.lang\.|nosuchmethoderror|noclassdeffounderror/i.test(text)) {
    result.language = "Java";
    result.framework = /spring/i.test(text) ? "Spring" : "Java";
    return result;
  }

  if (/sql|psql|database|pg::/i.test(text)) {
    result.language = "SQL / Database";
    return result;
  }

  if (/prisma|npm ERR|yarn v|pnpm/i.test(text)) {
    result.language = "JavaScript/TypeScript";
    result.framework = "Node / Package Manager";
    return result;
  }

  if (/tailwind|class not applying|tailwindcss/i.test(text)) {
    result.language = "CSS";
    result.framework = "Tailwind";
    return result;
  }

  if (/env|environment variable|api key|publishable key|secret|process\.env|not configured/i.test(text)) {
    result.language = "Configuration";
    result.framework = /supabase/i.test(text) ? "Supabase" : "Environment";
    return result;
  }

  if (/invalid hook call|react hook|exhaustive-deps|rules of hooks|useeffect|usememo|usecallback/i.test(text)) {
    result.language = "JavaScript/TypeScript";
    result.framework = "React";
    return result;
  }

  if (/fetch|network|cors|failed to fetch|unexpected token.*html|response\.json|json.*parse|http 4\d\d|http 5\d\d|server error page|html error page/i.test(text)) {
    result.language = "JavaScript/TypeScript";
    result.framework = "Network / API";
    return result;
  }

  if (/auth|session|login|signup|sign in|sign up|supabase|row level security|rls|not authenticated|unauthorized/i.test(text)) {
    result.language = "Auth";
    result.framework = /supabase/i.test(text) ? "Supabase Auth" : "Authentication";
    return result;
  }

  if (/webpack|chunk|cannot find module '\.\/\d+\.js'|next build|failed to compile|eslint|typescript|module build failed|stale/i.test(text)) {
    result.language = "JavaScript/TypeScript";
    result.framework = /next/i.test(text) ? "Next.js build" : "Build tooling";
    return result;
  }

  if (/rust|panic:|thread 'main' panicked/i.test(text)) {
    result.language = "Rust";
    return result;
  }

  if (/go:|panic: runtime error|goroutine/i.test(text)) {
    result.language = "Go";
    return result;
  }

  // default fallback
  result.language = "Auto";
  result.framework = "Auto";
  return result;
}
