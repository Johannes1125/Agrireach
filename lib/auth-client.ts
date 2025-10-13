export type LoginResponse = { success: boolean; data?: { accessToken: string; refreshToken: string }; message?: string };

const ACCESS_KEY = "agrireach_at";
const REFRESH_KEY = "agrireach_rt";

export function setTokens(access: string, refresh?: string) {
  if (access) localStorage.setItem(ACCESS_KEY, access);
  if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
}

export function getAccessToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(REFRESH_KEY);
}

export function clearTokens() {
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

export async function logout(): Promise<boolean> {
  try {
    const res = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: 'include', // Send cookies
    });
    
    // Clear localStorage tokens as fallback
    clearTokens();
    
    return res.ok;
  } catch {
    // Even if the request fails, clear local tokens
    clearTokens();
    return false;
  }
}

async function safeJson(res: Response): Promise<any> {
  try {
    return await res.json();
  } catch {
    return { message: `HTTP ${res.status}` };
  }
}

export async function login(email: string, password: string): Promise<LoginResponse> {
  const res = await fetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
    credentials: 'include', // Ensure cookies are received
  });
  const json = await safeJson(res);
  if (!res.ok) return { success: false, message: json?.message || "Login failed" };
  
  // Tokens are now automatically set as HTTP cookies by the server
  // No need to store them in localStorage
  return { success: true, data: json.data };
}

export async function register(payload: { name: string; email: string; password: string; role: string }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
    credentials: 'include', // Ensure cookies are received
  });
  const json = await safeJson(res);
  if (!res.ok) return { success: false, message: json?.message || "Registration failed" };
  return { success: true, data: json.data };
}

export async function refreshAccessToken(): Promise<string | null> {
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    credentials: 'include', // Send refresh cookie
  });
  const json = await safeJson(res);
  if (!res.ok) return null;
  
  // The new access token is automatically set as a cookie by the server
  // We don't need to store it in localStorage anymore
  return json?.data?.accessToken || null;
}

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  // Use cookies for authentication - no need to manually add Bearer headers
  // The server will automatically read the JWT from the 'agrireach_at' cookie
  const res = await fetch(input, {
    ...init,
    credentials: 'include', // Ensure cookies are sent with the request
  });
  
  // If we get a 401, try to refresh the token
  if (res.status === 401) {
    const refreshRes = await fetch("/api/auth/refresh", {
      method: "POST",
      credentials: 'include', // Send refresh cookie
    });
    
    if (refreshRes.ok) {
      // Retry the original request with the new access token cookie
      return fetch(input, {
        ...init,
        credentials: 'include',
      });
    }
  }
  
  return res;
}
