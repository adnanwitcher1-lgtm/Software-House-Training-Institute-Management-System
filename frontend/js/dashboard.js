async function loadDashboard() {
    let user = JSON.parse(sessionStorage.getItem("cached_user") || "null");
    if (!user) {
        const meRes = await apiFetch("/auth/me/");
        if (!meRes || !meRes.ok) return;
        user = await meRes.json();
        sessionStorage.setItem("cached_user", JSON.stringify(user));
    }

    if (user.role === 'employee') {
        document.getElementById("adminDashboardSection").style.display = "none";
        document.getElementById("employeeDashboardSection").style.display = "block";
        loadEmployeeDashboard();
    } else {
        document.getElementById("employeeDashboardSection").style.display = "none";
        document.getElementById("adminDashboardSection").style.display = "block";
        loadAdminDashboard();
    }
}

async function loadAdminDashboard() {
    const res = await apiFetch("/dashboard/stats/");
    if (!res || !res.ok) return;
    const data = await res.json();

    const existingRevenue = Chart.getChart("revenueChart");
    if (existingRevenue) existingRevenue.destroy();
    const existingExpense = Chart.getChart("expenseChart");
    if (existingExpense) existingExpense.destroy();

    document.getElementById("statLeads").textContent = data.total_leads;
    document.getElementById("statQueries").textContent = data.daily_queries_count;
    document.getElementById("statStudents").textContent = data.active_students;
    document.getElementById("statEmployees").textContent = data.total_employees;
    document.getElementById("statBalance").textContent = `Rs. ${data.current_balance.toLocaleString()}`;
    const rs = n => `Rs. ${Number(n || 0).toLocaleString()}`;
    document.getElementById("statIncome").textContent = rs(data.total_income);
    document.getElementById("statIncomeSub").textContent = `Fees ${rs(data.student_income)} + Clients ${rs(data.client_income)}`;
    document.getElementById("statExpense").textContent = rs(data.total_expenses);
    document.getElementById("statExpenseSub").textContent = "All recorded expenses";
    document.getElementById("statPendingFee").textContent = rs(data.pending_fee_amount);
    document.getElementById("statPendingFeeSub").textContent = `${data.pending_fee_students} students unpaid`;
    document.getElementById("statNet").textContent = rs(data.total_income - data.total_expenses);
    document.getElementById("statNetSub").textContent = "Income - Expense";

    new Chart(document.getElementById("revenueChart"), {
        type: 'line',
        data: {
            labels: data.revenue_expenses_chart.map(d => d.month),
            datasets: [
                {
                    label: 'Revenue',
                    data: data.revenue_expenses_chart.map(d => d.revenue),
                    borderColor: '#D21F1F',
                    backgroundColor: 'rgba(210,31,31,0.08)',
                    fill: true,
                    tension: 0.5,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: '#D21F1F',
                },
                {
                    label: 'Expenses',
                    data: data.revenue_expenses_chart.map(d => d.expenses),
                    borderColor: '#F3A0A0',
                    backgroundColor: 'rgba(243,160,160,0.15)',
                    fill: true,
                    tension: 0.5,
                    borderWidth: 2.5,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointBackgroundColor: '#F3A0A0',
                },
            ],
        },
        options: {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { color: '#4A4A50' } } },
            scales: {
                x: { ticks: { color: '#9A9AA0' }, grid: { display: false } },
                y: { ticks: { color: '#9A9AA0' }, grid: { color: 'rgba(0,0,0,0.06)', drawTicks: false } },
            },
        },
    });

    const breakdown = data.expense_breakdown;
    const donutColors = ['#D21F1F', '#E8730A', '#F3A0A0', '#6B3FBF', '#1E6FD9', '#2E9E4F'];

    new Chart(document.getElementById("expenseChart"), {
        type: 'doughnut',
        data: {
            labels: breakdown.map(e => e.category),
            datasets: [{
                data: breakdown.map(e => e.total),
                backgroundColor: donutColors,
                borderWidth: 2,
                borderColor: '#ffffff',
            }],
        },
        options: {
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { display: false } },
        },
        plugins: [{
            id: 'centerText',
            afterDraw(chart) {
                const { ctx, chartArea } = chart;
                const x = (chartArea.left + chartArea.right) / 2;
                const y = (chartArea.top + chartArea.bottom) / 2;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#9A9AA0';
                ctx.font = '10px Inter, sans-serif';
                ctx.fillText('Total Expenses', x, y - 9);
                ctx.fillStyle = '#1A1A1E';
                ctx.font = 'bold 14px Inter, sans-serif';
                const total = breakdown.reduce((s, e) => s + e.total, 0);
                ctx.fillText(`Rs. ${total.toLocaleString()}`, x, y + 9);
                ctx.restore();
            }
        }],
    });

    document.getElementById("expenseLegend").innerHTML = breakdown.map((e, i) => `
        <div class="legend-light-item">
            <span><span class="legend-dot" style="background:${donutColors[i % donutColors.length]}"></span>${e.category}</span>
            <strong>${e.percentage}%</strong>
        </div>
    `).join("");

    document.getElementById("recentLeads").innerHTML = data.recent_leads.map(l => `
        <div class="list-row">
            <div class="d-flex align-items-center gap-2">
                <div class="lead-avatar"><i class="bi bi-person"></i></div>
                <div>
                    <div class="fw-semibold" style="font-size:13px;">${l.full_name}</div>
                    <div class="muted-light">${l.reference ? "Ref: " + l.reference : "No reference"}</div>
                </div>
            </div>
            <div class="text-end">
                <span class="pill-tag" style="background:#FBE7E7; color:#D21F1F;">${l.course__name ? l.course__name.replace(/_/g, " ") : "-"}</span>
                <div class="muted-light mt-1">${new Date(l.created_at).toLocaleDateString()}</div>
            </div>
        </div>
    `).join("") || `<p class="small text-center py-3" style="color:var(--color-muted);">No leads yet.</p>`;

    document.getElementById("upcomingDeadlines").innerHTML = data.upcoming_deadlines.map(d => {
        const isEnrollment = d.title.toLowerCase().includes("enrollment");
        const dt = new Date(d.due_date);
        return `
        <div class="list-row">
            <div class="d-flex align-items-center gap-2">
                <div class="deadline-datebox">
                    <span class="dl-day">${dt.getDate()}</span>${dt.toLocaleString('default', { month: 'short' })}
                </div>
                <div style="font-size:13px;">${d.title}</div>
            </div>
            <span class="pill-tag" style="background:${isEnrollment ? '#EDE9FB' : '#E7F0FB'}; color:${isEnrollment ? '#6B3FBF' : '#1E6FD9'};">
                ${isEnrollment ? 'Enrollment' : 'Project'}
            </span>
        </div>
    `}).join("") || `<p class="small text-center py-3" style="color:var(--color-muted);">No upcoming deadlines.</p>`;
}

