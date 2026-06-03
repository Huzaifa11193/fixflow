import { supabase } from "@/lib/supabase";

export type HistorySolution = {
  rank: number;
  title: string;
  confidence: string;
  effort: string;
  snippet: string;
};

export type HistoryAnalysis = {
  explanation: string;
  rootCause: string;
  category: string;
  severity: "Low" | "Medium" | "High";
  confidence: string;
  fixTime: string;
  solutions: HistorySolution[];
  prevention: string;
  errorMap: string[];
  learningTips: string[];
};

export type HistoryItem = {
  id: string;
  userId?: string;
  title: string;
  input: string;
  framework?: string;
  analysis: HistoryAnalysis;
  createdAt: string;
  source: "local" | "supabase";
};

const HISTORY_EVENT = "fixflow-history-updated";
const MAX_LOCAL_HISTORY = 50;

function getStorageKey(userId?: string) {
  return `fixflow:analysis-history:${userId || "guest"}`;
}

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function makeId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function normalizeDate(value?: string) {
  return value || new Date().toISOString();
}

export function makeHistoryTitle(input: string, analysis: HistoryAnalysis) {
  const firstLine = input
    .split("\n")
    .map((line) => line.trim())
    .find(Boolean);

  if (analysis.category && firstLine) {
    return `${analysis.category}: ${firstLine}`.slice(0, 92);
  }

  return (analysis.rootCause || firstLine || "Untitled analysis").slice(0, 92);
}

export function notifyHistoryChanged() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT));
}

export function subscribeToHistory(callback: () => void) {
  if (typeof window === "undefined") return () => undefined;

  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith("fixflow:analysis-history")) callback();
  };

  window.addEventListener(HISTORY_EVENT, callback);
  window.addEventListener("storage", onStorage);

  return () => {
    window.removeEventListener(HISTORY_EVENT, callback);
    window.removeEventListener("storage", onStorage);
  };
}

export function loadLocalHistory(userId?: string): HistoryItem[] {
  if (!canUseStorage()) return [];

  try {
    const raw = window.localStorage.getItem(getStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeLocalHistory(
  items: HistoryItem[],
  userId?: string,
  shouldNotify = true
) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(
    getStorageKey(userId),
    JSON.stringify(items.slice(0, MAX_LOCAL_HISTORY))
  );
  if (shouldNotify) notifyHistoryChanged();
}

export async function loadHistory(userId?: string): Promise<HistoryItem[]> {
  const localItems = loadLocalHistory(userId);

  if (!supabase || !userId) {
    return localItems;
  }

  try {
    const { data, error } = await supabase
      .from("error_analyses")
      .select("id,input,framework,analysis,created_at,user_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(50);

    if (error || !Array.isArray(data)) {
      return localItems;
    }

    const remoteItems: HistoryItem[] = data.map((row) => {
      const analysis = row.analysis as HistoryAnalysis;
      return {
        id: String(row.id),
        userId: String(row.user_id || userId),
        title: makeHistoryTitle(String(row.input || ""), analysis),
        input: String(row.input || ""),
        framework: row.framework ? String(row.framework) : undefined,
        analysis,
        createdAt: normalizeDate(row.created_at ? String(row.created_at) : undefined),
        source: "supabase",
      };
    });

    const merged = mergeHistory(remoteItems, localItems);
    writeLocalHistory(merged, userId, false);
    return merged;
  } catch {
    return localItems;
  }
}

export async function saveHistoryItem({
  analysis,
  framework,
  input,
  userId,
}: {
  analysis: HistoryAnalysis;
  framework?: string;
  input: string;
  userId?: string;
}) {
  const item: HistoryItem = {
    id: makeId(),
    userId,
    title: makeHistoryTitle(input, analysis),
    input,
    framework,
    analysis,
    createdAt: new Date().toISOString(),
    source: "local",
  };

  const localItems = loadLocalHistory(userId);
  writeLocalHistory(mergeHistory([item], localItems), userId);

  if (!supabase || !userId) return item;

  try {
    const { data, error } = await supabase
      .from("error_analyses")
      .insert([
        {
          user_id: userId,
          input,
          framework,
          analysis,
        },
      ])
      .select("id,created_at")
      .single();

    if (!error && data?.id) {
      const syncedItem: HistoryItem = {
        ...item,
        id: String(data.id),
        createdAt: normalizeDate(
          data.created_at ? String(data.created_at) : item.createdAt
        ),
        source: "supabase",
      };
      writeLocalHistory(mergeHistory([syncedItem], localItems), userId);
      return syncedItem;
    }
  } catch {
    // Local history already has the item.
  }

  return item;
}

export async function deleteHistoryItem(item: HistoryItem, userId?: string) {
  const nextLocal = loadLocalHistory(userId).filter((entry) => entry.id !== item.id);
  writeLocalHistory(nextLocal, userId);

  if (item.source === "supabase" && supabase && userId) {
    try {
      await supabase
        .from("error_analyses")
        .delete()
        .eq("id", item.id)
        .eq("user_id", userId);
    } catch {
      // Local deletion still stands.
    }
  }
}

export function clearLocalHistory(userId?: string) {
  writeLocalHistory([], userId);
}

function mergeHistory(primary: HistoryItem[], secondary: HistoryItem[]) {
  const byId = new Map<string, HistoryItem>();

  for (const item of [...primary, ...secondary]) {
    const key = item.id || `${item.createdAt}:${item.title}`;
    byId.set(key, item);
  }

  return Array.from(byId.values()).sort(
    (a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)
  );
}

export function formatHistoryTime(value: string) {
  const date = new Date(value);
  const diffMs = Date.now() - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (Number.isNaN(date.getTime())) return "Unknown time";
  if (diffMs < minute) return "Just now";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)} min ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  if (diffMs < 7 * day) return `${Math.floor(diffMs / day)}d ago`;

  return date.toLocaleDateString();
}

export function getSeverityTone(severity?: string) {
  if (severity === "High") return "text-rose-300";
  if (severity === "Medium") return "text-amber-300";
  return "text-emerald-300";
}
