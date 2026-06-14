# Plan Project: Expense Approval System

## Ringkasan

Expense Approval System adalah aplikasi fullstack untuk mengelola reimbursement atau klaim pengeluaran karyawan. Project ini cocok untuk portofolio Java + React karena punya workflow enterprise yang jelas, tetapi tetap mudah di-deploy sebagai satu backend Spring Boot, satu frontend React, dan satu database PostgreSQL.

## Tujuan Project

- Menunjukkan kemampuan membangun aplikasi fullstack end-to-end.
- Menerapkan authentication dan role-based access control.
- Membuat approval workflow yang realistis.
- Menyediakan dashboard, laporan, upload file, dan audit log.
- Mudah di-deploy ke platform seperti Railway, Render, Vercel, Netlify, Neon, atau Supabase.

## Tech Stack

### Frontend

- React
- TypeScript
- Vite
- Tailwind CSS atau Material UI
- TanStack Query
- React Hook Form
- Zod

### Backend

- Java 21
- Spring Boot
- Spring Security
- JWT Authentication
- Spring Data JPA
- PostgreSQL
- Flyway atau Liquibase
- Swagger / OpenAPI

### Deployment

- Frontend: Vercel atau Netlify
- Backend: Railway, Render, atau Fly.io
- Database: Neon, Supabase, Railway PostgreSQL, atau Render PostgreSQL

## Role Pengguna

### Employee

- Login ke aplikasi.
- Membuat expense claim.
- Upload bukti pembayaran.
- Melihat status claim.
- Membatalkan claim selama belum diproses.

### Manager

- Melihat claim dari employee di departemennya.
- Approve atau reject claim.
- Memberikan catatan approval/rejection.
- Melihat ringkasan pengeluaran tim.

### Finance

- Melihat claim yang sudah disetujui manager.
- Melakukan final verification.
- Menandai claim sebagai paid.
- Mengelola kategori expense.
- Export laporan bulanan.

### Admin

- Mengelola user.
- Mengelola role.
- Mengelola department.
- Melihat audit log.

## Breakdown Fitur

### Bagian 1: Foundation Project

Tujuan bagian ini adalah menyiapkan struktur project agar backend, frontend, database, dan deployment sudah punya fondasi yang jelas.

#### Backend

- Setup Spring Boot project.
- Setup struktur package:
  - config
  - controller
  - dto
  - entity
  - repository
  - service
  - security
  - exception
- Setup koneksi PostgreSQL.
- Setup migration tool dengan Flyway atau Liquibase.
- Setup global exception handler.
- Setup response format standar untuk API.
- Setup Swagger / OpenAPI.

#### Frontend

- Setup React + TypeScript + Vite.
- Setup routing.
- Setup layout dasar aplikasi.
- Setup API client.
- Setup TanStack Query.
- Setup form library dengan React Hook Form dan Zod.
- Setup komponen UI dasar:
  - Button
  - Input
  - Select
  - Textarea
  - Table
  - Badge
  - Modal
  - Toast

#### DevOps

- Setup Docker Compose untuk PostgreSQL.
- Setup file environment:
  - backend `.env` atau `application-local.yml`
  - frontend `.env`
- Setup script run local.
- Setup build command frontend dan backend.

#### Output

- Backend bisa start.
- Frontend bisa start.
- Database bisa connect.
- Swagger bisa diakses.
- Struktur folder sudah siap untuk fitur berikutnya.

### Bagian 2: Authentication dan Authorization

Tujuan bagian ini adalah membuat sistem login aman dengan pembatasan akses berdasarkan role.

#### Backend

- Membuat entity `User`.
- Membuat enum role:
  - ADMIN
  - EMPLOYEE
  - MANAGER
  - FINANCE
- Membuat password hashing dengan BCrypt.
- Membuat endpoint login.
- Membuat JWT access token.
- Membuat endpoint current user.
- Membuat filter JWT di Spring Security.
- Membuat konfigurasi authorization per endpoint.
- Membuat seed admin user.

#### Frontend

- Membuat halaman Login.
- Menyimpan token setelah login.
- Membuat auth context atau auth store.
- Membuat protected route.
- Membuat role-based route guard.
- Menampilkan menu sesuai role.
- Membuat logout.