async function loadEmployeeDashboard() {
    const res = await apiFetch("/dashboard/employee-stats/");
    if (!res || !res.ok) return;
    const data = await res.json();

    document.getElementById("empStatStudents").textContent = data.students;
    document.getElementById("empStatPending").textContent = data.pending_projects;
    document.getElementById("empStatCompleted").textContent = data.completed_projects;

    const existingEnrollment = Chart.getChart("empEnrollmentChart");
    if (existingEnrollment) existingEnrollment.destroy();
    const existingAttendance = Chart.getChart("empAttendanceChart");
    if (existingAttendance) existingAttendance.destroy();

    new Chart(document.getElementById("empEnrollmentChart"), {
        type: 'line',
        data: {
            labels: data.enrollment_trend.map(d => d.day),
            datasets: [{
                label: 'Enrollments',
                data: data.enrollment_trend.map(d => d.count),
                borderColor: '#D21F1F',
                backgroundColor: 'rgba(210,31,31,0.08)',
                fill: true,
                tension: 0.5,
                borderWidth: 2.5,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointBackgroundColor: '#D21F1F',
            }],
        },
        options: {
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            plugins: { legend: { labels: { color: '#4A4A50' } } },
            scales: {
                x: { ticks: { color: '#9A9AA0' }, grid: { display: false } },
                y: { ticks: { color: '#9A9AA0' }, grid: { color: 'rgba(0,0,0,0.06)', drawTicks: false }, beginAtZero: true },
            },
        },
    });

    const att = data.today_attendance;
    const attColors = ['#D21F1F', '#F3A0A0'];
    new Chart(document.getElementById("empAttendanceChart"), {
        type: 'doughnut',
        data: {
            labels: ['Present', 'Absent'],
            datasets: [{
                data: [att.present, att.absent],
                backgroundColor: attColors,
                borderWidth: 2,
                borderColor: '#ffffff',
            }],
        },
        options: {
            maintainAspectRatio: false,
            cutout: '68%',
            plugins: { legend: { display: false } },
        },
        plugins: [{
            id: 'attendanceCenterText',
            afterDraw(chart) {
                const { ctx, chartArea } = chart;
                const total = att.present + att.absent;
                const pct = total > 0 ? Math.round((att.present / total) * 100) : 0;
                const x = (chartArea.left + chartArea.right) / 2;
                const y = (chartArea.top + chartArea.bottom) / 2;
                ctx.save();
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillStyle = '#9A9AA0';
                ctx.font = '10px Inter, sans-serif';
                ctx.fillText('Present', x, y - 9);
                ctx.fillStyle = '#1A1A1E';
                ctx.font = 'bold 16px Inter, sans-serif';
                ctx.fillText(`${pct}%`, x, y + 9);
                ctx.restore();
            }
        }],
    });

    document.getElementById("attendanceLegend").innerHTML = `
        <div class="legend-light-item"><span><span class="legend-dot" style="background:${attColors[0]}"></span>Present</span><strong>${att.present}</strong></div>
        <div class="legend-light-item"><span><span class="legend-dot" style="background:${attColors[1]}"></span>Absent</span><strong>${att.absent}</strong></div>
    `;

    loadEmployeeProjects();
}

