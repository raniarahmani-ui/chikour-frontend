export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "/api";

function getAuthToken() {
  return localStorage.getItem("token") || localStorage.getItem("userToken");
}

async function parseJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }
  try {
    return await response.json();
  } catch (error) {
    return null;
  }
}

async function apiRequest(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getAuthToken();
  if (token && !headers.Authorization) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await parseJson(response);

  if (!response.ok || data?.success === false) {
    const message = data?.message || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return data ?? { success: response.ok };
}

export async function apiGet(path) {
  return apiRequest(path);
}

export async function apiPost(path, body) {
  return apiRequest(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiPut(path, body) {
  return apiRequest(path, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

export async function apiDelete(path) {
  return apiRequest(path, {
    method: "DELETE",
  });
}
