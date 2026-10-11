let allFees = [];

async function loadFees() {
    const res = await apiFetch("/fees/");
    if (!res || !res.ok) return;
    allFees = (await res.json()).results;
    renderFees();
}

function renderFees() {
    const search = document.getElementById("searchInput").value.toLowerCase();
    const statusFilter = document.getElementById("statusFilter").value;

    const filtered = allFees.filter(f => {
        const matchesSearch = !search ||
            f.student_name.toLowerCase().includes(search) ||
            f.course_name.toLowerCase().includes(search);
        const matchesStatus = !statusFilter || f.status === statusFilter;
        return matchesSearch && matchesStatus;
    });

    document.getElementById("feesTableBody").innerHTML = filtered.map(f => `
        <tr>
            <td>${f.student_name}</td>
            <td>${f.course_name.replace(/_/g, ' ')}</td>
            <td>Rs. ${f.total_fee}</td>
            <td>Rs. ${f.paid_amount}</td>
            <td>Rs. ${f.remaining_amount}</td>
            <td><span class="status-pill status-${f.status === 'paid' ? 'active' : f.status === 'unpaid' ? 'inactive' : ''}" style="${f.status === 'partial' ? 'background:#FFF3E0;color:#B36B00;' : ''}">${f.status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary" onclick="openFeeDetail(${f.id})">View / Pay</button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="7" class="text-center text-muted py-4">No fee records found.</td></tr>`;
}

document.getElementById("searchInput").addEventListener("input", renderFees);
document.getElementById("statusFilter").addEventListener("change", renderFees);

async function openFeeDetail(feeId) {
    const res = await apiFetch(`/fees/${feeId}/`);
    if (!res || !res.ok) return;
    const f = await res.json();

    document.getElementById("feeDetailTitle").textContent = `${f.student_name} — ${f.course_name.replace(/_/g, ' ')}`;
    document.getElementById("detailTotal").textContent = `Rs. ${f.total_fee}`;
    document.getElementById("detailPaid").textContent = `Rs. ${f.paid_amount}`;
    document.getElementById("detailRemaining").textContent = `Rs. ${f.remaining_amount}`;
    document.getElementById("paymentFeeId").value = f.id;
    document.getElementById("paymentForm").reset();
    document.getElementById("paymentFeeId").value = f.id;
    document.getElementById("paymentError").classList.add("d-none");

    document.getElementById("paymentHistoryBody").innerHTML = f.payments.map(p => `
        <tr>
            <td>${p.payment_date}</td>
            <td>Rs. ${p.amount_paid}</td>
            <td>${p.payment_method}</td>
            <td>${p.notes || '-'}</td>
        </tr>
    `).join("") || `<tr><td colspan="4" class="text-center text-muted">No payments yet.</td></tr>`;

    new bootstrap.Modal(document.getElementById("feeDetailModal")).show();
}

document.getElementById("paymentForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const feeId = document.getElementById("paymentFeeId").value;
    const payload = {
        fee: parseInt(feeId),
        amount_paid: document.getElementById("paymentAmount").value,
        payment_method: document.getElementById("paymentMethod").value,
        notes: document.getElementById("paymentNotes").value,
    };

    const res = await apiFetch("/fees/payments/", { method: "POST", body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        const errorEl = document.getElementById("paymentError");
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }

    await loadFees();
    await refreshFeeDetailContent(feeId);
});

async function refreshFeeDetailContent(feeId) {
    const res = await apiFetch(`/fees/${feeId}/`);
    if (!res || !res.ok) return;
    const f = await res.json();

    document.getElementById("detailTotal").textContent = `Rs. ${f.total_fee}`;
    document.getElementById("detailPaid").textContent = `Rs. ${f.paid_amount}`;
    document.getElementById("detailRemaining").textContent = `Rs. ${f.remaining_amount}`;

    document.getElementById("paymentHistoryBody").innerHTML = f.payments.map(p => `
        <tr>
            <td>${p.payment_date}</td>
            <td>Rs. ${p.amount_paid}</td>
            <td>${p.payment_method}</td>
            <td>${p.notes || '-'}</td>
        </tr>
    `).join("") || `<tr><td colspan="4" class="text-center" style="color:var(--color-muted);">No payments yet.</td></tr>`;

    document.getElementById("paymentForm").reset();
    document.getElementById("paymentFeeId").value = f.id;
}

document.addEventListener("DOMContentLoaded", loadFees);