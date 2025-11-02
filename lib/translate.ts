/* eslint-disable @typescript-eslint/no-explicit-any */
type Translatable =
  | string
  | Record<string, string>
  | Array<string>
  | Array<Record<string, string>>;

type TranslateOptions = {
  target: string; // required target language
  // If true, persist to localStorage on client
  persist?: boolean;
  // cache TTL in ms (default 24h)
  ttlMs?: number;
};

const DEFAULT_TTL = 24 * 60 * 60 * 1000; // 24 hours
const STORAGE_PREFIX = "lt_cache_v1:";
// Known LibreTranslate language codes (common public instances). Update if your instance differs.
const SUPPORTED_CODES = new Set([
  "en",
  "ar",
  "az",
  "zh",
  "cs",
  "de",
  "es",
  "fr",
  "hi",
  "it",
  "ja",
  "nl",
  "pl",
  "pt",
  "ro",
  "ru",
  "sr",
  "sv",
  "tr",
  "uk",
  "vi",
]);

// Simple in-memory cache valid per runtime instance (server process or browser tab)
const memoryCache = new Map<string, { value: string; expires: number }>();

// Prevent duplicate in-flight requests for same key
const pending = new Map<string, Promise<string>>();

function isServer() {
  return typeof window === "undefined";
}

function now() {
  return Date.now();
}

function getBaseUrl() {
  // Use env var if set, otherwise reasonable defaults for dev/production
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function cacheKey(text: string, target: string) {
  return `${target}:${text}`;
}

function getFromMemory(key: string) {
  const item = memoryCache.get(key);
  if (!item) return null;
  if (item.expires < now()) {
    memoryCache.delete(key);
    return null;
  }
  return item.value;
}

function setToMemory(key: string, value: string, ttlMs: number) {
  memoryCache.set(key, { value, expires: now() + ttlMs });
}

function getFromStorage(key: string) {
  if (isServer()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { v: string; e: number };
    if (parsed.e < now()) {
      window.localStorage.removeItem(STORAGE_PREFIX + key);
      return null;
    }
    return parsed.v;
  } catch {
    return null;
  }
}

function setToStorage(key: string, value: string, ttlMs: number) {
  if (isServer()) return;
  try {
    const payload = JSON.stringify({ v: value, e: now() + ttlMs });
    window.localStorage.setItem(STORAGE_PREFIX + key, payload);
  } catch {
    // ignore storage errors
  }
}

async function translateSingle(
  text: string,
  target: string,
  opts?: Omit<TranslateOptions, "target">
): Promise<string> {
  const ttlMs = opts?.ttlMs ?? DEFAULT_TTL;

  const key = cacheKey(text, target);

  // Validate target code to avoid 400 errors from remote service
  if (!SUPPORTED_CODES.has(target)) {
    try {
      console.warn("[translate] unsupported target language; skipping call", {
        target,
      });
    } catch {}
    return text;
  }

  // Memory cache
  const memo = getFromMemory(key);
  if (memo != null) return memo;

  // localStorage cache (browser only)
  const stored = getFromStorage(key);
  if (stored != null) {
    setToMemory(key, stored, ttlMs);
    return stored;
  }

  // De-duplicate concurrent same-key translations
  const pendingReq = pending.get(key);
  if (pendingReq) return pendingReq;

  const p = (async () => {
    try {
      console.debug("[translate] request", { q: text, target });
    } catch {}
    const url = `${isServer() ? getBaseUrl() : ""}/api/translate`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
      body: JSON.stringify({
        q: text,
        source: "auto",
        target,
        format: "text",
      }),
    });

    if (res.status === 400) {
      const msg = await safeParse(res);
      throw new Error(msg?.error || "Bad Request");
    }
    if (res.status === 502) {
      const msg = await safeParse(res);
      throw new Error(msg?.error || "Bad Gateway");
    }
    if (!res.ok) {
      const msg = await safeParse(res);
      throw new Error(
        msg?.error || `Translate failed: ${res.status} ${res.statusText}`
      );
    }

    const data = (await res.json()) as { translatedText: string };
    try {
      console.debug("[translate] response", {
        target,
        translated: data?.translatedText,
      });
    } catch {}
    const value = data?.translatedText ?? text;

    setToMemory(key, value, ttlMs);
    if (opts?.persist !== false) setToStorage(key, value, ttlMs);

    return value;
  })()
    .catch((e) => {
      try {
        console.warn("[translate] error", e);
      } catch {}
      // On failure, return original text to avoid blank UI
      return text;
    })
    .finally(() => {
      pending.delete(key);
    });

  pending.set(key, p);
  const result = await p;
  return result;
}

async function safeParse(res: Response): Promise<any | null> {
  try {
    return await res.json();
  } catch {
    return null;
  }
}

// Public API: translate string, array or object of strings
export async function translate(
  input: Translatable,
  target: string,
  opts?: Omit<TranslateOptions, "target">
): Promise<Translatable> {
  if (!target) throw new Error("Target language is required");

  if (typeof input === "string") {
    if (!input.trim()) return input;
    return translateSingle(input, target, opts);
  }

  if (Array.isArray(input)) {
    const out = await Promise.all(
      input.map((item) =>
        typeof item === "string"
          ? translateSingle(item, target, opts)
          : translateObject(item as Record<string, string>, target, opts)
      )
    );
    return out as any;
  }

  return translateObject(input as Record<string, string>, target, opts);
}

async function translateObject(
  obj: Record<string, string>,
  target: string,
  opts?: Omit<TranslateOptions, "target">
) {
  const entries = Object.entries(obj);
  const translated = await Promise.all(
    entries.map(async ([k, v]) => {
      if (typeof v !== "string") return [k, v] as [string, any];
      if (!v.trim()) return [k, v] as [string, string];
      const t = await translateSingle(v, target, opts);
      return [k, t] as [string, string];
    })
  );
  return Object.fromEntries(translated);
}

export async function detectLanguage(text: string) {
  if (!text) return null;
  const url =
    process.env.LIBRETRANSLATE_DETECT_URL ||
    (process.env.LIBRETRANSLATE_URL || "https://libretranslate.com") +
      "/detect";

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q: text }),
      cache: "no-store",
    });

    if (!res.ok) {
      return null;
    }

    const data = await res.json();
    // LibreTranslate returns an array of detections with {language, confidence}
    if (Array.isArray(data) && data.length > 0) {
      return data[0]?.language ?? null;
    }
    // Some instances may return {language, confidence}
    if (data?.language) return data.language;
    return null;
  } catch (err) {
    return null;
  }
}

export async function getSupportedLanguages() {
  const url =
    process.env.LIBRETRANSLATE_LANGUAGES_URL ||
    (process.env.LIBRETRANSLATE_URL || "https://libretranslate.com") +
      "/languages";

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    const data = await res.json();
    // Expecting array of { code, name } or { language, name }
    return Array.isArray(data)
      ? data.map((d: any) => d.code ?? d.language ?? d["language"] ?? d["code"]) // normalize to code list
      : [];
  } catch (err) {
    return [];
  }
}
