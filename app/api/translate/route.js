import { NextResponse } from "next/server";

const DEFAULT_LT_URL =
  process.env.LIBRETRANSLATE_URL || "https://libretranslate.com/translate";

export async function POST(req) {
  try {
    const body = await req.json();
    // Accept both { q, target } and { text, targetLang } from clients
    const q = body?.q ?? body?.text;
    const target = body?.target ?? body?.targetLang;
    const source = body?.source || "auto";
    const format = body?.format || "text";
    console.debug("/api/translate POST", {
      q: q?.slice?.(0, 100),
      target,
      source,
      format,
    });

    if (!q) {
      return NextResponse.json(
        { error: "Missing 'q' (text to translate)" },
        { status: 400 }
      );
    }
    if (!target) {
      return NextResponse.json(
        { error: "Missing 'target' language code" },
        { status: 400 }
      );
    }

    const res = await fetch(DEFAULT_LT_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ q, source, target, format }),
      cache: "no-store",
    });

    if (res.status === 400) {
      const msg = await safeParseJson(res);
      return NextResponse.json(
        { error: msg?.error || "LibreTranslate returned 400 Bad Request" },
        { status: 400 }
      );
    }
    if (res.status === 502) {
      return NextResponse.json(
        { error: "LibreTranslate returned 502 Bad Gateway" },
        { status: 502 }
      );
    }
    if (!res.ok) {
      const msg = await safeParseJson(res);
      return NextResponse.json(
        {
          error:
            msg?.error ||
            `LibreTranslate error: ${res.status} ${res.statusText}`,
        },
        { status: res.status }
      );
    }

    const data = await res.json();
    // Normalize response: prefer { translatedText } if present
    if (
      data &&
      typeof data === "object" &&
      (data.translatedText || data.translated_text)
    ) {
      return NextResponse.json(
        { translatedText: data.translatedText ?? data.translated_text },
        { status: 200 }
      );
    }
    // Otherwise return the full data payload
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: "Translation failed", details: String(err?.message || err) },
      { status: 502 }
    );
  }
}

async function safeParseJson(res) {
  try {
    return await res.json();
  } catch {
    return null;
  }
}
