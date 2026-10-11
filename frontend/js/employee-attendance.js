const attDateInput = document.getElementById("attDate");
let allEmployees = [];

function todayStr() {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${d.getFullYear()}-${m}-${day}`;
}

function cap(s) {
    return s.charAt(0).toUpperCase() + s.slice(1);
}

function showMsg(elId, text, type) {
    const el = document.getElementById(elId);
    el.textContent = text;
    el.className = `alert alert-${type} py-2`;
}

function hideMsg(elId) {
    document.getElementById(elId).className = "alert d-none py-2";
}

function statusClass(status) {
    if (status === "present") return "active";
    if (status === "absent") return "inactive";
    return "leave";
}

function populateEmployeeFilter() {
    const sel = document.getElementById("filterEmployee");
    const current = sel.value;
    sel.innerHTML = `<option value="">All</option>` +
        allEmployees.map(e => `<option value="${e.id}">${e.full_name}</option>`).join("");
    sel.value = current;
}

/* ---------- Mark attendance ---------- */

async function loadEmployeeAttendance() {
    hideMsg("attMsg");
    const res = await apiFetch(`/employees/attendance/?date=${attDateInput.value}`);
    if (!res) return;
    if (res.status === 403) {
        showMsg("attMsg", "You do not have permission to view this page.", "danger");
        return;
    }
    if (!res.ok) {
        showMsg("attMsg", "Could not load employees.", "danger");
        return;
    }

    const data = await res.json();
    allEmployees = data.employees;
    populateEmployeeFilter();

    const body = document.getElementById("attBody");
    if (!data.employees.length) {
        body.innerHTML = `<tr><td colspan="5" class="text-center py-3" style="color:var(--color-muted);">No active employees found.</td></tr>`;
        return;
    }

    body.innerHTML = data.employees.map((e, i) => {
        const current = e.status || "present";
        const pills = ["present", "absent", "leave"].map(s => `
            <input type="radio" class="btn-check" name="att_${e.id}" id="att_${e.id}_${s}" value="${s}" ${current === s ? "checked" : ""}>
            <label class="att-pill att-${s}" for="att_${e.id}_${s}">${cap(s)}</label>
        `).join("");
        return `
            <tr data-emp-id="${e.id}">
                <td>${i + 1}</td>
                <td>${e.full_name}</td>
                <td>${e.designation}</td>
                <td>${e.department}</td>
                <td class="text-end"><div class="att-pills">${pills}</div></td>
            </tr>
        `;
    }).join("");
}

document.getElementById("submitAttBtn").addEventListener("click", async () => {
    const rows = document.querySelectorAll("#attBody tr[data-emp-id]");
    const records = [...rows].map(tr => {
        const id = Number(tr.dataset.empId);
        const checked = tr.querySelector(`input[name="att_${id}"]:checked`);
        return { employee: id, status: checked ? checked.value : "present" };
    });
    if (!records.length) return;

    const btn = document.getElementById("submitAttBtn");
    btn.disabled = true;
    const res = await apiFetch("/employees/attendance/", {
        method: "POST",
        body: JSON.stringify({ date: attDateInput.value, records }),
    });
    btn.disabled = false;
    if (!res) return;

    if (res.ok) {
        const data = await res.json();
        showMsg("attMsg", data.detail, "success");
    } else {
        let msg = "Something went wrong.";
        try { msg = (await res.json()).detail || msg; } catch (e) {}
        showMsg("attMsg", msg, "danger");
    }
});

/* ---------- History ---------- */

async function loadAttendanceHistory() {
    hideMsg("histMsg");
    const params = new URLSearchParams();
    const date = document.getElementById("filterDate").value;
    const emp = document.getElementById("filterEmployee").value;
    if (date) params.append("date", date);
    if (emp) params.append("employee", emp);

    const body = document.getElementById("historyBody");
    const res = await apiFetch(`/employees/attendance/history/?${params.toString()}`);
    if (!res || !res.ok) {
        body.innerHTML = `<tr><td colspan="4" class="text-center py-4" style="color:var(--color-muted);">Could not load history.</td></tr>`;
        return;
    }

    const list = (await res.json()).results;
    if (!list.length) {
        body.innerHTML = `<tr><td colspan="4" class="text-center py-4" style="color:var(--color-muted);">No records found.</td></tr>`;
        return;
    }

    const grouped = {};
    list.forEach(r => {
        if (!grouped[r.date]) grouped[r.date] = [];
        grouped[r.date].push(r);
    });
    const dates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

    body.innerHTML = dates.map(d => `
        <tr style="background:var(--color-surface-alt);">
            <td colspan="4" class="fw-semibold small py-2" style="color:var(--color-text);">
                <i class="bi bi-calendar-event me-1"></i>${d}
            </td>
        </tr>
        ${grouped[d].map(r => `
            <tr data-rec-id="${r.id}" data-emp-id="${r.employee}" data-date="${r.date}" data-status="${r.status}">
                <td>${r.employee_name}</td>
                <td class="small" style="color:var(--color-muted);">${r.designation}</td>
                <td class="statusCell">
                    <span class="status-pill status-${statusClass(r.status)}">${r.status}</span>
                </td>
                <td class="text-end">
                    <button class="btn btn-sm btn-outline-secondary" onclick="editHistoryStatus(${r.id})">
                        <i class="bi bi-pencil"></i> Edit
                    </button>
                </td>
            </tr>
        `).join("")}
    `).join("");
}

function editHistoryStatus(recId) {
    const row = document.querySelector(`tr[data-rec-id="${recId}"]`);
    if (!row) return;
    const current = row.dataset.status;
    row.querySelector(".statusCell").innerHTML = `
        <select class="form-select form-select-sm" style="width:auto;" onchange="saveHistoryEdit(${recId}, this.value)">
            ${["present", "absent", "leave"].map(s => `<option value="${s}" ${s === current ? "selected" : ""}>${cap(s)}</option>`).join("")}
        </select>
    `;
}

async function saveHistoryEdit(recId, newStatus) {
    const row = document.querySelector(`tr[data-rec-id="${recId}"]`);
    if (!row) return;

    const res = await apiFetch("/employees/attendance/", {
        method: "POST",
        body: JSON.stringify({
            date: row.dataset.date,
            records: [{ employee: Number(row.dataset.empId), status: newStatus }],
        }),
    });
    if (res && res.ok) {
        loadAttendanceHistory();
    } else {
        showMsg("histMsg", "Could not update attendance.", "danger");
    }
}

/* ---------- View switching ---------- */

document.getElementById("viewPreviousBtn").addEventListener("click", () => {
    document.getElementById("markSection").style.display = "none";
    document.getElementById("historySection").style.display = "block";
    loadAttendanceHistory();
});

document.getElementById("backToMarkBtn").addEventListener("click", () => {
    document.getElementById("historySection").style.display = "none";
    document.getElementById("markSection").style.display = "block";
    loadEmployeeAttendance();
});

document.getElementById("filterBtn").addEventListener("click", loadAttendanceHistory);

attDateInput.value = todayStr();
attDateInput.max = todayStr();
document.getElementById("filterDate").max = todayStr();
attDateInput.addEventListener("change", loadEmployeeAttendance);
document.addEventListener("DOMContentLoaded", loadEmployeeAttendance);
