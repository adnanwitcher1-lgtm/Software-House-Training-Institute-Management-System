const API_BASE_URL = "/api";

function getAccessToken() {
    return localStorage.getItem("access");
}

function getRefreshToken() {
    return localStorage.getItem("refresh");
}

function setTokens(access, refresh) {
    localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
}

function clearTokens() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
}

async function refreshAccessToken() {
    const refresh = getRefreshToken();
    if (!refresh) return false;
    const res = await fetch(`${API_BASE_URL}/auth/refresh/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    setTokens(data.access, null);
    return true;
}

async function apiFetch(url, options = {}) {
    options.headers = options.headers || {};

    const isFormData = options.body instanceof FormData;
    if (!isFormData) {
        options.headers["Content-Type"] = "application/json";
    }
    options.headers["Authorization"] = `Bearer ${getAccessToken()}`;

    let res = await fetch(`${API_BASE_URL}${url}`, options);

    if (res.status === 401) {
        const refreshed = await refreshAccessToken();
        if (refreshed) {
            options.headers["Authorization"] = `Bearer ${getAccessToken()}`;
            res = await fetch(`${API_BASE_URL}${url}`, options);
        } else {
            clearTokens();
            window.location.href = "login.html";
            return null;
        }
    }
    return res;
}

// Route guard: redirect to login if no token
function isTokenExpired(token) {
    if (!token) return true;
    try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        const now = Math.floor(Date.now() / 1000);
        return payload.exp < now;
    } catch {
        return true;
    }
}

function requireAuth() {
    const token = getAccessToken();
    if (!token || isTokenExpired(token)) {
        clearTokens();
        window.location.href = "login.html";
    }
}

document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".phone-input").forEach(input => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/\D/g, "").slice(0, 11);
        });
    });

    document.querySelectorAll(".cnic-input").forEach(input => {
        input.addEventListener("input", () => {
            let digits = input.value.replace(/\D/g, "").slice(0, 13);
            let formatted = digits;
            if (digits.length > 5) formatted = digits.slice(0, 5) + "-" + digits.slice(5);
            if (digits.length > 12) formatted = formatted.slice(0, 13) + "-" + digits.slice(12);
            input.value = formatted;
        });
    });

    document.querySelectorAll(".name-input").forEach(input => {
        input.addEventListener("input", () => {
            input.value = input.value.replace(/[^A-Za-z\s]/g, "");
        });
    });
});