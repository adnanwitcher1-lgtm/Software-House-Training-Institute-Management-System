let queriesCache = [];

async function loadQueries() {
    const res = await apiFetch("/daily-queries/");
    if (!res || !res.ok) return;
    queriesCache = (await res.json()).results;

    document.getElementById("queriesTableBody").innerHTML = queriesCache.map(q => `
        <tr>
            <td>${q.full_name}</td>
            <td>${q.email}</td>
            <td>${q.phone || '-'}</td>
            <td>${q.category}</td>
            <td><span class="status-pill status-${q.status === 'responded' ? 'active' : 'inactive'}">${q.status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editQuery(${q.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteQuery(${q.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="6" class="text-center py-4" style="color:var(--color-muted);">No queries yet.</td></tr>`;
}

function openAddModal() {
    document.getElementById("queryModalTitle").textContent = "New Query";
    document.getElementById("queryForm").reset();
    document.getElementById("queryId").value = "";
    document.getElementById("queryError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("queryModal")).show();
}

function editQuery(id) {
    const q = queriesCache.find(x => x.id === id);
    if (!q) return;
    document.getElementById("queryModalTitle").textContent = "Edit Query";
    document.getElementById("queryId").value = q.id;
    document.getElementById("q_full_name").value = q.full_name;
    document.getElementById("q_email").value = q.email;
    document.getElementById("q_phone").value = q.phone || "";
    document.getElementById("q_message").value = q.message;
    document.getElementById("q_category").value = q.category;
    document.getElementById("q_status").value = q.status;
    document.getElementById("queryError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("queryModal")).show();
}

document.getElementById("queryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("queryId").value;
    const payload = {
        full_name: document.getElementById("q_full_name").value,
        email: document.getElementById("q_email").value,
        phone: document.getElementById("q_phone").value,
        message: document.getElementById("q_message").value,
        category: document.getElementById("q_category").value,
        status: document.getElementById("q_status").value,
    };
    const url = id ? `/daily-queries/${id}/` : "/daily-queries/";
    const method = id ? "PATCH" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("queryError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById("queryModal")).hide();
    loadQueries();
});

async function deleteQuery(id) {
    if (!confirm("Delete this query?")) return;
    const res = await apiFetch(`/daily-queries/${id}/`, { method: "DELETE" });
    if (res && res.ok) loadQueries();
}

document.addEventListener("DOMContentLoaded", loadQueries);
