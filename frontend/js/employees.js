let currentUserRole = null;
let grantTargetId = null;
let coursesCache = [];

async function loadCoursesForDropdown() {
    const res = await apiFetch("/courses/");
    if (!res || !res.ok) return;
    coursesCache = (await res.json()).results;
    document.getElementById("assigned_course").innerHTML =
        `<option value="">None</option>` +
        coursesCache.map(c => `<option value="${c.id}">${c.name.replace(/_/g, ' ')}</option>`).join("");
}
async function loadEmployees() {
    const res = await apiFetch("/employees/");
    if (!res || !res.ok) return;
    const data = await res.json();

    const tbody = document.getElementById("employeesTableBody");
    tbody.innerHTML = data.results.map(e => `
        <tr>
            <td>${e.full_name}</td>
            <td>${e.designation}</td>
            <td>${e.department}</td>
            <td><span class="status-pill status-${e.status}">${e.status}</span></td>
            <td>${e.has_login ? '<span class="badge bg-success">Yes</span>' : '<span class="badge bg-secondary">No</span>'}</td>
            <td class="text-end admin-only ${currentUserRole !== 'admin' ? 'd-none' : ''}">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="openEditModal(${e.id})"><i class="bi bi-pencil"></i></button>
                ${e.has_login
                    ? `<button class="btn btn-sm btn-outline-warning" onclick="revokeLogin(${e.id})">Revoke Login</button>`
                    : `<button class="btn btn-sm btn-outline-success" onclick="openGrantModal(${e.id})">Grant Login</button>`}
            </td>
        </tr>
    `).join("") || `<tr><td colspan="6" class="text-center text-muted py-4">No employees found.</td></tr>`;
}

async function initRole() {
    const res = await apiFetch("/auth/me/");
    if (!res || !res.ok) return;
    const user = await res.json();
    currentUserRole = user.role;
    if (currentUserRole === 'admin') 
        {
    document.getElementById("addEmployeeBtn").classList.remove("d-none");
    document.getElementById("runPayrollBtn").classList.remove("d-none");
}
loadCoursesForDropdown();
}

function openAddModal() {
    document.getElementById("employeeModalTitle").textContent = "Add Employee";
    document.getElementById("employeeForm").reset();
    document.getElementById("employeeId").value = "";
    document.getElementById("formError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("employeeModal")).show();
}
document.getElementById("addEmployeeBtn").addEventListener("click", openAddModal);

async function openEditModal(id) {
    const res = await apiFetch(`/employees/${id}/`);
    if (!res || !res.ok) return;
    const e = await res.json();

    document.getElementById("employeeModalTitle").textContent = "Edit Employee";
    document.getElementById("employeeId").value = e.id;
    document.getElementById("full_name").value = e.full_name;
    document.getElementById("designation").value = e.designation;
    document.getElementById("department").value = e.department;
    document.getElementById("phone").value = e.phone;
    document.getElementById("cnic").value = e.cnic || "";
    document.getElementById("email").value = e.email;
    document.getElementById("address").value = e.address || "";
    document.getElementById("joining_date").value = e.joining_date;
    document.getElementById("salary").value = e.salary || "";
    document.getElementById("assigned_course").value = e.assigned_course || "";
    document.getElementById("formError").classList.add("d-none");

    new bootstrap.Modal(document.getElementById("employeeModal")).show();
}

document.getElementById("employeeForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("employeeId").value;
    const payload = {
        full_name: document.getElementById("full_name").value,
        designation: document.getElementById("designation").value,
        department: document.getElementById("department").value,
        phone: document.getElementById("phone").value,
        cnic: document.getElementById("cnic").value,
        email: document.getElementById("email").value,
        address: document.getElementById("address").value,
        joining_date: document.getElementById("joining_date").value,
        salary: document.getElementById("salary").value || null,
        assigned_course: document.getElementById("assigned_course").value || null,
    };
   
    const url = id ? `/employees/${id}/` : "/employees/";
    const method = id ? "PATCH" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("formError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById("employeeModal")).hide();
    loadEmployees();
});

function openGrantModal(id) {
    grantTargetId = id;
    document.getElementById("grantLoginForm").reset();
    document.getElementById("grantError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("grantLoginModal")).show();
}

document.getElementById("grantLoginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const payload = {
        username: document.getElementById("loginUsername").value,
        password: document.getElementById("loginPassword").value,
    };
    const res = await apiFetch(`/employees/${grantTargetId}/create-login/`, {
        method: "POST",
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
        const errorEl = document.getElementById("grantError");
        errorEl.textContent = data.detail || JSON.stringify(data);
        errorEl.classList.remove("d-none");
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById("grantLoginModal")).hide();
    loadEmployees();
});

async function revokeLogin(id) {
    if (!confirm("Revoke this employee's login access?")) return;
    const res = await apiFetch(`/employees/${id}/revoke-login/`, { method: "POST" });
    if (res && res.ok) loadEmployees();
}

document.addEventListener("DOMContentLoaded", async () => {
    await initRole();
    loadEmployees();
});

document.getElementById("runPayrollBtn")?.addEventListener("click", async () => {
    if (!confirm("Run this month's payroll? This will create salary expenses for all active employees with a set salary.")) return;
    const res = await apiFetch("/employees/run-payroll/", { method: "POST" });
    if (res && res.ok) {
        const data = await res.json();
        alert(data.detail);
    }
});