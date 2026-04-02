# KinerjaKu

## Current State
Aplikasi manajemen kinerja pegawai dengan fitur upload file bukti kinerja. Pegawai dapat upload file saat input data kinerja, dan admin bisa melihat di tab Dokumentasi. Namun upload file saat ini hanya menggunakan `ExternalBlob.fromBytes()` yang membuat `blob:` URL sementara di memori browser -- URL ini hilang setelah halaman di-refresh dan tidak bisa diakses oleh user/device lain. Akibatnya file tidak tersimpan permanen dan admin tidak bisa melihat dokumen.

## Requested Changes (Diff)

### Add
- Integrasi blob-storage Caffeine yang sesungguhnya untuk upload file permanen ke ICP canister
- Fungsi upload file menggunakan `uploadFile` dari hook blob-storage yang tersedia
- Di DashboardPage: upload file dulu sebelum save record, simpan URL permanen dari blob storage
- Di AdminPage: tampilan file bukti yang lebih baik -- tombol "Lihat File" yang membuka URL permanen
- Di DashboardPage (tabel kinerja pegawai): kolom Bukti juga menampilkan link dokumen yang bisa diklik

### Modify
- `DashboardPage.tsx`: Ganti logika upload dari `ExternalBlob.fromBytes()` + `getBytes()` menjadi menggunakan `uploadFile` dari blob-storage hook, simpan URL permanen
- `AdminPage.tsx`: Pastikan `ExternalBlob.fromURL(url).getDirectURL()` sudah benar untuk URL permanen dari blob storage, tambahkan tampilan nama file dan preview lebih baik

### Remove
- Penggunaan `blob:` URL sementara dari `URL.createObjectURL` untuk menyimpan file

## Implementation Plan
1. Pilih komponen `blob-storage`
2. Update `DashboardPage.tsx`: gunakan hook blob-storage untuk upload file, dapatkan URL permanen, simpan ke backend
3. Update `AdminPage.tsx`: pastikan tampilan dokumen menggunakan URL permanen dengan benar
4. Validasi dan build
