document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorAlert = document.getElementById("errorAlert");
    errorAlert.classList.add("d-none");

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            errorAlert.textContent = "Invalid username or password.";
            errorAlert.classList.remove("d-none");
            return;
        }

        const data = await res.json();
        setTokens(data.access, data.refresh);
        window.location.href = "dashboard.html";
    } catch (err) {
        errorAlert.textContent = "Something went wrong. Please try again.";
        errorAlert.classList.remove("d-none");
    }
});
document.getElementById("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;
    const errorAlert = document.getElementById("errorAlert");
    errorAlert.classList.add("d-none");

    try {
        const res = await fetch(`${API_BASE_URL}/auth/login/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
            errorAlert.textContent = "Invalid username or password.";
            errorAlert.classList.remove("d-none");
            return;
        }

        const data = await res.json();
        setTokens(data.access, data.refresh);
        sessionStorage.setItem("cached_user", JSON.stringify({
            id: data.id,
            username: data.username,
            role: data.role,
        }));
        window.location.href = "dashboard.html";
    } catch (err) {
        errorAlert.textContent = "Something went wrong. Please try again.";
        errorAlert.classList.remove("d-none");
    }
});