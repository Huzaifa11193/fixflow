export const historyItems = [
  {
    title: "Next.js hydration mismatch",
    meta: "React - 18 min ago",
    category: "Hydration",
    severity: "Medium",
    confidence: "92%",
    tone: "text-amber-300",
  },
  {
    title: "Module not found: prisma",
    meta: "Node.js - Yesterday",
    category: "Dependency",
    severity: "High",
    confidence: "88%",
    tone: "text-sky-300",
  },
  {
    title: "Tailwind class not applying",
    meta: "CSS - 2 days ago",
    category: "Styling",
    severity: "Low",
    confidence: "81%",
    tone: "text-emerald-300",
  },
  {
    title: "Python import cycle",
    meta: "Python - 4 days ago",
    category: "Runtime",
    severity: "Medium",
    confidence: "77%",
    tone: "text-rose-300",
  },
];

export const solutions = [
  {
    rank: "01",
    title: "Move browser-only state behind client mount",
    confidence: "92%",
    effort: "Low",
    snippet:
      "const [mounted, setMounted] = useState(false);\n\nuseEffect(() => {\n  setMounted(true);\n}, []);\n\nif (!mounted) return null;",
  },
  {
    rank: "02",
    title: "Keep server and client markup identical",
    confidence: "84%",
    effort: "Medium",
    snippet:
      "const formattedDate = new Intl.DateTimeFormat(\"en\", {\n  dateStyle: \"medium\",\n}).format(createdAt);",
  },
  {
    rank: "03",
    title: "Isolate dynamic widgets with ssr disabled",
    confidence: "76%",
    effort: "Low",
    snippet:
      "const Chart = dynamic(() => import(\"./chart\"), {\n  ssr: false,\n});",
  },
];

export const frameworks = [
  "Auto",
  "JavaScript",
  "TypeScript",
  "Node",
  "React",
  "Next.js",
  "Vue",
  "Nuxt",
  "Svelte",
  "Angular",
  "Python",
  "Django",
  "Flask",
  "Ruby",
  "Rails",
  "Java",
  "Spring",
  "Go",
  "Rust",
  "PHP",
  "Laravel",
  "C#",
  "Dotnet",
  "Swift",
  "Kotlin",
  "Android",
  "iOS",
  "Tailwind",
  "CSS",
  "Docker",
  "Kubernetes",
];

export const patternStats = [
  { label: "Hydration", count: "14", trend: "+18%", tone: "bg-amber-300" },
  { label: "Dependencies", count: "9", trend: "-6%", tone: "bg-sky-300" },
  { label: "Auth config", count: "6", trend: "+9%", tone: "bg-rose-300" },
  { label: "Styling", count: "5", trend: "-12%", tone: "bg-emerald-300" },
];

export const lessons = [
  {
    title: "Hydration without panic",
    duration: "6 min",
    progress: "72%",
    description: "Learn why server markup and browser markup must match.",
  },
  {
    title: "Dependency error triage",
    duration: "8 min",
    progress: "44%",
    description: "Read package errors and pick the fastest safe fix.",
  },
  {
    title: "Debugging imports",
    duration: "5 min",
    progress: "20%",
    description: "Find path, alias, and cycle mistakes before runtime.",
  },
];

export const integrations = [
  { name: "VS Code", status: "Planned", detail: "One-click patch apply" },
  { name: "Cursor", status: "Planned", detail: "Context-aware fix drafts" },
  { name: "Zed", status: "Roadmap", detail: "Fast local editor handoff" },
  { name: "JetBrains", status: "Roadmap", detail: "Project scan bridge" },
];
