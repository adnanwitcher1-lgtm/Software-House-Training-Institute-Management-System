let leadsCache = [];
let coursesCache = [];

async function loadCourses() {
    const res = await apiFetch("/courses/");
    coursesCache = res && res.ok ? (await res.json()).results : [];
    document.getElementById("l_course").innerHTML =
        `<option value="">Select Course</option>` +
        coursesCache.map(c => `<option value="${c.id}">${c.name.replace(/_/g, ' ')}</option>`).join("");
}

async function loadLeads() {
    const res = await apiFetch("/daily-leads/");
    if (!res || !res.ok) return;
    leadsCache = (await res.json()).results;

    document.getElementById("leadsTableBody").innerHTML = leadsCache.map(x => `
        <tr>
            <td>${x.full_name}</td>
            <td>${x.guardian_name || '-'}</td>
            <td>${x.phone || '-'}</td>
            <td>${x.course_name ? x.course_name.replace(/_/g, ' ') : '-'}</td>
            <td>${x.reference || '-'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editLead(${x.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteLead(${x.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="6" class="text-center py-4" style="color:var(--color-muted);">No leads yet.</td></tr>`;
}

function openAddModal() {
    document.getElementById("leadModalTitle").textContent = "New Lead";
    document.getElementById("leadForm").reset();
    document.getElementById("leadId").value = "";
    document.getElementById("leadError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("leadModal")).show();
}

function editLead(id) {
    const x = leadsCache.find(r => r.id === id);
    if (!x) return;
    document.getElementById("leadModalTitle").textContent = "Edit Lead";
    document.getElementById("leadId").value = x.id;
    document.getElementById("l_full_name").value = x.full_name || "";
    document.getElementById("l_guardian_name").value = x.guardian_name || "";
    document.getElementById("l_phone").value = x.phone || "";
    document.getElementById("l_guardian_phone").value = x.guardian_phone || "";
    document.getElementById("l_gender").value = x.gender || "";
    document.getElementById("l_address").value = x.address || "";
    document.getElementById("l_course").value = x.course || "";
    document.getElementById("l_reference").value = x.reference || "";
    document.getElementById("leadError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("leadModal")).show();
}

document.getElementById("leadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("leadId").value;
    const payload = {
        full_name: document.getElementById("l_full_name").value,
        guardian_name: document.getElementById("l_guardian_name").value,
        phone: document.getElementById("l_phone").value,
        guardian_phone: document.getElementById("l_guardian_phone").value,
        gender: document.getElementById("l_gender").value,
        address: document.getElementById("l_address").value,
        course: document.getElementById("l_course").value || null,
        reference: document.getElementById("l_reference").value,
    };
    const url = id ? `/daily-leads/${id}/` : "/daily-leads/";
    const method = id ? "PATCH" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("leadError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById("leadModal")).hide();
    loadLeads();
});

async function deleteLead(id) {
    if (!confirm("Delete this lead?")) return;
    const res = await apiFetch(`/daily-leads/${id}/`, { method: "DELETE" });
    if (res && res.ok) loadLeads();
}

document.addEventListener("DOMContentLoaded", async () => {
    await loadCourses();
    loadLeads();
});