#### API

- `POST /api/auth/login`
- `GET /api/auth/me`

#### Aturan Bisnis

- User hanya bisa login jika email dan password benar.
- Password tidak boleh disimpan dalam bentuk plain text.
- Endpoint private harus membutuhkan JWT.
- Menu dan halaman frontend harus mengikuti role user.

#### Output

- Admin, Employee, Manager, dan Finance bisa login.
- User tanpa token tidak bisa mengakses halaman private.
- User tidak bisa membuka halaman yang bukan hak rolenya.

### Bagian 3: Master Data

Tujuan bagian ini adalah menyediakan data dasar yang dipakai oleh claim dan approval workflow.

#### Modul User Management

- Admin bisa melihat daftar user.
- Admin bisa membuat user baru.
- Admin bisa mengubah data user.
- Admin bisa menghapus atau menonaktifkan user.
- Admin bisa memilih role user.
- Admin bisa memilih department user.

#### Modul Department Management

- Admin bisa melihat daftar department.
- Admin bisa membuat department.
- Admin bisa mengubah department.
- Admin bisa menghapus department jika tidak sedang dipakai.
- Admin bisa menentukan manager untuk department.

#### Modul Category Management

- Finance bisa melihat daftar kategori expense.
- Finance bisa membuat kategori expense.
- Finance bisa mengubah kategori expense.
- Finance bisa menghapus kategori jika tidak sedang dipakai.

#### Backend

- Entity:
  - `User`
  - `Department`
  - `ExpenseCategory`
- Repository untuk masing-masing entity.
- Service untuk validasi data.
- Controller CRUD.
- Validasi request DTO.
- Pagination dan search sederhana untuk daftar data.

#### Frontend

- Halaman User Management.
- Halaman Department Management.
- Halaman Category Management.
- Tabel data dengan search dan pagination.
- Form create dan edit.
- Konfirmasi delete.
- Toast sukses dan error.

#### API

- `GET /api/users`
- `POST /api/users`
- `GET /api/users/{id}`
- `PUT /api/users/{id}`
- `DELETE /api/users/{id}`
- `GET /api/departments`
- `POST /api/departments`
- `GET /api/departments/{id}`
- `PUT /api/departments/{id}`
- `DELETE /api/departments/{id}`
- `GET /api/categories`
- `POST /api/categories`
- `GET /api/categories/{id}`
- `PUT /api/categories/{id}`
- `DELETE /api/categories/{id}`

#### Output

- Data user, department, dan category bisa dikelola dari UI.
- Claim bisa memakai department dan category yang valid.

### Bagian 4: Expense Claim Core

Tujuan bagian ini adalah membuat fitur utama agar employee bisa membuat, menyimpan, submit, dan melihat klaim.

#### Backend

- Membuat entity `ExpenseClaim`.
- Membuat enum status claim:
  - DRAFT
  - SUBMITTED
  - MANAGER_APPROVED
  - MANAGER_REJECTED
  - FINANCE_APPROVED
  - PAID
  - CANCELLED
- Membuat CRUD claim.
- Membuat endpoint submit claim.
- Membuat endpoint cancel claim.
- Membuat filter claim berdasarkan:
  - status
  - category
  - date range
  - employee
  - department
- Membuat pagination dan sorting.
- Membuat validasi ownership untuk employee.

#### Frontend

- Halaman My Claims.
- Halaman Create Claim.
- Halaman Edit Draft Claim.
- Halaman Claim Detail.
- Filter claim.
- Status badge.
- Empty state untuk daftar kosong.
- Action submit.
- Action cancel.

#### Field Claim

- `title`
- `amount`
- `category`
- `transaction_date`
- `description`
- `status`
- `submitted_at`

#### API

- `GET /api/claims`
- `POST /api/claims`
- `GET /api/claims/{id}`
- `PUT /api/claims/{id}`
- `POST /api/claims/{id}/submit`
- `POST /api/claims/{id}/cancel`

#### Aturan Bisnis

