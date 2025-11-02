import { NextRequest, NextResponse } from "next/server";
import { detectLanguage } from "@/lib/translate";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text) {
      return NextResponse.json(
        { error: "Missing required field: text" },
        { status: 400 }
      );
    }

    const detectedLanguage = await detectLanguage(text);

    return NextResponse.json({
      success: true,
      data: {
        text,
        detectedLanguage,
      },
    });
  } catch (error: any) {
    console.error("Language detection API error:", error);
    return NextResponse.json(
      { error: error.message || "Language detection failed" },
      { status: 500 }
    );
  }
}
