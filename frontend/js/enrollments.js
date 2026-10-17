let coursesCache = [];
let currentEnrollments = [];

async function loadEnrollments() {
    const res = await apiFetch("/enrollments/");
    if (!res || !res.ok) return;
    const data = await res.json();
    currentEnrollments = data.results || data;

    

    document.getElementById("enrollmentsTableBody").innerHTML = currentEnrollments.map(en => `
    <tr>
        <td class="small" style="color:var(--color-muted);">${en.student_detail.registration_number}</td>
        <td>${en.student_detail.full_name}</td>
        <td>${en.course_detail.name.replace(/_/g, ' ')}</td>
        <td>${en.reference || '-'}</td>
        <td>${en.enrollment_date}</td>
            <td class="text-end">
                <div class="dropdown d-inline-block">
                    <button class="btn btn-sm btn-outline-secondary" data-bs-toggle="dropdown"><i class="bi bi-three-dots"></i></button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li><a class="dropdown-item" href="#" onclick="openDetail(${en.id}); return false;">View Details</a></li>
                    </ul>
                </div>
                <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteEnrollment(${en.id}, '${en.student_detail.full_name}')"><i class="bi bi-trash"></i></button>
            </td>
        </tr>
    `).join("") || `<tr><td colspan="6" class="text-center py-4" style="color:var(--color-muted);">No enrollments yet.</td></tr>`;
}


async function deleteEnrollment(id, name) {
    if (!confirm(`Delete enrollment for ${name}? This cannot be undone.`)) return;
    const res = await apiFetch(`/enrollments/${id}/`, { method: "DELETE" });
    if (res && res.ok) loadEnrollments();
}

async function populateDropdowns() {
    const coursesRes = await apiFetch("/courses/");
    coursesCache = coursesRes && coursesRes.ok ? (await coursesRes.json()).results : [];
    document.getElementById("enrollCourse").innerHTML = coursesCache.map(c =>
        `<option value="${c.id}">${c.name.replace(/_/g, ' ')}</option>`
    ).join("");
    updateFeeDisplay();
}

function updateFeeDisplay() {
    const courseId = document.getElementById("enrollCourse").value;
    const course = coursesCache.find(c => c.id == courseId);
    const fee = course ? parseFloat(course.fee_amount) : 0;
    document.getElementById("courseFeeDisplay").textContent = `Rs. ${fee.toFixed(0)}`;
    updateFinalFee();
}

function updateFinalFee() {
    const courseId = document.getElementById("enrollCourse").value;
    const course = coursesCache.find(c => c.id == courseId);
    const fee = course ? parseFloat(course.fee_amount) : 0;
    const concession = parseFloat(document.getElementById("concessionAmount").value) || 0;
    document.getElementById("finalFeeDisplay").textContent = `Rs. ${(fee - concession).toFixed(0)}`;
}

document.getElementById("enrollCourse").addEventListener("change", updateFeeDisplay);
document.getElementById("concessionAmount").addEventListener("input", updateFinalFee);

document.getElementById("toggleConcessionBtn").addEventListener("click", () => {
    const block = document.getElementById("concessionBlock");
    block.style.display = block.style.display === "none" ? "block" : "none";
});