async function loadEmployeeProjects() {
    const res = await apiFetch("/clients/my-projects/");
    if (!res || !res.ok) return;
    const projects = await res.json();
    projects.sort((a, b) => (a.project_status === 'completed' ? 1 : 0) - (b.project_status === 'completed' ? 1 : 0));

    document.getElementById("empProjectsBody").innerHTML = projects.map(p => `
        <tr data-project-id="${p.id}">
            <td>${p.project_name || '-'}</td>
            <td>${p.name}</td>
            <td>${p.project_due_date || '-'}</td>
            <td><span class="status-pill status-${p.project_status === 'completed' ? 'active' : 'inactive'}">${p.project_status}</span></td>
            <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary" onclick='viewProject(${JSON.stringify(p)})'>View</button>
                ${p.project_status !== 'completed'
                    ? `<button class="btn btn-sm btn-accent ms-1" onclick="completeProject(${p.id})">Completed</button>`
                    : ''}
            </td>
        </tr>
    `).join("") || `<tr><td colspan="5" class="text-center py-3" style="color:var(--color-muted);">No projects assigned.</td></tr>`;
}

function viewProject(p) {
    document.getElementById("projectViewBody").innerHTML = `
        <p><strong>Client:</strong> ${p.name}</p>
        <p><strong>Contact:</strong> ${p.contact_person || '-'} — ${p.phone || '-'} / ${p.email || '-'}</p>
        <p><strong>Project:</strong> ${p.project_name || '-'}</p>
        <p><strong>Due Date:</strong> ${p.project_due_date || '-'}</p>
        <p><strong>Deal Amount:</strong> Rs. ${p.deal_amount ?? '-'}</p>
        <p><strong>Requirements:</strong> ${p.project_requirements || '-'}</p>
        <p><strong>Status:</strong> ${p.project_status}</p>
    `;
    new bootstrap.Modal(document.getElementById("projectViewModal")).show();
}

async function completeProject(id) {
    if (!confirm("Mark this project as completed?")) return;
    const res = await apiFetch(`/clients/my-projects/${id}/complete/`, { method: "POST" });
    if (res && res.ok) {
        loadEmployeeDashboard();
    }
}

document.addEventListener("DOMContentLoaded", loadDashboard);
