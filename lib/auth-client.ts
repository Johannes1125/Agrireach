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
  });
  const json = await safeJson(res);
  if (!res.ok) return { success: false, message: json?.message || "Login failed" };
  const { accessToken, refreshToken } = json.data || {};
  setTokens(accessToken, refreshToken);
  return { success: true, data: { accessToken, refreshToken } };
}

export async function register(payload: { name: string; email: string; password: string; role: string }) {
  const res = await fetch("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const json = await safeJson(res);
  if (!res.ok) return { success: false, message: json?.message || "Registration failed" };
  return { success: true, data: json.data };
}

export async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;
  const res = await fetch("/api/auth/refresh", {
    method: "POST",
    headers: { Authorization: `Bearer ${refresh}` },
  });
  const json = await safeJson(res);
  if (!res.ok) return null;
  const token = json?.data?.accessToken;
  if (token) setTokens(token);
  return token || null;
}

export async function authFetch(input: RequestInfo, init: RequestInit = {}) {
  const addAuth = async () => {
    let token = getAccessToken();
    if (!token) token = await refreshAccessToken();
    const headers = new Headers(init.headers || {});
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return { ...init, headers };
  };
  const req = await addAuth();
  let res = await fetch(input, req);
  if (res.status === 401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const headers = new Headers(req.headers || {});
      headers.set("Authorization", `Bearer ${newToken}`);
      res = await fetch(input, { ...req, headers });
    }
  }
  return res;
}
