# KinerjaKu

## Current State
Aplikasi dashboard kinerja pegawai dengan:
- Backend: PerformanceRecord (id, employeeId, employeeName, task, target, realisasi, percentage, score, date, fileBuktiUrl, createdAt)
- Admin panel dengan tab: Dashboard, Data Pegawai, Data Kinerja, Peta Lokasi
- Pegawai dapat input data kinerja sendiri

## Requested Changes (Diff)

### Add
- Field `adminFeedback: ?Text` dan `adminRating: ?Text` di PerformanceRecord (backend)
- Fungsi `updateRecordFeedback(recordId, adminFeedback, adminRating)` di backend (admin only)
- Tab baru "Rekap Pegawai" di AdminPage (frontend)
  - Rekap per pegawai: nama, total tugas, rata-rata persentase, nilai terbanyak
  - Expand per pegawai untuk lihat semua data kinerja
  - Kolom Feedback & Rating admin di tabel kinerja (form inline)
- Fungsi `getEmployeeRecapWithFeedback` di frontend untuk agregasi data per pegawai

### Modify
- backend.d.ts: tambah field adminFeedback/adminRating di PerformanceRecord interface, tambah updateRecordFeedback
- AdminPage: tambah tab "rekap" di navItems, tambah komponen RekapPegawai

### Remove
- Tidak ada

## Implementation Plan
1. Update main.mo: tambah field adminFeedback & adminRating optional di PerformanceRecord, fungsi updateRecordFeedback (admin only)
2. Update backend.d.ts sesuai perubahan
3. Update useQueries.ts: tambah hook useUpdateRecordFeedback
4. Update AdminPage.tsx: tambah tab Rekap dengan tabel rekap per pegawai + inline feedback form
