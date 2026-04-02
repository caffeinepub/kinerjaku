# KinerjaKu - Employee Performance Dashboard

## Current State
New project with no existing application files.

## Requested Changes (Diff)

### Add
- Login page (frontend) for admin and employee roles
- Employee registration form with: name, NIP, role, village/desa, address, photo
- Dashboard layout matching the uploaded image (blue header, two-panel layout)
- Input Realisasi form: Nama Pegawai, Tugas/Indikator, Target, Realisasi, File Bukti
- Data Kinerja table: Tgl & Nama, Tugas, Persentase, Nilai, Aksi columns
- Peta Lokasi Pegawai: interactive map using Leaflet showing employee pins by village/desa
- Admin dashboard: manage employees, view all performance data, map overview
- Employee dashboard: input own performance, view own history

### Modify
- N/A (new project)

### Remove
- N/A

## Implementation Plan
1. Backend: Employee profile storage (name, NIP, role, village, lat/lng), Performance records (task, target, realisasi, percentage, nilai, date, file), Role-based access (admin/employee)
2. Frontend login page with role selection
3. Employee registration page with village/desa field (geocoded to lat/lng)
4. Admin dashboard: employee list, performance overview, map with pins per village
5. Employee dashboard: performance input form, own data table
6. Leaflet map component showing employee locations by village
