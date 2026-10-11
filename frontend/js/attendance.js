async function populateCourseDropdowns() {
    const meRes = await apiFetch("/auth/me/");
    const me = meRes && meRes.ok ? await meRes.json() : {};

    if (me.role === 'employee') {
        const empRes = await apiFetch("/employees/me/");
        const emp = empRes && empRes.ok ? await empRes.json() : {};

        if (!emp.assigned_course) {
            document.getElementById("markCourse").innerHTML = `<option value="">No course assigned</option>`;
            document.getElementById("filterCourse").innerHTML = `<option value="">No course assigned</option>`;
            return;
        }

        const courseName = emp.assigned_course_name.replace(/_/g, ' ');
        document.getElementById("markCourse").innerHTML = `<option value="${emp.assigned_course}">${courseName}</option>`;
        document.getElementById("markCourse").disabled = true;
        document.getElementById("filterCourse").innerHTML = `<option value="${emp.assigned_course}">${courseName}</option>`;
        document.getElementById("filterCourse").disabled = true;
        return;
    }

    const res = await apiFetch("/courses/");
    if (!res || !res.ok) return;
    const courses = (await res.json()).results;

    const options = courses.map(c =>
        `<option value="${c.id}">${c.name.replace(/_/g, ' ')}</option>`
    ).join("");

    document.getElementById("markCourse").innerHTML = options;
    document.getElementById("filterCourse").innerHTML = `<option value="">All</option>` + options;
}

async function loadEnrolledStudents() {
    const courseId = document.getElementById("markCourse").value;
    const date = document.getElementById("markDate").value;
    if (!courseId || !date) {
        alert("Please select a course and date first.");
        return;
    }

    const res = await apiFetch(`/enrollments/?course=${courseId}`);
    if (!res || !res.ok) return;
    const enrollments = (await res.json()).results;

    const attRes = await apiFetch(`/attendance/?course=${courseId}&date_from=${date}&date_to=${date}`);
    const existing = attRes && attRes.ok ? (await attRes.json()).results : [];
    const existingMap = {};
    existing.forEach(a => { existingMap[a.student] = a.status; });

    const tbody = document.getElementById("markTableBody");
    tbody.innerHTML = enrollments.map(en => {
        const current = existingMap[en.student] || "present";
        return `
            <tr data-student-id="${en.student}">
                <td class="small" style="color:var(--color-muted);">${en.student_detail.registration_number}</td>
                <td>${en.student_detail.full_name}</td>
                <td>
                    <div class="btn-group" role="group">
                        <input type="radio" class="btn-check" name="att_${en.student}" id="present_${en.student}" value="present" ${current === 'present' ? 'checked' : ''}>
                        <label class="btn btn-outline-success btn-sm" for="present_${en.student}">Present</label>

                        <input type="radio" class="btn-check" name="att_${en.student}" id="absent_${en.student}" value="absent" ${current === 'absent' ? 'checked' : ''}>
                        <label class="btn btn-outline-danger btn-sm" for="absent_${en.student}">Absent</label>
                    </div>
                </td>
            </tr>
        `;
    }).join("") || `<tr><td colspan="3" class="text-center py-3" style="color:var(--color-muted);">No students enrolled in this course.</td></tr>`;

    document.getElementById("markTable").style.display = enrollments.length ? "table" : "none";
    document.getElementById("submitAttendanceBtn").style.display = enrollments.length ? "inline-block" : "none";
    document.getElementById("markSearchWrap").style.display = enrollments.length ? "block" : "none";
}

async function submitAttendance() {
    const courseId = document.getElementById("markCourse").value;
    const date = document.getElementById("markDate").value;
    const rows = document.querySelectorAll("#markTableBody tr[data-student-id]");

    const entries = Array.from(rows).map(row => {
        const studentId = row.dataset.studentId;
        const checked = row.querySelector(`input[name="att_${studentId}"]:checked`);
        return { student: parseInt(studentId), status: checked ? checked.value : "present" };
    });

    const res = await apiFetch("/attendance/mark/", {
        method: "POST",
        body: JSON.stringify({ course: parseInt(courseId), date, entries }),
    });

    const msgEl = document.getElementById("markMsg");
    if (res && res.ok) {
        msgEl.textContent = "Attendance submitted successfully.";
        msgEl.className = "alert alert-success mt-2 py-2";
        loadHistory();
    } else {
        msgEl.textContent = "Something went wrong.";
        msgEl.className = "alert alert-danger mt-2 py-2";
    }
}

