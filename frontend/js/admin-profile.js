async function loadAdminProfile() {
    const res = await apiFetch("/auth/me/");
    if (!res || !res.ok) return;
    const data = await res.json();

    document.getElementById("username").value = data.username;
    document.getElementById("role").value = data.role;
    document.getElementById("phone").value = data.phone || "";

    if (data.profile_picture) {
        showAvatarPreview(data.profile_picture);
    }
}

function showAvatarPreview(url) {
    document.getElementById("avatarPreview").src = url;
    document.getElementById("avatarPreview").style.display = "block";
    document.getElementById("avatarPlaceholderIcon").style.display = "none";
}

document.getElementById("avatarInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showAvatarPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("profile_picture", file);

    const res = await apiFetch("/auth/me/", { method: "PATCH", body: formData });
    const msgEl = document.getElementById("avatarMsg");

    if (res && res.ok) {
        const updated = await res.json();
        let cachedUser = JSON.parse(sessionStorage.getItem("cached_user") || "{}");
        cachedUser.profile_picture = updated.profile_picture;
        sessionStorage.setItem("cached_user", JSON.stringify(cachedUser));

        msgEl.textContent = "Profile picture updated.";
        msgEl.className = "alert alert-success mt-2 py-2 text-center small";
        renderSidebarAndNavbar();
    } else {
        msgEl.textContent = "Failed to upload picture.";
        msgEl.className = "alert alert-danger mt-2 py-2 text-center small";
    }
});

document.getElementById("profileForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = { phone: document.getElementById("phone").value };

    const res = await apiFetch("/auth/me/", { method: "PATCH", body: JSON.stringify(payload) });
    const msgEl = document.getElementById("profileMsg");

    if (res && res.ok) {
        msgEl.textContent = "Profile updated successfully.";
        msgEl.className = "alert alert-success mt-2 py-2";
    } else {
        msgEl.textContent = "Something went wrong.";
        msgEl.className = "alert alert-danger mt-2 py-2";
    }
});

document.addEventListener("DOMContentLoaded", loadAdminProfile);
