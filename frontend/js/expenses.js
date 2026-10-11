let expensesCache = [];

async function loadExpenses() {
    const res = await apiFetch("/expenses/");
    if (!res || !res.ok) return;
    expensesCache = (await res.json()).results;

    document.getElementById("expensesTableBody").innerHTML = expensesCache.map(ex => `
        <tr>
            <td>${ex.title}</td>
            <td>Rs. ${ex.amount}</td>
            <td>${ex.date}</td>
            <td>${ex.category}</td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary me-1" onclick="editExpense(${ex.id})"><i class="bi bi-pencil"></i></button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteExpense(${ex.id})"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="5" class="text-center py-4" style="color:var(--color-muted);">No expenses yet.</td></tr>`;
}

function openAddModal() {
    document.getElementById("expenseModalTitle").textContent = "Software House Expense Entry Form";
    document.getElementById("expenseForm").reset();
    document.getElementById("expenseId").value = "";
    document.getElementById("expenseError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("expenseModal")).show();
}

function editExpense(id) {
    const ex = expensesCache.find(x => x.id === id);
    if (!ex) return;
    document.getElementById("expenseModalTitle").textContent = "Edit Expense";
    document.getElementById("expenseId").value = ex.id;
    document.getElementById("e_title").value = ex.title;
    document.getElementById("e_amount").value = ex.amount;
    document.getElementById("e_date").value = ex.date;
    document.getElementById("e_category").value = ex.category;
    document.getElementById("e_description").value = ex.description;
    document.getElementById("expenseError").classList.add("d-none");
    new bootstrap.Modal(document.getElementById("expenseModal")).show();
}

document.getElementById("expenseForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const id = document.getElementById("expenseId").value;
    const payload = {
        title: document.getElementById("e_title").value,
        amount: document.getElementById("e_amount").value,
        date: document.getElementById("e_date").value,
        category: document.getElementById("e_category").value,
        description: document.getElementById("e_description").value,
    };
    const url = id ? `/expenses/${id}/` : "/expenses/";
    const method = id ? "PATCH" : "POST";
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("expenseError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById("expenseModal")).hide();
    loadExpenses();
});

async function deleteExpense(id) {
    if (!confirm("Delete this expense?")) return;
    const res = await apiFetch(`/expenses/${id}/`, { method: "DELETE" });
    if (res && res.ok) loadExpenses();
}

document.addEventListener("DOMContentLoaded", loadExpenses);