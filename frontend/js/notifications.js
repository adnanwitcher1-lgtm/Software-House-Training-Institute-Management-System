const TYPE_STYLES = {
    fee_due: { bg: '#791F1F', text: '#F7C1C1', label: 'Fee Due' },
    enrollment: { bg: '#27500A', text: '#C0DD97', label: 'Enrollment' },
    attendance: { bg: '#633806', text: '#FAC775', label: 'Attendance' },
    enrollment_ending: { bg: '#3C3489', text: '#CECBF6', label: 'Ending Soon' },
    course: { bg: '#085041', text: '#9FE1CB', label: 'Course' },
    general: { bg: '#444441', text: '#D3D1C7', label: 'General' },
    system: { bg: '#444441', text: '#D3D1C7', label: 'System' },
};

async function loadNotificationsPage() {
    const res = await apiFetch("/notifications/");
    if (!res || !res.ok) return;
    const list = (await res.json()).results;

    const unread = list.filter(n => !n.is_read);

document.getElementById("notifList").innerHTML = unread.map(n => {
    const style = TYPE_STYLES[n.notif_type] || TYPE_STYLES.general;
    return `
        <div class="d-flex gap-3 align-items-start py-2 notif-row" style="border-bottom:1px solid var(--color-border);">
            <span style="background:${style.bg}; color:${style.text}; font-size:11px; font-weight:600; padding:3px 10px; border-radius:10px; white-space:nowrap; margin-top:2px;">${style.label}</span>
            <div class="flex-grow-1">
                <div class="fw-semibold" style="font-size:14px;">${n.title}</div>
                <div class="small" style="color:var(--color-muted);">${n.message}</div>
                <div class="small" style="color:var(--color-muted);">${new Date(n.created_at).toLocaleString()}</div>
            </div>
            <button class="btn btn-sm btn-outline-secondary" onclick="markRead(${n.id}, this)">Mark Read</button>
        </div>
    `;
}).join("") || `<p class="text-center py-4" style="color:var(--color-muted);">No notifications.</p>`;
}

async function markRead(id, btnEl) {
    await apiFetch(`/notifications/${id}/mark_read/`, { method: "PATCH" });
    const row = btnEl.closest(".notif-row");
    row.style.transition = "all 0.3s ease";
    row.style.transform = "translateX(30px)";
    row.style.opacity = "0";
    setTimeout(() => row.remove(), 300);
}

document.getElementById("checkAlertsBtn").addEventListener("click", async () => {
    const res = await apiFetch("/notifications/check-attendance-alerts/", { method: "POST" });
    if (res && res.ok) {
        const data = await res.json();
        alert(data.detail);
        loadNotificationsPage();
    }
});

document.addEventListener("DOMContentLoaded", async () => {
    const meRes = await apiFetch("/auth/me/");
    if (meRes && meRes.ok) {
        const user = await meRes.json();
        if (user.role === 'admin') document.getElementById("checkAlertsBtn").style.display = "inline-block";
    }
    loadNotificationsPage();
});