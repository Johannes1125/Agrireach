import { NextRequest, NextResponse } from "next/server";
import { getSupportedLanguages } from "@/lib/translate";

export async function GET(req: NextRequest) {
  try {
    const languages = await getSupportedLanguages();

    return NextResponse.json({
      success: true,
      data: { languages },
    });
  } catch (error: any) {
    console.error("Get languages API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch languages" },
      { status: 500 }
    );
  }
}
