let queriesCache = [];
let coursesCache = [];

async function loadCourses() {
    const res = await apiFetch("/courses/");
    coursesCache = res && res.ok ? (await res.json()).results : [];
    document.getElementById("q_course").innerHTML =
        `<option value="">Select Course</option>` +
        coursesCache.map(c => `<option value="${c.id}">${c.name.replace(/_/g, ' ')}</option>`).join("");
}

async function loadQueries() {
    const res = await apiFetch("/daily-queries/");
    if (!res || !res.ok) return;
    queriesCache = (await res.json()).results;

    document.getElementById("queriesTableBody").innerHTML = queriesCache.map(x => `
        <tr>
            <td>${x.full_name}</td>
            <td>${x.guardian_name || '-'}</td>
            <td>${x.phone || '-'}</td>
            <td>${x.course_name ? x.course_name.replace(/_/g, ' ') : '-'}</td>
            <td>${x.reference || '-'}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editQuery(${x.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteQuery(${x.id})"><i class="bi bi-trash"></i></button>
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
    const x = queriesCache.find(r => r.id === id);
    if (!x) return;
    document.getElementById("queryModalTitle").textContent = "Edit Query";
    document.getElementById("queryId").value = x.id;
    document.getElementById("q_full_name").value = x.full_name || "";
    document.getElementById("q_guardian_name").value = x.guardian_name || "";
    document.getElementById("q_phone").value = x.phone || "";
    document.getElementById("q_guardian_phone").value = x.guardian_phone || "";
    document.getElementById("q_gender").value = x.gender || "";
    document.getElementById("q_address").value = x.address || "";
    document.getElementById("q_course").value = x.course || "";
    document.getElementById("q_reference").value = x.reference || "";
    document.getElementById("queryError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("queryModal")).show();
}

document.getElementById("queryForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("queryId").value;
    const payload = {
        full_name: document.getElementById("q_full_name").value,
        guardian_name: document.getElementById("q_guardian_name").value,
        phone: document.getElementById("q_phone").value,
        guardian_phone: document.getElementById("q_guardian_phone").value,
        gender: document.getElementById("q_gender").value,
        address: document.getElementById("q_address").value,
        course: document.getElementById("q_course").value || null,
        reference: document.getElementById("q_reference").value,
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

document.addEventListener("DOMContentLoaded", async () => {
    await loadCourses();
    loadQueries();
});