- Employee hanya bisa melihat claim miliknya.
- Employee hanya bisa edit claim dengan status `DRAFT`.
- Employee hanya bisa submit claim dengan status `DRAFT`.
- Employee hanya bisa cancel claim sebelum claim diproses manager.
- Amount harus lebih besar dari 0.
- Transaction date tidak boleh jauh di masa depan.
- Category harus aktif.

#### Output

- Employee bisa membuat claim dari awal sampai submitted.
- Employee bisa memantau status claim.
- Data claim bisa difilter dan dipaginasi.

### Bagian 5: File Upload

Tujuan bagian ini adalah menyimpan bukti pembayaran untuk setiap expense claim.

#### Backend

- Membuat entity `ExpenseAttachment`.
- Membuat endpoint upload attachment.
- Membuat endpoint download/view attachment.
- Membuat endpoint delete attachment.
- Validasi file type.
- Validasi file size.
- Simpan file di local storage untuk versi awal.
- Simpan metadata file di database.

#### Frontend

- Komponen upload receipt.
- Preview nama file.
- Validasi file di sisi frontend.
- Tombol download/view receipt.
- Tombol delete attachment untuk draft claim.

#### Format File

- JPG
- PNG
- PDF

#### API

- `POST /api/claims/{id}/attachments`
- `GET /api/attachments/{id}`
- `DELETE /api/attachments/{id}`

#### Aturan Bisnis

- Attachment hanya bisa ditambahkan oleh owner claim.
- Attachment hanya bisa ditambahkan saat claim masih `DRAFT`.
- File maksimal mengikuti konfigurasi backend.
- File harus bertipe JPG, PNG, atau PDF.
- Attachment tidak boleh dihapus setelah claim disubmit.

#### Output

- Employee bisa upload bukti pembayaran.
- Receipt bisa dilihat oleh manager dan finance saat review.

### Bagian 6: Approval Workflow

Tujuan bagian ini adalah menjalankan proses approval dari employee ke manager lalu finance.

#### Backend

- Membuat entity `ApprovalNote`.
- Membuat endpoint manager approve.
- Membuat endpoint manager reject.
- Membuat endpoint finance approve.
- Membuat endpoint finance reject jika ingin versi lebih lengkap.
- Membuat endpoint mark as paid.
- Membuat validasi status transition.
- Membuat validasi akses manager berdasarkan department.
- Menyimpan catatan approval/rejection.
- Menyimpan timestamp review.

#### Frontend

- Halaman Approval Queue untuk Manager.
- Halaman Finance Review untuk Finance.
- Halaman Claim Detail dengan history approval.
- Modal approve/reject.
- Input note untuk approval/rejection.
- Action mark as paid.

#### API

- `POST /api/claims/{id}/manager-approve`
- `POST /api/claims/{id}/manager-reject`
- `POST /api/claims/{id}/finance-approve`
- `POST /api/claims/{id}/finance-reject`
- `POST /api/claims/{id}/mark-paid`

#### Status Transition

- `DRAFT` -> `SUBMITTED`
- `SUBMITTED` -> `MANAGER_APPROVED`
- `SUBMITTED` -> `MANAGER_REJECTED`
- `MANAGER_APPROVED` -> `FINANCE_APPROVED`
- `MANAGER_APPROVED` -> `FINANCE_REJECTED` jika status ini dipakai
- `FINANCE_APPROVED` -> `PAID`
- `DRAFT` -> `CANCELLED`
- `SUBMITTED` -> `CANCELLED` hanya jika belum direview manager

#### Aturan Bisnis

- Manager hanya bisa review claim employee dari department miliknya.
- Manager tidak boleh approve claim miliknya sendiri.
- Finance hanya bisa review claim yang sudah `MANAGER_APPROVED`.
- Paid hanya bisa dilakukan oleh Finance.
- Setiap approval/rejection harus menyimpan reviewer, action, note, dan waktu.
- Status tidak boleh lompat tanpa tahap sebelumnya.

#### Output

- Workflow approval berjalan end-to-end.
- Manager dan Finance punya antrian kerja masing-masing.
- Setiap keputusan approval tercatat.

### Bagian 7: Dashboard

Tujuan bagian ini adalah memberi ringkasan cepat sesuai kebutuhan masing-masing role.

#### Employee Dashboard

