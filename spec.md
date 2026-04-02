# KinerjaKu

## Current State
Admin panel has 5 tabs: Dashboard, Data Pegawai, Data Kinerja, Rekap & Penilaian, Peta Lokasi.
- Data Pegawai: has Edit & Delete buttons working.
- Data Kinerja: shows all performance records in a table — NO delete/edit buttons.
- Rekap & Penilaian: shows per-employee accordion with records, rating/feedback form — NO delete/edit per record.

Backend has `deletePerformanceRecord(recordId)` but no `updatePerformanceRecord`.

## Requested Changes (Diff)

### Add
- Backend: `updatePerformanceRecord` function for admin to edit task, date, target, realisasi, score of a record (recalculate percentage).
- Frontend useQueries: `useUpdatePerformanceRecord` mutation hook.
- Data Kinerja tab: Aksi column with Edit (✏️) and Delete (🗑️) buttons per row.
- Rekap tab: Edit and Delete buttons per record row in expanded accordion.
- Edit dialog for performance record: form fields for date, task, target, realisasi, score.
- Delete confirmation dialog for performance records.

### Modify
- AdminPage.tsx: add delete/edit state and handlers for performance records.
- Data Kinerja table: add Aksi column.
- RekapPegawai component: add Edit/Delete buttons in record rows.

### Remove
- Nothing removed.

## Implementation Plan
1. Add `updatePerformanceRecord` to Motoko backend.
2. Update backend.d.ts with the new function signature.
3. Add `useUpdatePerformanceRecord` hook in useQueries.ts.
4. Update AdminPage.tsx:
   - Add state for deletingRecord and editingRecord.
   - Add Edit/Delete buttons in Data Kinerja tab.
   - Pass delete/edit handlers to RekapPegawai component.
   - Add Delete confirmation dialog for records.
   - Add Edit dialog for records (date, task, target, realisasi, score).
5. Update RekapPegawai to accept and use delete/edit handlers.
