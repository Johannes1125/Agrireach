import { NextRequest } from "next/server";
import { verificationOtpEmailHtml, passwordResetEmailHtml } from "@/server/utils/emailTemplates";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "verification";
  
  let html = "";
  
  if (type === "verification") {
    html = verificationOtpEmailHtml({
      code: "123456",
      email: "user@example.com",
      appName: "AgriReach",
      baseUrl: "http://localhost:3000",
      supportEmail: "support@agrireach.com",
      expireMinutes: 10
    });
  } else if (type === "reset") {
    html = passwordResetEmailHtml({
      resetUrl: "http://localhost:3000/auth/reset-password?token=sample-token",
      email: "user@example.com",
      appName: "AgriReach",
      baseUrl: "http://localhost:3000",
      supportEmail: "support@agrireach.com",
      expireMinutes: 30
    });
  }

  return new Response(html, {
    headers: {
      "Content-Type": "text/html",
    },
  });
}
