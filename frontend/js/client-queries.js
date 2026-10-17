let queriesCache = [];

const STATUS_LABELS = { pending: "Pending", start: "Start", completed: "Completed" };
const INDUSTRY_LABELS = {
    it: "IT", healthcare: "Healthcare", education: "Education", retail: "Retail",
    finance: "Finance", manufacturing: "Manufacturing", other: "Other",
};

async function loadEmployeesForDropdown() {
    const res = await apiFetch("/employees/");
    if (!res || !res.ok) return;
    const employees = (await res.json()).results;
    document.getElementById("q_assigned_employee").innerHTML =
        `<option value="">None</option>` +
        employees.map(e => `<option value="${e.id}">${e.full_name}</option>`).join("");
}

async function loadQueries() {
    const res = await apiFetch("/client-queries/");
    if (!res || !res.ok) return;
    queriesCache = (await res.json()).results;

    document.getElementById("queriesTableBody").innerHTML = queriesCache.map(q => `
        <tr>
            <td>${q.name}</td>
            <td>${q.email || '-'}</td>
            <td>${q.phone || '-'}</td>
            <td>${q.project_name || '-'}</td>
            <td>${q.amount ? 'Rs. ' + q.amount : '-'}</td>
            <td>${STATUS_LABELS[q.project_status] || q.project_status}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="viewQuery(${q.id})"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editQuery(${q.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteQuery(${q.id}, '${(q.name || '').replace(/'/g, "\\'")}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="7" class="text-center py-4" style="color:var(--color-muted);">No client queries yet.</td></tr>`;
}

document.getElementById("toggleAddQueryBtn").addEventListener("click", () => {
    resetQueryForm();
    const section = document.getElementById("queryFormSection");
    section.style.display = section.style.display === "none" ? "block" : "none";
});

document.getElementById("cancelQueryFormBtn").addEventListener("click", () => {
    document.getElementById("queryFormSection").style.display = "none";
});

function resetQueryForm() {
    document.getElementById("queryForm").reset();
    document.getElementById("queryId").value = "";
    document.getElementById("queryFormTitle").textContent = "New Client Query";
    document.getElementById("queryError").classList.add("d-none");
}

function viewQuery(id) {
    const q = queriesCache.find(r => r.id === id);
    if (!q) return;

    document.getElementById("v_name").textContent = q.name;
    document.getElementById("v_email").textContent = q.email || "-";
    document.getElementById("v_phone").textContent = q.phone || "-";
    document.getElementById("v_industry").textContent = INDUSTRY_LABELS[q.industry] || "-";
    document.getElementById("v_amount").textContent = q.amount ? `Rs. ${q.amount}` : "-";
    document.getElementById("v_deal_amount").textContent = q.deal_amount ? `Rs. ${q.deal_amount}` : "-";
    document.getElementById("v_project_name").textContent = q.project_name || "-";
    document.getElementById("v_project_due_date").textContent = q.project_due_date || "-";
    document.getElementById("v_assigned_employee").textContent = q.assigned_employee_name || "-";
    document.getElementById("v_project_status").textContent = STATUS_LABELS[q.project_status] || "-";
    document.getElementById("v_project_requirements").textContent = q.project_requirements || "-";

    new bootstrap.Modal(document.getElementById("viewQueryModal")).show();
}

function editQuery(id) {
    const q = queriesCache.find(r => r.id === id);
    if (!q) return;

    document.getElementById("queryFormTitle").textContent = "Edit Client Query";
    document.getElementById("queryId").value = q.id;
    document.getElementById("q_name").value = q.name || "";
    document.getElementById("q_amount").value = q.amount || "";
    document.getElementById("q_email").value = q.email || "";
    document.getElementById("q_phone").value = q.phone || "";
    document.getElementById("q_industry").value = q.industry || "";
    document.getElementById("q_project_name").value = q.project_name || "";
    document.getElementById("q_project_due_date").value = q.project_due_date || "";
    document.getElementById("q_project_requirements").value = q.project_requirements || "";
    document.getElementById("q_deal_amount").value = q.deal_amount || "";
    document.getElementById("q_assigned_employee").value = q.assigned_employee || "";
    document.getElementById("q_project_status").value = q.project_status || "pending";
    document.getElementById("queryError").classList.add("d-none");

    document.getElementById("queryFormSection").style.display = "block";
}

document.getElementById("queryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("queryId").value;
    const payload = {
        name: document.getElementById("q_name").value,
        amount: document.getElementById("q_amount").value || null,
        email: document.getElementById("q_email").value,
        phone: document.getElementById("q_phone").value,
        industry: document.getElementById("q_industry").value,
        project_name: document.getElementById("q_project_name").value,
        project_due_date: document.getElementById("q_project_due_date").value || null,
        project_requirements: document.getElementById("q_project_requirements").value,
        deal_amount: document.getElementById("q_deal_amount").value || null,
        assigned_employee: document.getElementById("q_assigned_employee").value || null,
        project_status: document.getElementById("q_project_status").value,
    };

    const url = id ? `/client-queries/${id}/` : "/client-queries/";
    const method = id ? "PATCH" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("queryError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }

    document.getElementById("queryFormSection").style.display = "none";
    loadQueries();
});

async function deleteQuery(id, name) {
    if (!confirm(`Delete client query ${name}? This cannot be undone.`)) return;
    const res = await apiFetch(`/client-queries/${id}/`, { method: "DELETE" });
    if (res && res.ok) loadQueries();
}

document.addEventListener("DOMContentLoaded", () => {
    loadQueries();
    loadEmployeesForDropdown();
});
