# Software House & Training Institute Management System

Final year internship project — a web-based platform managing students, courses,
internships, enrollments, attendance, fees, employees and clients for an
organization that is both a software house and a training institute.

**Tech Stack:** Python, Django, Django REST Framework, PostgreSQL, Bootstrap 5,
JavaScript, Chart.js, JWT

---

## 👥 User Roles

The system has 3 roles, each with a different level of access:

| Role | Access |
|---|---|
| **Admin** | Full access to everything — students, courses, employees, clients, fees, expenses, payroll, all dashboards, all reports |
| **Receptionist** | Manages students, enrollments, attendance, fees, clients, daily queries/leads |
| **Employee** | Limited, scoped access — only their assigned course's students/attendance, their own profile, and their own assigned client projects |

Login is via **JWT (JSON Web Tokens)** — access + refresh token pair, with automatic refresh on expiry.

---

## 🧩 Core Modules

### 1. Students
- Student records with registration number, contact info, and enrollment history
- Search by name or registration number

### 2. Courses
- Courses/trainings offered by the institute
- Linked to enrollments, attendance, and employee (instructor) assignment

### 3. Enrollments
- Links a student to a course
- Used as the source for attendance and the "students" count

### 4. Attendance
- Admin/Receptionist: mark attendance for any course, view full history with filters (course, date, registration number)
- Employee: can only mark/view attendance for their **assigned course** (scoped access)
- Present/Absent tracked per student per date, editable after submission

### 5. Employees
- Employee records: name, designation, department, phone, CNIC, email, address, joining date, status, salary
- Admin can grant/revoke **login access** (creates a linked User account with role `employee`)
- Employee can be assigned a **course** (for scoped attendance access)
- **Employee self-service profile** (`My Profile`) — employee can view their details and edit phone/address only

### 6. Payroll
- Admin runs **"Run Monthly Payroll"** — one click generates a Salary expense entry for every active employee with a set salary
- Automatically prevents duplicate payroll runs for the same month
- Feeds directly into Expenses and the dashboard's Current Balance / Expense Breakdown

### 7. Clients & Projects
- Client records: contact info, project name, requirements, due date, deal amount
- Each client/project can be **assigned to an employee**
- Project status: `Pending` / `Completed`
- Client payments tracked separately (paid amount auto-calculated from payment history)

### 8. Fees & Payments
- Student fee records and payment history (Admin/Receptionist)

### 9. Daily Queries & Daily Leads
- Receptionist logs walk-in/call queries and sales leads (Admin/Receptionist only)

### 10. Expenses
- Categorized expense tracking (Salary, Tech, etc.) — feeds the dashboard's Expense Breakdown chart

### 11. Notifications & Announcements
- In-app notification bell with unread count
- Admin-posted announcements visible to all roles

---

## 📊 Dashboards

### Admin / Receptionist Dashboard
- Stat cards: Total Leads, Daily Queries, Active Students, Total Employees, Current Balance
- **Revenue vs Expenses** — line chart, last 6 months
- **Expense Breakdown** — doughnut chart by category
- Recent Daily Leads list
- Upcoming Deadlines / Events list

### Employee Dashboard (scoped to their own data)
- Stat cards: Students (in their assigned course), Pending Projects, Completed Projects
- **Enrollment Trend** — line chart, current month, for their assigned course
- **Today's Attendance** — doughnut chart (Present vs Absent) for their assigned course
- **My Projects** — list of client projects assigned to them, with:
  - **View** — full project/client details in a modal
  - **Completed** button — marks the project as completed (moves it from Pending count to Completed count)

Both dashboards share the same red-accent color theme and dark UI.

---

## 🔐 Access Control Summary

- Every API endpoint is protected by role-based permission classes (`IsAdmin`, `IsAdminOrReceptionist`, `IsEmployee`)
- Employees can only ever see/edit data scoped to themselves — their own attendance course, their own profile, their own assigned projects. They cannot access the general Clients, Employees, or Fees modules
- Django Admin (`/admin/`) available for superuser-level account/password management

---

## ⚙️ Running the Project

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver 8001
```

Frontend is static HTML/JS/Bootstrap — served/opened directly (no build step), calling the API at `http://127.0.0.1:8001/api`.

---

## 🗂 Project Structure (Django apps)

```
accounts/      → User model, JWT auth, roles & permissions
students/      → Student records
courses/       → Courses/trainings
enrollments/   → Student ↔ Course links
attendance/    → Daily attendance marking & history
employees/     → Employee records, login access, payroll, self-profile
clients/       → Clients, project assignment, project status, payments
fees/          → Student fee records & payments
expenses/      → Expense tracking (incl. auto payroll expenses)
dashboard/     → Admin & Employee dashboard stats endpoints
notifications/ → In-app notifications
announcements/ → Admin announcements
dailyqueries/  → Walk-in/call query logs
dailyleads/    → Sales lead tracking
frontend/      → HTML/CSS/JS (Bootstrap + Chart.js) UI
```


---

## 🔗 Important URLs

| URL | Purpose |
|---|---|
| `http://127.0.0.1:8001/admin/` | Django Admin panel — superuser login, manage/reset any user's password, raw DB-level access to all models |
| `http://127.0.0.1:8001/api/` | Base API URL (all endpoints below are prefixed with this) |
| `frontend/login.html` | Frontend login page (Admin / Receptionist / Employee) |

### API Endpoints (by module)

| Endpoint | Module |
|---|---|
| `/api/auth/` | Login, logout, token refresh, current user (`/auth/me/`) |
| `/api/accounts/receptionists/` | Create receptionist accounts (Admin only) |
| `/api/courses/` | Courses |
| `/api/students/` | Students |
| `/api/employees/` | Employees, `me/`, `create-login/`, `revoke-login/`, `run-payroll/` |
| `/api/enrollments/` | Student ↔ Course enrollments |
| `/api/attendance/` | Attendance marking & history |
| `/api/fees/` | Student fees & payments |
| `/api/clients/` | Clients/projects, `my-projects/` (employee-scoped) |
| `/api/notifications/` | Notifications, `unread_count/` |
| `/api/announcements/` | Announcements |
| `/api/daily-queries/` | Daily queries log |
| `/api/daily-leads/` | Daily leads log |
| `/api/expenses/` | Expenses |
| `/api/dashboard/` | `stats/` (Admin), `employee-stats/` (Employee) |



---

## ✅ Stable Version

**v1.0 — Current Stable Build**
| Component | Version |
|---|---|
| Python | 3.12.3 |
| Django | 6.1.1 |
| Django REST Framework | 3.18.1 |
| djangorestframework-simplejwt | 5.5.1 |
| django-cors-headers | 4.9.0 |
| psycopg2-binary | 2.9.13 |
| PyJWT | 2.14.0 |
| asgiref | 3.12.1 |
| pillow | 12.3.0 |
| python-decouple | 3.8 |
| sqlparse | 0.6.0 |
| tzdata | 2026.4 |
| Bootstrap | 5.3.3 |
| Chart.js | 4.4.1 |

All modules tested and working on this stack — Authentication, Students, Courses,
Enrollments, Attendance, Employees & Payroll, Clients & Projects, Fees, Expenses,
Daily Queries/Leads, Notifications, Announcements, and both Admin and Employee
Dashboards.

No known critical bugs as of this version.