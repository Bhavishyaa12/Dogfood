const API = import.meta.env.VITE_API_URL || "";

export async function api(path, options = {}, retry = true) {
  let token = localStorage.getItem("accessToken");
  const headers = new Headers(options.headers || {});
  if (options.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  let response = await fetch(`${API}${path}`, { ...options, headers, credentials: "include" });

  if (response.status === 401 && retry && !path.includes("/auth/")) {
    const refresh = await fetch(`${API}/api/auth/refresh-token`, { method:"POST", credentials:"include" });
    if (refresh.ok) {
      const data = await refresh.json();
      if (data.accessToken) {
        localStorage.setItem("accessToken", data.accessToken);
        return api(path, options, false);
      }
    }
  }
  return response;
}

export async function readJson(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || "Request failed");
  return data;
}

export function saveAuth(data) {
  if (data.accessToken) localStorage.setItem("accessToken", data.accessToken);
  if (data.user) localStorage.setItem("user", JSON.stringify(data.user));
}

export function currentUser() {
  try { return JSON.parse(localStorage.getItem("user") || "null"); } catch { return null; }
}

export async function logout() {
  await api("/api/auth/logout", {method:"POST"}, false).catch(()=>{});
  localStorage.removeItem("accessToken");
  localStorage.removeItem("user");
}

