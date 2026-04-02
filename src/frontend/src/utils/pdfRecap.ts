export function downloadRecapPdf(params: {
  employeeName: string;
  nip: string;
  desa: string;
  address: string;
  records: Array<{
    date: string;
    task: string;
    target: bigint;
    realisasi: bigint;
    percentage: number;
    score: string;
    adminRating?: string;
    adminFeedback?: string;
  }>;
}): void {
  const { employeeName, nip, desa, address, records } = params;
  const printDate = new Date().toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  const totalTasks = records.length;
  const avgPercentage =
    totalTasks > 0
      ? (records.reduce((s, r) => s + r.percentage, 0) / totalTasks).toFixed(1)
      : "0";

  const scoreCount: Record<string, number> = {};
  for (const r of records) scoreCount[r.score] = (scoreCount[r.score] ?? 0) + 1;
  const dominantScore =
    totalTasks > 0
      ? Object.entries(scoreCount).sort((a, b) => b[1] - a[1])[0][0]
      : "-";

  const scoreColor = (score: string) => {
    if (score === "Baik") return "#16a34a";
    if (score === "Cukup") return "#d97706";
    return "#dc2626";
  };

  const ratingColor = (rating: string) => {
    if (rating === "Sangat Baik") return "#15803d";
    if (rating === "Baik") return "#16a34a";
    if (rating === "Cukup") return "#d97706";
    if (rating === "Perlu Perbaikan") return "#dc2626";
    return "#6b7280";
  };

  const tableRows = records
    .map(
      (rec, idx) => `
    <tr style="background:${idx % 2 === 0 ? "#fff" : "#f9fafb"}">
      <td style="padding:8px 12px;text-align:center;border:1px solid #e5e7eb">${idx + 1}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb">${rec.date}</td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;max-width:200px">${rec.task}</td>
      <td style="padding:8px 12px;text-align:right;border:1px solid #e5e7eb">${rec.target.toString()}</td>
      <td style="padding:8px 12px;text-align:right;border:1px solid #e5e7eb">${rec.realisasi.toString()}</td>
      <td style="padding:8px 12px;text-align:right;border:1px solid #e5e7eb">${rec.percentage.toFixed(1)}%</td>
      <td style="padding:8px 12px;text-align:center;border:1px solid #e5e7eb">
        <span style="background:${scoreColor(rec.score)};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">${rec.score}</span>
      </td>
      <td style="padding:8px 12px;text-align:center;border:1px solid #e5e7eb">
        ${rec.adminRating ? `<span style="background:${ratingColor(rec.adminRating)};color:#fff;padding:2px 8px;border-radius:4px;font-size:11px">${rec.adminRating}</span>` : "<span style='color:#9ca3af'>-</span>"}
      </td>
      <td style="padding:8px 12px;border:1px solid #e5e7eb;font-size:12px;color:#374151">${rec.adminFeedback || "-"}</td>
    </tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Rekapitulasi Kinerja - ${employeeName}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1f2937; background: #fff; padding: 32px; }
    .header { display: flex; align-items: center; gap: 16px; padding-bottom: 20px; border-bottom: 3px solid #1d4ed8; margin-bottom: 24px; }
    .logo { width: 48px; height: 48px; background: #1d4ed8; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 22px; font-weight: 900; flex-shrink: 0; }
    .header-text h1 { font-size: 20px; font-weight: 700; color: #1d4ed8; }
    .header-text p { font-size: 13px; color: #6b7280; margin-top: 2px; }
    .info-box { background: #f0f4ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 16px 20px; margin-bottom: 24px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .info-item label { font-size: 11px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.05em; font-weight: 600; }
    .info-item p { font-size: 14px; color: #1f2937; font-weight: 500; margin-top: 2px; }
    .stats-row { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 14px 16px; text-align: center; }
    .stat-card .num { font-size: 24px; font-weight: 800; color: #1d4ed8; }
    .stat-card .lbl { font-size: 11px; color: #6b7280; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead tr { background: #1d4ed8; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-weight: 600; border: 1px solid #1d4ed8; }
    .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e7eb; text-align: center; font-size: 11px; color: #9ca3af; }
    @media print {
      body { padding: 16px; }
      @page { size: A4; margin: 1.5cm; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">K</div>
    <div class="header-text">
      <h1>KinerjaKu</h1>
      <p>Rekapitulasi Kinerja Pegawai</p>
    </div>
  </div>

  <div class="info-box">
    <div class="info-grid">
      <div class="info-item"><label>Nama Pegawai</label><p>${employeeName}</p></div>
      <div class="info-item"><label>NIP</label><p>${nip || "-"}</p></div>
      <div class="info-item"><label>Desa / Kecamatan</label><p>${desa || "-"}</p></div>
      <div class="info-item"><label>Alamat</label><p>${address || "-"}</p></div>
      <div class="info-item"><label>Tanggal Cetak</label><p>${printDate}</p></div>
    </div>
  </div>

  <div class="stats-row">
    <div class="stat-card"><div class="num">${totalTasks}</div><div class="lbl">Total Tugas</div></div>
    <div class="stat-card"><div class="num">${avgPercentage}%</div><div class="lbl">Rata-rata Persentase</div></div>
    <div class="stat-card"><div class="num" style="font-size:18px;color:${scoreColor(dominantScore)}">${dominantScore}</div><div class="lbl">Nilai Dominan</div></div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:center;width:36px">No</th>
        <th>Tanggal</th>
        <th>Tugas / Indikator</th>
        <th style="text-align:right">Target</th>
        <th style="text-align:right">Realisasi</th>
        <th style="text-align:right">%</th>
        <th style="text-align:center">Nilai</th>
        <th style="text-align:center">Rating Admin</th>
        <th>Feedback Admin</th>
      </tr>
    </thead>
    <tbody>
      ${tableRows}
    </tbody>
  </table>

  <div class="footer">
    Dicetak pada ${printDate} &mdash; KinerjaKu &bull; Sistem Informasi Kinerja Pegawai
  </div>

  <script>window.onload = function() { window.print(); }<\/script>
</body>
</html>`;

  const newWindow = window.open("", "_blank");
  if (!newWindow) {
    alert("Popup diblokir. Harap izinkan popup untuk mengunduh PDF.");
    return;
  }
  newWindow.document.write(html);
  newWindow.document.close();
}
