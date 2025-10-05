declare global {
  interface Window {
    google?: any;
  }
}

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load Google script"));
    document.head.appendChild(s);
  });
}

export async function getGoogleIdToken(): Promise<string> {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID as string;
  if (!clientId) throw new Error("Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID");
  await loadScript("https://accounts.google.com/gsi/client");
  return new Promise<string>((resolve, reject) => {
    if (!window.google?.accounts?.id) return reject(new Error("Google Identity Services unavailable"));
    let resolved = false;
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response: any) => {
        if (response?.credential) {
          resolved = true;
          resolve(response.credential as string);
        } else {
          reject(new Error("No credential received"));
        }
      },
      ux_mode: "popup",
      auto_select: false,
    });
    // Use prompt to trigger One Tap / Popup
    window.google.accounts.id.prompt((notification: any) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        // Fallback to a button if prompt not displayed
        const div = document.createElement("div");
        document.body.appendChild(div);
        window.google.accounts.id.renderButton(div, { type: "standard", shape: "rectangular", theme: "outline", size: "large", text: "continue_with", logo_alignment: "left" });
        const btn = div.querySelector("div[role=button]") as HTMLElement | null;
        if (btn) btn.click();
        setTimeout(() => {
          if (!resolved) reject(new Error("Google sign-in canceled"));
          div.remove();
        }, 15000);
      }
    });
  });
}


