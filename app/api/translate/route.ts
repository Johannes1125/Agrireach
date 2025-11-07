import { NextRequest, NextResponse } from "next/server";
import { v2 as translate } from "@google-cloud/translate";

// Use the correct env var from .env
const translationClient = new translate.Translate({
  key: process.env.GOOGLE_TRANSLATION_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { text, texts, targetLanguage } = body;

    if (!targetLanguage) {
      return NextResponse.json(
        { error: "Missing target language" },
        { status: 400 }
      );
    }

    // Skip translation if target is English
    if (targetLanguage === "en") {
      if (texts) {
        return NextResponse.json({ translations: texts });
      }
      return NextResponse.json({ translatedText: text });
    }

    // Batch translation (multiple texts)
    if (texts && Array.isArray(texts)) {
      if (texts.length === 0) {
        return NextResponse.json({ translations: [] });
      }

      // Translate all texts in ONE API call
      const [translations] = await translationClient.translate(
        texts,
        targetLanguage
      );

      return NextResponse.json({
        translations: Array.isArray(translations)
          ? translations
          : [translations],
        targetLanguage,
      });
    }

    // Single text translation (fallback)
    if (!text) {
      return NextResponse.json(
        { error: "Missing text or texts" },
        { status: 400 }
      );
    }

    const [translation] = await translationClient.translate(
      text,
      targetLanguage
    );

    return NextResponse.json({
      translatedText: translation,
      originalText: text,
      targetLanguage,
    });
  } catch (error) {
    console.error("Translation error:", error);
    return NextResponse.json(
      {
        error: "Translation failed",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
