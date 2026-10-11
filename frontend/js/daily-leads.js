let leadsCache = [];

async function loadLeads() {
    const res = await apiFetch("/daily-leads/");
    if (!res || !res.ok) return;
    leadsCache = (await res.json()).results;

    document.getElementById("leadsTableBody").innerHTML = leadsCache.map(l => `
        <tr>
            <td>${l.full_name}</td>
            <td>${l.company_name}</td>
            <td>${l.phone}</td>
            <td>${l.interested_in}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editLead(${l.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteLead(${l.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="5" class="text-center py-4" style="color:var(--color-muted);">No leads yet.</td></tr>`;
}

function openAddModal() {
    document.getElementById("leadModalTitle").textContent = "Request a Consultation";
    document.getElementById("leadForm").reset();
    document.getElementById("leadId").value = "";
    document.getElementById("leadError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("leadModal")).show();
}

function editLead(id) {
    const l = leadsCache.find(x => x.id === id);
    if (!l) return;
    document.getElementById("leadModalTitle").textContent = "Edit Lead";
    document.getElementById("leadId").value = l.id;
    document.getElementById("l_full_name").value = l.full_name;
    document.getElementById("l_work_email").value = l.work_email;
    document.getElementById("l_company_name").value = l.company_name;
    document.getElementById("l_job_title").value = l.job_title;
    document.getElementById("l_phone").value = l.phone;
    document.getElementById("l_estimated_budget").value = l.estimated_budget;
    document.getElementById("l_interested_in").value = l.interested_in;
    document.getElementById("leadError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("leadModal")).show();
}

document.getElementById("leadForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("leadId").value;
    const payload = {
        full_name: document.getElementById("l_full_name").value,
        work_email: document.getElementById("l_work_email").value,
        company_name: document.getElementById("l_company_name").value,
        job_title: document.getElementById("l_job_title").value,
        phone: document.getElementById("l_phone").value,
        estimated_budget: document.getElementById("l_estimated_budget").value,
        interested_in: document.getElementById("l_interested_in").value,
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

document.addEventListener("DOMContentLoaded", loadLeads);