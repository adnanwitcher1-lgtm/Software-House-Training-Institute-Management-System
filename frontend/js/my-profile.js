async function loadProfile() {
    const res = await apiFetch("/employees/me/");
    if (!res || !res.ok) return;
    const data = await res.json();

    document.getElementById("full_name").value = data.full_name;
    document.getElementById("designation").value = data.designation;
    document.getElementById("department").value = data.department;
    document.getElementById("email").value = data.email;
    document.getElementById("phone").value = data.phone;
    document.getElementById("address").value = data.address || "";
    document.getElementById("cnic").value = data.cnic || "";

    loadAvatar();
}

async function loadAvatar() {
    const meRes = await apiFetch("/auth/me/");
    if (!meRes || !meRes.ok) return;
    const me = await meRes.json();
    if (me.profile_picture) {
        showAvatarPreview(me.profile_picture);
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

    const res = await apiFetch("/auth/me/", { method: "PATCH", body: formData, isFormData: true });
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
    const payload = {
        phone: document.getElementById("phone").value,
        address: document.getElementById("address").value,
    };

    const res = await apiFetch("/employees/me/", { method: "PATCH", body: JSON.stringify(payload) });
    const msgEl = document.getElementById("profileMsg");

    if (res && res.ok) {
        msgEl.textContent = "Profile updated successfully.";
        msgEl.className = "alert alert-success mt-2 py-2";
    } else {
        msgEl.textContent = "Something went wrong.";
        msgEl.className = "alert alert-danger mt-2 py-2";
    }
});

document.addEventListener("DOMContentLoaded", loadProfile);
