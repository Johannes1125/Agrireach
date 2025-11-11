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
      // FedCM migration: opt-in to FedCM prompt
      use_fedcm_for_prompt: true,
      itp_support: true,
    });
    // Trigger the FedCM/One Tap prompt (no legacy moment callbacks)
    window.google.accounts.id.prompt();

    // Fallback: if nothing happens after a short delay, render a popup button and programmatically click it
    const fallbackTimeout = window.setTimeout(() => {
      if (resolved) return;
      const holder = document.createElement("div");
      holder.style.position = "fixed";
      holder.style.left = "-9999px";
      document.body.appendChild(holder);
      try {
        window.google!.accounts.id.renderButton(holder, {
          type: "standard",
          shape: "rectangular",
          theme: "outline",
          size: "large",
          text: "continue_with",
          logo_alignment: "left",
        });
        const btn = holder.querySelector("div[role=button]") as HTMLElement | null;
        if (btn) btn.click();
      } catch { /* ignore */ }
      // Final safety timeout to reject if still unresolved
      window.setTimeout(() => {
        if (!resolved) reject(new Error("Google sign-in canceled or blocked"));
        holder.remove();
      }, 15000);
    }, 3500);
  });
}


