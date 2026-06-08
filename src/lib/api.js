export const API_BASE = "https://promonkeybackend.onrender.com";

//export const API_BASE = "http://192.168.1.24:6969";

export function getToken() {
    if (typeof window === "undefined") return "";
    return localStorage.getItem("crm_auth_token") ?? "";
}

export function authHeaders() {
    const token = getToken();
    return {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
    };
}

export async function apiFetch(path, options = {}) {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            ...authHeaders(),
            ...options.headers,
        },
    });

    if (res.status === 401) {
        localStorage.removeItem("crm_auth_token");
        localStorage.removeItem("crm_user");
        window.location.href = "/login";
        return;
    }

    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(json.message || `Error ${res.status}: ${res.statusText}`);
    }

    return json;
}