let employeesCache = [];

async function loadEmployeesForDropdown() {
    const res = await apiFetch("/employees/");
    if (!res || !res.ok) return;
    employeesCache = (await res.json()).results;
    document.getElementById("c_assigned_employee").innerHTML =
        `<option value="">None</option>` +
        employeesCache.map(e => `<option value="${e.id}">${e.full_name}</option>`).join("");
}

let clientsCache = [];

async function loadClients() {
    const res = await apiFetch("/clients/");
    if (!res || !res.ok) return;
    clientsCache = (await res.json()).results;

    document.getElementById("clientsTableBody").innerHTML = clientsCache.map(c => `
        <tr>
            <td>${c.name}</td>
            <td>${c.email}</td>
            <td>${c.phone}</td>
            <td>${c.project_name || '-'}</td>
            <td>Rs. ${c.paid_amount}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-success me-1" onclick="openClientPayment(${c.id})"><i class="bi bi-cash-coin"></i></button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="viewClient(${c.id})"><i class="bi bi-eye"></i></button>
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editClient(${c.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteClient(${c.id}, '${c.name}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="6" class="text-center py-4" style="color:var(--color-muted);">No clients found.</td></tr>`;
}

document.getElementById("toggleAddClientBtn").addEventListener("click", () => {
    resetClientForm();
    const section = document.getElementById("clientFormSection");
    section.style.display = section.style.display === "none" ? "block" : "none";
});

document.getElementById("cancelClientFormBtn").addEventListener("click", () => {
    document.getElementById("clientFormSection").style.display = "none";
});

function resetClientForm() {
    document.getElementById("clientForm").reset();
    document.getElementById("clientId").value = "";
    document.getElementById("clientFormTitle").textContent = "Add New Client";
    document.getElementById("clientFormError").classList.add("d-none");
}

function viewClient(id) {
    const c = clientsCache.find(cl => cl.id === id);
    if (!c) return;

    document.getElementById("v_name").textContent = c.name;
    document.getElementById("v_contact_person").textContent = c.contact_person || "-";
    document.getElementById("v_email").textContent = c.email;
    document.getElementById("v_phone").textContent = c.phone;
    document.getElementById("v_paid_amount").textContent = `Rs. ${c.paid_amount}`;
    document.getElementById("v_deal_amount").textContent = c.deal_amount ? `Rs. ${c.deal_amount}` : "-";
    document.getElementById("v_industry").textContent = c.industry || "-";
    document.getElementById("v_business_type").textContent = c.business_type || "-";
    document.getElementById("v_project_name").textContent = c.project_name || "-";
    document.getElementById("v_project_due_date").textContent = c.project_due_date || "-";
    document.getElementById("v_project_requirements").textContent = c.project_requirements || "-";

    new bootstrap.Modal(document.getElementById("viewClientModal")).show();
}

function editClient(id) {
    const c = clientsCache.find(cl => cl.id === id);
    if (!c) return;

    document.getElementById("clientFormTitle").textContent = "Edit Client";
    document.getElementById("clientId").value = c.id;
    document.getElementById("c_name").value = c.name;
    document.getElementById("c_email").value = c.email;
    document.getElementById("c_phone").value = c.phone;
    document.getElementById("c_industry").value = c.industry || "";
    document.getElementById("c_business_type").value = c.business_type || "";
    document.getElementById("c_project_name").value = c.project_name || "";
    document.getElementById("c_project_due_date").value = c.project_due_date || "";
    document.getElementById("c_project_requirements").value = c.project_requirements || "";
    document.getElementById("c_amount_paid").value = "";
    document.getElementById("c_deal_amount").value = c.deal_amount || "";
    document.getElementById("c_assigned_employee").value = c.assigned_employee || "";
    document.getElementById("c_project_status").value = c.project_status || "pending";
    document.getElementById("clientFormError").classList.add("d-none");

    document.getElementById("clientFormSection").style.display = "block";
}

document.getElementById("clientForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("clientId").value;
    const payload = {
        name: document.getElementById("c_name").value,
        email: document.getElementById("c_email").value,
        phone: document.getElementById("c_phone").value,
        industry: document.getElementById("c_industry").value,
        business_type: document.getElementById("c_business_type").value,
        project_name: document.getElementById("c_project_name").value,
        project_due_date: document.getElementById("c_project_due_date").value || null,
        project_requirements: document.getElementById("c_project_requirements").value,
        deal_amount: document.getElementById("c_deal_amount").value || null,
        assigned_employee: document.getElementById("c_assigned_employee").value || null,
        project_status: document.getElementById("c_project_status").value,
    };

    const url = id ? `/clients/${id}/` : "/clients/";
    const method = id ? "PATCH" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("clientFormError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }

    const amountPaid = parseFloat(document.getElementById("c_amount_paid").value) || 0;
    if (amountPaid > 0 && !id) {
        await apiFetch("/clients/payments/", {
            method: "POST",
            body: JSON.stringify({
                client: data.id,
                amount_paid: amountPaid,
                payment_method: "bank",
                notes: "Initial payment on client creation",
            }),
        });
    }

    document.getElementById("clientFormSection").style.display = "none";
    loadClients();
});

async function deleteClient(id, name) {
    if (!confirm(`Delete client ${name}? This cannot be undone.`)) return;
    const res = await apiFetch(`/clients/${id}/`, { method: "DELETE" });
    if (res && res.ok) loadClients();
}

async function openClientPayment(clientId) {
    document.getElementById("paymentClientId").value = clientId;
    document.getElementById("clientPaymentForm").reset();
    document.getElementById("clientPaymentError").classList.add("d-none");
    await refreshClientPaymentModal(clientId);
    new bootstrap.Modal(document.getElementById("clientPaymentModal")).show();
}

async function refreshClientPaymentModal(clientId) {
    const clientRes = await apiFetch(`/clients/${clientId}/`);
    const client = await clientRes.json();
    document.getElementById("paymentModalTitle").textContent = `${client.name} - Payments`;
    document.getElementById("clientTotalPaid").textContent = `Rs. ${client.paid_amount}`;

    const historyRes = await apiFetch(`/clients/payments/?client=${clientId}`);
    const history = historyRes && historyRes.ok ? (await historyRes.json()).results : [];

    document.getElementById("clientPaymentHistoryBody").innerHTML = history.map(p => `
        <tr>
            <td>${p.payment_date}</td>
            <td>Rs. ${p.amount_paid}</td>
            <td>${p.payment_method}</td>
            <td>${p.notes || '-'}</td>
        </tr>
    `).join("") || `<tr><td colspan="4" class="text-center" style="color:var(--color-muted);">No payments yet.</td></tr>`;
}

document.getElementById("clientPaymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const clientId = document.getElementById("paymentClientId").value;
    const payload = {
        client: parseInt(clientId),
        amount_paid: document.getElementById("cp_amount").value,
        payment_method: document.getElementById("cp_method").value,
        notes: document.getElementById("cp_notes").value,
    };
    const res = await apiFetch("/clients/payments/", { method: "POST", body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("clientPaymentError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }
    document.getElementById("clientPaymentForm").reset();
    await refreshClientPaymentModal(clientId);
    loadClients();
});
document.addEventListener("DOMContentLoaded", () => {
    loadClients();
    loadEmployeesForDropdown();
});