function openEnrollModal() {
    document.getElementById("enrollForm").reset();
    document.getElementById("enrollError").classList.add("d-none");
    document.getElementById("concessionBlock").style.display = "none";
    bootstrap.Modal.getOrCreateInstance(document.getElementById("enrollModal")).show();
    updateFeeDisplay();
}
document.getElementById("enrollForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    const errorEl = document.getElementById("enrollError");
    errorEl.classList.add("d-none");

    const studentPayload = {
    full_name: document.getElementById("newFullName").value,
    guardian_name: document.getElementById("newGuardianName").value,
    phone: document.getElementById("newPhone").value,
    guardian_phone: document.getElementById("newGuardianPhone").value,
    gender: document.getElementById("newGender").value,
    address: document.getElementById("newAddress").value,
};
    const studentRes = await apiFetch("/students/", { method: "POST", body: JSON.stringify(studentPayload) });
    const studentData = await studentRes.json();

    if (!studentRes.ok) {
        errorEl.textContent = Object.entries(studentData).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }

    const payload = {
    student: studentData.id,
    course: document.getElementById("enrollCourse").value,
    reference: document.getElementById("newReference").value,
    concession_amount: parseFloat(document.getElementById("concessionAmount").value) || 0,
};
    const res = await apiFetch("/enrollments/", { method: "POST", body: JSON.stringify(payload) });
    const data = await res.json();

    if (!res.ok) {
        errorEl.textContent = Object.entries(data).map(([k, v]) => `${k}: ${v}`).join(" | ");
        errorEl.classList.remove("d-none");
        return;
    }
    bootstrap.Modal.getInstance(document.getElementById("enrollModal")).hide();
    loadEnrollments();
});

async function openDetail(enrollmentId) {
    const en = currentEnrollments.find(e => e.id === enrollmentId);
    if (!en) return;

    const studentRes = await apiFetch(`/students/${en.student}/`);
    const student = studentRes && studentRes.ok ? await studentRes.json() : {};

    document.getElementById("detailEnrollmentId").value = en.id;
    document.getElementById("detailStudentId").value = en.student;

    document.getElementById("d_full_name").textContent = student.full_name || "-";
    document.getElementById("d_guardian_name").textContent = student.guardian_name || "-";
    document.getElementById("d_phone").textContent = student.phone || "-";
    document.getElementById("d_guardian_phone").textContent = student.guardian_phone || "-";
    document.getElementById("d_address").textContent = student.address || "-";
    document.getElementById("d_course").textContent = en.course_detail.name.replace(/_/g, ' ');
    document.getElementById("d_reference").textContent = en.reference || "-";
    document.getElementById("d_enrollment_date").textContent = en.enrollment_date;
    document.getElementById("d_internship_status").textContent = en.internship_status.replace('_', ' ');

    document.getElementById("detailViewMode").style.display = "flex";
    document.getElementById("detailEditForm").style.display = "none";
    document.getElementById("detailEditBtn").style.display = "inline-block";
    document.getElementById("detailSaveBtn").style.display = "none";

    new bootstrap.Modal(document.getElementById("detailModal")).show();

    window._detailStudent = student;
    window._detailEnrollment = en;
}

function enterEditMode() {
    const student = window._detailStudent;
    const en = window._detailEnrollment;

    document.getElementById("e_phone").value = student.phone || "";
    document.getElementById("e_guardian_phone").value = student.guardian_phone || "";
    
    document.getElementById("e_address").value = student.address || "";
    
    document.getElementById("e_reference").value = en.reference || "";
    document.getElementById("e_status").value = en.status;
    document.getElementById("e_internship_status").value = en.internship_status;

    document.getElementById("detailViewMode").style.display = "none";
    document.getElementById("detailEditForm").style.display = "block";
    document.getElementById("detailEditBtn").style.display = "none";
    document.getElementById("detailSaveBtn").style.display = "inline-block";
}

async function saveDetailEdit() {
    const enrollmentId = document.getElementById("detailEnrollmentId").value;
    const studentId = document.getElementById("detailStudentId").value;

    await apiFetch(`/students/${studentId}/`, {
        method: "PATCH",
        body: JSON.stringify({
            phone: document.getElementById("e_phone").value,
            guardian_phone: document.getElementById("e_guardian_phone").value,
            address: document.getElementById("e_address").value,
        }),
    });

    await apiFetch(`/enrollments/${enrollmentId}/`, {
        method: "PATCH",
        body: JSON.stringify({
            reference: document.getElementById("e_reference").value,
            status: document.getElementById("e_status").value,
            internship_status: document.getElementById("e_internship_status").value,
        }),
    });

    bootstrap.Modal.getInstance(document.getElementById("detailModal")).hide();
    loadEnrollments();
}

document.addEventListener("DOMContentLoaded", async () => {
    await populateDropdowns();
    loadEnrollments();
});
