const SIDEBAR_ITEMS = [
    { label: "Dashboard", page: "dashboard.html", icon: "speedometer2", roles: ["admin", "receptionist", "employee"] },
    { label: "My Profile", page: "my-profile.html", icon: "person-circle", roles: ["employee"] },
    { label: "My Profile", page: "admin-profile.html", icon: "person-circle", roles: ["admin", "receptionist"] },
    { label: "Enrollments", page: "enrollments.html", icon: "journal-check", roles: ["admin", "receptionist"] },
    { label: "Attendance", page: "attendance.html", icon: "calendar-check", roles: ["admin", "receptionist", "employee"] },
    { label: "Employee Attendance", page: "employee-attendance.html", icon: "person-check", roles: ["admin", "receptionist"] },
    { label: "Fees & Payments", page: "fees.html", icon: "cash-coin", roles: ["admin", "receptionist"] },
    { label: "Client Queries", page: "client-queries.html", icon: "chat-dots", roles: ["admin", "receptionist"] },
    { label: "Daily Leads", page: "daily-leads.html", icon: "briefcase", roles: ["admin", "receptionist"] },
    { label: "Expenses", page: "expenses.html", icon: "receipt", roles: ["admin", "receptionist"] },
    { label: "Clients", page: "clients.html", icon: "people", roles: ["admin", "receptionist"] },
    { label: "Employees", page: "employees.html", icon: "person-badge", roles: ["admin", "receptionist"] },
    { label: "Notifications", page: "notifications.html", icon: "bell", roles: ["admin", "receptionist", "employee"] },
    { label: "Announcements", page: "announcements.html", icon: "megaphone", roles: ["admin", "receptionist", "employee"] },
];

function buildAvatarHtml(user) {
    return user.profile_picture
        ? `<img src="${user.profile_picture}" class="navbar-avatar" alt="avatar">`
        : `<div class="navbar-avatar-placeholder">${user.username.charAt(0).toUpperCase()}</div>`;
}

async function renderSidebarAndNavbar() {
    requireAuth();

    let user = JSON.parse(sessionStorage.getItem("cached_user") || "null");

    if (!user) {
        const res = await apiFetch("/auth/me/");
        if (!res || !res.ok) return;
        user = await res.json();
        sessionStorage.setItem("cached_user", JSON.stringify(user));
    }

    const currentPage = window.location.pathname.split("/").pop();
    const visibleItems = SIDEBAR_ITEMS.filter(item => item.roles.includes(user.role));

    document.getElementById("sidebar-container").innerHTML = `
        <div class="sidebar-brand d-flex align-items-center gap-2">
            <img src="images/logo.png" alt="Logo" style="height:28px; width:28px; object-fit:cover; border-radius:50%;">
            Institute MS
        </div>
        ${visibleItems.map(item => `
            <a href="${item.page}" class="sidebar-link ${item.page === currentPage ? 'active' : ''}">
                <i class="bi bi-${item.icon}"></i>${item.label}
            </a>
        `).join("")}
    `;

    document.getElementById("navbar-container").innerHTML = `
    <nav class="navbar px-4 py-3 d-flex justify-content-between">
        <span class="fw-semibold" style="font-family:'Sora',sans-serif;">Institute MS</span>
        <div class="d-flex align-items-center gap-3">
            <div class="position-relative">
                <button id="bellBtn" class="btn btn-sm btn-outline-secondary position-relative">
                    <i class="bi bi-bell"></i>
                    <span id="bellBadge" class="badge bg-danger position-absolute top-0 start-100 translate-middle rounded-pill" style="display:none; font-size:10px;">0</span>
                </button>
                <div id="bellDropdown" class="surface-card position-absolute end-0 mt-2" style="width:min(320px, 92vw); box-sizing:border-box; display:none; z-index:1000; max-height:400px; overflow-y:auto; overflow-x:hidden;"></div>
            </div>
            <div class="d-flex align-items-center gap-2">
                <span id="navbarAvatarHolder" class="d-flex">${buildAvatarHtml(user)}</span>
                <span>${user.username} <span class="badge role-badge ms-1">${user.role}</span></span>
            </div>
            <button id="logoutBtn" class="btn btn-sm btn-outline-secondary">Logout</button>
        </div>
    </nav>
`;

    initBellDropdown();
    refreshNavbarAvatar();

    document.getElementById("logoutBtn").addEventListener("click", async () => {
        await fetch(`${API_BASE_URL}/auth/logout/`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh: getRefreshToken() }),
        });
        clearTokens();
        sessionStorage.removeItem("cached_user");
        window.location.href = "login.html";
    });
}