async function loadHistory() {
    const course = document.getElementById("filterCourse").value;
    const date = document.getElementById("filterDate").value;
    const regNumber = document.getElementById("filterRegNumber").value.trim();

    const params = new URLSearchParams();
    if (course) params.append("course", course);
    if (date) { params.append("date_from", date); params.append("date_to", date); }
    if (regNumber) params.append("registration_number", regNumber);

    const res = await apiFetch(`/attendance/?${params.toString()}`);
    if (!res || !res.ok) return;
    const list = (await res.json()).results;

    if (!list.length) {
    document.getElementById("historyTableBody").innerHTML =
        `<tr><td colspan="5" class="text-center py-4" style="color:var(--color-muted);">No records found.</td></tr>`;
    return;
}

const grouped = {};
list.forEach(a => {
    if (!grouped[a.date]) grouped[a.date] = [];
    grouped[a.date].push(a);
});

const sortedDates = Object.keys(grouped).sort((a, b) => b.localeCompare(a));

document.getElementById("historyTableBody").innerHTML = sortedDates.map(date => `
    <tr style="background:var(--color-surface-alt);">
        <td colspan="5" class="fw-semibold small py-2" style="color:var(--color-text);">
            <i class="bi bi-calendar-event me-1"></i>${date}
        </td>
    </tr>
    ${grouped[date].map(a => `
        <tr data-att-id="${a.id}">
            <td class="small" style="color:var(--color-muted);">${a.registration_number}</td>
            <td>${a.student_name}</td>
            <td>${a.course_name.replace(/_/g, ' ')}</td>
            <td class="statusCell">
                <span class="status-pill status-${a.status === 'present' ? 'active' : 'inactive'}">${a.status}</span>
            </td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary" onclick="toggleEditAttendance(${a.id})">
                    <i class="bi bi-pencil"></i> Edit
                </button>
            </td>
        </tr>
    `).join("")}
`).join("");}

function toggleEditAttendance(attId) {
    const row = document.querySelector(`tr[data-att-id="${attId}"]`);
    const statusCell = row.querySelector(".statusCell");
    const currentStatus = statusCell.textContent.trim();

    statusCell.innerHTML = `
        <select class="form-select form-select-sm" onchange="saveAttendanceEdit(${attId}, this.value)">
            <option value="present" ${currentStatus === 'present' ? 'selected' : ''}>Present</option>
            <option value="absent" ${currentStatus === 'absent' ? 'selected' : ''}>Absent</option>
        </select>
    `;
}

async function saveAttendanceEdit(attId, newStatus) {
    const res = await apiFetch(`/attendance/${attId}/`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
    });
    if (res && res.ok) loadHistory();
}

document.getElementById("viewPreviousBtn").addEventListener("click", () => {
    document.getElementById("markAttendanceSection").style.display = "none";
    document.getElementById("historySection").style.display = "block";
});

document.getElementById("backToMarkBtn").addEventListener("click", () => {
    document.getElementById("historySection").style.display = "none";
    document.getElementById("markAttendanceSection").style.display = "block";
});

document.addEventListener("DOMContentLoaded", async () => {
    document.getElementById("markDate").valueAsDate = new Date();
    await populateCourseDropdowns();
    loadHistory();
});

document.getElementById("markRegSearch").addEventListener("input", (e) => {
    const term = e.target.value.trim().toLowerCase();
    document.querySelectorAll("#markTableBody tr[data-student-id]").forEach(row => {
        const reg = row.children[0].textContent.toLowerCase();
        row.style.display = reg.includes(term) ? "" : "none";
    });
});