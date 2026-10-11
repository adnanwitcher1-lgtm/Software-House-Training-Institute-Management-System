let currentUserRole = null;
let announcementsCache = [];

async function loadAnnouncements() {
    const res = await apiFetch("/announcements/");
    if (!res || !res.ok) return;
    announcementsCache = (await res.json()).results;

    document.getElementById("announcementsList").innerHTML = announcementsCache.map(a => `
        <div class="surface-card mb-3" style="background:var(--color-surface-alt);">
            <div class="d-flex justify-content-between align-items-start mb-1">
                <h6 class="mb-0">${a.title}</h6>
                <div class="d-flex align-items-center gap-2">
                    ${currentUserRole === 'admin' ? `<span class="status-pill status-${a.status === 'published' ? 'active' : 'inactive'}">${a.status}</span>` : ''}
                    ${currentUserRole === 'admin' ? `
                        <button class="btn btn-sm btn-outline-secondary" onclick="editAnnouncement(${a.id})"><i class="bi bi-pencil"></i></button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAnnouncement(${a.id})"><i class="bi bi-trash"></i></button>
                    ` : ''}
                </div>
            </div>
            <p class="mb-1" style="font-size:14px;">${a.content}</p>
            <div class="small" style="color:var(--color-muted);">${new Date(a.created_at).toLocaleString()}</div>
        </div>
    `).join("") || `<p class="text-center py-4" style="color:var(--color-muted);">No announcements yet.</p>`;
}

function openAddModal() {
    document.getElementById("announcementModalTitle").textContent = "New Announcement";
    document.getElementById("announcementForm").reset();
    document.getElementById("announcementId").value = "";
    document.getElementById("announcementError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("announcementModal")).show();
}

function editAnnouncement(id) {
    const a = announcementsCache.find(x => x.id === id);
    if (!a) return;
    document.getElementById("announcementModalTitle").textContent = "Edit Announcement";
    document.getElementById("announcementId").value = a.id;
    document.getElementById("a_title").value = a.title;
    document.getElementById("a_content").value = a.content;
    document.getElementById("a_status").value = a.status;
    document.getElementById("announcementError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("announcementModal")).show();
}

document.getElementById("announcementForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("announcementId").value;
    const payload = {
        title: document.getElementById("a_title").value,
        content: document.getElementById("a_content").value,
        status: document.getElementById("a_status").value,
    };
    const url = id ? `/announcements/${id}/` : "/announcements/";
    const method = id ? "PATCH" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("announcementError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById("announcementModal")).hide();
    loadAnnouncements();
});

async function deleteAnnouncement(id) {
    if (!confirm("Delete this announcement?")) return;
    const res = await apiFetch(`/announcements/${id}/`, { method: "DELETE" });
    if (res && res.ok) loadAnnouncements();
}

document.addEventListener("DOMContentLoaded", async () => {
    const meRes = await apiFetch("/auth/me/");
    if (meRes && meRes.ok) {
        const user = await meRes.json();
        currentUserRole = user.role;
        if (currentUserRole === 'admin') {
            document.getElementById("addAnnouncementBtn").style.display = "inline-block";
        }
    }
    loadAnnouncements();
});