document.addEventListener("DOMContentLoaded", renderSidebarAndNavbar);

async function refreshNavbarAvatar() {
    const res = await apiFetch("/auth/me/");
    if (!res || !res.ok) return;
    const fresh = await res.json();
    const cached = JSON.parse(sessionStorage.getItem("cached_user") || "{}");
    if (cached.profile_picture === fresh.profile_picture) return;

    sessionStorage.setItem("cached_user", JSON.stringify(fresh));
    const holder = document.getElementById("navbarAvatarHolder");
    if (holder) holder.innerHTML = buildAvatarHtml(fresh);
}

async function initBellDropdown() {
    async function refreshBell() {
        const countRes = await apiFetch("/notifications/unread_count/");
        if (countRes && countRes.ok) {
            const data = await countRes.json();
            const badge = document.getElementById("bellBadge");
            if (data.unread_count > 0) {
                badge.textContent = data.unread_count;
                badge.style.display = "inline-block";
            } else {
                badge.style.display = "none";
            }
        }
    }

    document.getElementById("bellBtn").addEventListener("click", async () => {
        const dropdown = document.getElementById("bellDropdown");
        if (dropdown.style.display === "block") {
            dropdown.style.display = "none";
            return;
        }

        const res = await apiFetch("/notifications/");
        if (!res || !res.ok) return;
        const list = (await res.json()).results.filter(n => !n.is_read).slice(0, 5);

        dropdown.innerHTML = list.map(n => `
            <div class="py-2" style="border-bottom:1px solid var(--color-border); position:relative; padding-right:26px;" data-id="${n.id}">
                <div style="overflow-wrap:break-word; word-break:break-word;">
                    <div class="small fw-semibold">${n.title}</div>
                    <div class="small" style="color:var(--color-muted);">${n.message}</div>
                    <div class="small" style="color:var(--color-muted); font-size:11px;">${new Date(n.created_at).toLocaleString()}</div>
                </div>
                <button class="btn btn-sm p-0 border-0" style="position:absolute; top:8px; right:0; color:var(--color-muted);" onclick="dismissBellNotif(${n.id}, this)"><i class="bi bi-x-lg"></i></button>
            </div>
        `).join("") || `<p class="text-center small py-3" style="color:var(--color-muted);">No notifications.</p>`;

        dropdown.innerHTML += `<div class="text-center pt-2"><a href="notifications.html" class="small">View all notifications</a></div>`;
        dropdown.style.display = "block";
    });

    document.addEventListener("click", (e) => {
        const dropdown = document.getElementById("bellDropdown");
        const btn = document.getElementById("bellBtn");
        if (dropdown && !dropdown.contains(e.target) && !btn.contains(e.target)) {
            dropdown.style.display = "none";
        }
    });

    refreshBell();
    setInterval(refreshBell, 30000);
}

window.dismissBellNotif = async function (id, btnEl) {
    const row = btnEl.closest("[data-id]");
    row.style.transition = "all 0.3s ease";
    row.style.transform = "translateX(20px)";
    row.style.opacity = "0";
    await apiFetch(`/notifications/${id}/mark_read/`, { method: "PATCH" });
    setTimeout(() => {
        row.remove();
        const dropdown = document.getElementById("bellDropdown");
        if (!dropdown.querySelector("[data-id]")) {
            dropdown.innerHTML = `<p class="text-center small py-3" style="color:var(--color-muted);">No notifications.</p><div class="text-center pt-2"><a href="notifications.html" class="small">View all notifications</a></div>`;
        }
        apiFetch("/notifications/unread_count/").then(async r => {
            if (r && r.ok) {
                const data = await r.json();
                const badge = document.getElementById("bellBadge");
                if (data.unread_count > 0) {
                    badge.textContent = data.unread_count;
                    badge.style.display = "inline-block";
                } else {
                    badge.style.display = "none";
                }
            }
        });
    }, 300);
};


(function setFavicon() {
    const link = document.createElement("link");
    link.rel = "icon";
    link.type = "image/png";
    link.href = "images/favicon.png";
    document.head.appendChild(link);
})();