- Total claim bulan ini.
- Total amount bulan ini.
- Claim pending.
- Claim approved.
- Claim rejected.
- Recent claims.

#### Manager Dashboard

- Pending approvals.
- Total expense by department.
- Total approved this month.
- Top categories.
- Recent approval activity.

#### Finance Dashboard

- Total approved amount.
- Total paid amount.
- Outstanding reimbursement.
- Monthly expense trend.
- Claims waiting for payment.

#### Backend

- Query agregasi per role.
- Endpoint dashboard employee.
- Endpoint dashboard manager.
- Endpoint dashboard finance.
- DTO khusus dashboard agar response ringan.

#### Frontend

- Halaman Dashboard.
- Card metrik ringkas.
- Tabel recent activity.
- Chart sederhana untuk trend dan category.
- Loading state dan empty state.

#### API

- `GET /api/dashboard/employee`
- `GET /api/dashboard/manager`
- `GET /api/dashboard/finance`

#### Output

- Setiap role melihat dashboard yang relevan.
- Data dashboard cukup cepat dan tidak perlu memuat semua claim.

### Bagian 8: Reporting dan Export

Tujuan bagian ini adalah menyediakan laporan yang bisa difilter dan diexport untuk kebutuhan Finance atau Admin.

#### Backend

- Endpoint report claim.
- Filter report berdasarkan:
  - date range
  - department
  - category
  - status
  - employee
- Export CSV.
- Optional export PDF.
- Validasi akses report.

#### Frontend

- Halaman Reports.
- Filter form.
- Tabel hasil report.
- Tombol export CSV.
- Optional tombol export PDF.

#### API

- `GET /api/reports/claims`
- `GET /api/reports/claims/export-csv`
- `GET /api/reports/claims/export-pdf`

#### Aturan Bisnis

- Finance dan Admin bisa melihat semua report.
- Manager hanya bisa melihat report department miliknya jika fitur ini dibuka untuk Manager.
- Employee tidak boleh mengakses report global.

#### Output

- Finance bisa membuat laporan reimbursement bulanan.
- Data report bisa diexport ke CSV.

### Bagian 9: Audit Log

Tujuan bagian ini adalah mencatat aktivitas penting untuk transparansi dan debugging.

#### Backend

- Membuat entity `AuditLog`.
- Membuat service audit log.
- Mencatat aktivitas penting:
  - login
  - claim dibuat
  - claim diubah
  - claim disubmit
  - claim diapprove
  - claim direject
  - claim dibayar
  - user dibuat/diubah/dihapus
  - role diubah
  - department diubah
  - category diubah
- Menyimpan actor, action, entity, old value, new value, dan waktu.

#### Frontend

- Halaman Audit Logs untuk Admin.
- Filter berdasarkan action, actor, entity, dan tanggal.
- Tabel audit log.
- Detail perubahan old value dan new value.

#### API

- `GET /api/audit-logs`
- `GET /api/audit-logs/{id}`

#### Aturan Bisnis

- Hanya Admin yang bisa melihat audit log.
- Audit log tidak boleh diedit dari UI.
- Audit log tidak boleh dihapus pada versi normal aplikasi.

#### Output

- Aktivitas penting tercatat otomatis.
- Admin bisa melacak perubahan data.

### Bagian 10: Testing, Documentation, dan Deployment

Tujuan bagian ini adalah memastikan aplikasi layak dipresentasikan sebagai project portofolio.

#### Testing Backend

- Unit test service layer.
- Integration test endpoint penting.
- Test auth dan role access.
- Test status transition claim.
- Test approval workflow.

#### Testing Frontend

- Test form validation penting.
- Test render halaman utama.
- Test role-based navigation jika memungkinkan.

#### Documentation

- README lengkap.
- Screenshot aplikasi.
- ERD sederhana.
- API documentation link.
- Demo account.
- Cara menjalankan local.
- Cara deploy.

#### Deployment

- Deploy database.
- Deploy backend.
- Deploy frontend.
- Set environment variables production.
- Test login demo account di production.

#### Output

- Aplikasi bisa dijalankan local.
- Aplikasi bisa diakses online.
- README siap untuk GitHub portfolio.

## Struktur Database Awal

### users

- id
- name
- email
- password_hash
- role
- department_id
- is_active
- created_at
- updated_at

### departments

- id
- name
- manager_id
- created_at
- updated_at

### expense_categories

- id
- name
- description
- is_active
- created_at
- updated_at

### expense_claims

- id
- employee_id
- category_id
- title
- description
- amount
- transaction_date
- status
- submitted_at
- manager_reviewed_at
- finance_reviewed_at
- paid_at
- created_at
- updated_at

### expense_attachments

- id
- claim_id
- file_name
- file_path
- file_type
- file_size
- uploaded_at

### approval_notes

- id
- claim_id
- reviewer_id
- action
- note
- created_at

### audit_logs

- id
- actor_id
- action
- entity_type
- entity_id
- old_value
- new_value
- created_at

## Halaman Frontend

### Public

- Login

### Shared Authenticated Layout

- Dashboard
- Claim Detail
- Profile atau Account Menu

### Employee

- My Claims
- Create Claim
- Edit Draft Claim

### Manager

- Approval Queue
- Team Expense Summary

### Finance

- Finance Review
- Category Management
- Reports

### Admin

- User Management
- Department Management
- Audit Logs

## Prioritas MVP

### Wajib Untuk MVP

- Login JWT.
- Role Employee, Manager, Finance, Admin.
- Protected route frontend.
- User seed.
- Create claim.
- Upload receipt.
- Submit claim.
- Manager approve/reject.
- Finance approve.
- Finance mark as paid.
- Dashboard sederhana.
- Export CSV.

### Bisa Setelah MVP

- Export PDF.
- Chart dashboard yang lebih detail.
- Email notification.
- S3-compatible storage.
- Advanced audit diff.
- GitHub Actions CI.
- Soft delete semua master data.
- Multi-attachment per claim.

## Milestone Pengerjaan

### Milestone 1: Setup Project

- Setup Spring Boot project.
- Setup React Vite project.
- Setup PostgreSQL.
- Setup Docker Compose.
- Setup struktur folder.
- Setup environment variables.
- Setup Swagger.

### Milestone 2: Authentication

- Implement user entity.
- Implement login JWT.
- Implement Spring Security.
- Implement protected routes di React.
- Buat seed admin user.
- Buat demo users untuk setiap role.

### Milestone 3: Master Data

- CRUD user.
- CRUD department.
- CRUD category.
- Role-based access untuk halaman admin dan finance.

### Milestone 4: Expense Claim Core

- CRUD expense claim.
- Submit claim.
- Cancel claim.
- Upload attachment.
- List claim dengan filter dan pagination.

### Milestone 5: Approval Workflow

- Manager approval.
- Manager rejection.
- Finance approval.
- Finance mark as paid.
- Approval notes.
- Status transition validation.

### Milestone 6: Dashboard dan Reporting

- Employee dashboard.
- Manager dashboard.
- Finance dashboard.
- Report filter.
- Export CSV.

### Milestone 7: Audit Log

- Audit service.
- Audit event untuk auth, claim, approval, dan master data.
- Audit log viewer.

### Milestone 8: Testing dan Deployment

- Unit test service layer.
- Integration test API penting.
- Build frontend.
- Build backend.
- Deploy database.
- Deploy backend.
- Deploy frontend.
- Tulis README lengkap.

## README Yang Harus Disiapkan

- Deskripsi project.
- Screenshot aplikasi.
- Tech stack.
- Fitur utama.
- ERD sederhana.
- API documentation link.
- Cara menjalankan local.
- Cara deploy.
- Demo account.

## Demo Account

- Admin: `admin@example.com` / `password123`
- Employee: `employee@example.com` / `password123`
- Manager: `manager@example.com` / `password123`
- Finance: `finance@example.com` / `password123`

## Nilai Plus Untuk Portofolio

- Swagger documentation.
- Docker Compose.
- Seed data.
- Clean error handling.
- Pagination dan filtering.
- Audit log.
- Role-based UI.
- GitHub Actions CI.
- Live demo.
- README dengan screenshot.

## Nama Project

Beberapa opsi nama:

- SpendFlow
- ClaimDesk
- ReimburPro
- ExpenseHub
- ApprovePay
