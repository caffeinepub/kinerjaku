import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { FileDown, Loader2, LogOut, RefreshCw, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { clearActorCache } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCallerUserProfile,
  useCreatePerformanceRecord,
  useDeletePerformanceRecord,
  usePerformanceRecordsByEmployee,
} from "../hooks/useQueries";
import { downloadRecapPdf } from "../utils/pdfRecap";

function getScoreBadge(score: string) {
  if (score === "Baik")
    return (
      <Badge className="bg-[oklch(0.65_0.18_145)] text-white">{score}</Badge>
    );
  if (score === "Cukup")
    return (
      <Badge className="bg-[oklch(0.7_0.19_55)] text-white">{score}</Badge>
    );
  return (
    <Badge className="bg-destructive text-destructive-foreground">
      {score}
    </Badge>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { identity, clear } = useInternetIdentity();
  const qc = useQueryClient();

  const { data: profile, isLoading: profileLoading } = useCallerUserProfile();
  const principal = identity?.getPrincipal() ?? null;
  const {
    data: records,
    isLoading: recordsLoading,
    refetch,
  } = usePerformanceRecordsByEmployee(principal);
  const createRecord = useCreatePerformanceRecord();
  const deleteRecord = useDeletePerformanceRecord();

  const [form, setForm] = useState({
    namaPegawai: "",
    tugas: "",
    target: "",
    realisasi: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!identity) {
    navigate({ to: "/" });
    return null;
  }

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const displayName = profile?.name || "Pegawai";

  // Pre-fill form with profile name
  if (profile && !form.namaPegawai) {
    setForm((prev) => ({ ...prev, namaPegawai: profile.name }));
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.tugas || !form.target || !form.realisasi) {
      toast.error("Semua field wajib diisi");
      return;
    }
    const targetNum = Number.parseInt(form.target);
    const realisasiNum = Number.parseInt(form.realisasi);
    if (
      Number.isNaN(targetNum) ||
      Number.isNaN(realisasiNum) ||
      targetNum <= 0
    ) {
      toast.error("Target dan Realisasi harus berupa angka valid");
      return;
    }

    setIsSubmitting(true);
    try {
      const percentage = (realisasiNum / targetNum) * 100;
      const score =
        percentage >= 80 ? "Baik" : percentage >= 60 ? "Cukup" : "Kurang";
      const today = new Date().toISOString().split("T")[0];

      await createRecord.mutateAsync({
        employeeName: form.namaPegawai || displayName,
        task: form.tugas,
        target: BigInt(targetNum),
        realisasi: BigInt(realisasiNum),
        score,
        date: today,
        employeeId: identity.getPrincipal(),
      });

      toast.success("Data kinerja berhasil disimpan!");
      setForm((prev) => ({ ...prev, tugas: "", target: "", realisasi: "" }));
      refetch();
    } catch (err) {
      toast.error(`Gagal menyimpan: ${String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteRecord.mutateAsync(id);
      toast.success("Data berhasil dihapus");
      refetch();
    } catch (err) {
      toast.error(`Gagal menghapus: ${String(err)}`);
    }
  };

  const handleLogout = () => {
    clearActorCache();
    clear();
    qc.clear();
    navigate({ to: "/" });
  };

  const handleDownloadPdf = () => {
    if (!records || records.length === 0) return;
    downloadRecapPdf({
      employeeName: profile?.name ?? displayName,
      nip: profile?.nip ?? "",
      desa: profile?.desa ?? "",
      address: profile?.address ?? "",
      records: records.map((r) => ({
        date: r.date,
        task: r.task,
        target: r.target,
        realisasi: r.realisasi,
        percentage: r.percentage,
        score: r.score,
        adminRating: r.adminRating ?? undefined,
        adminFeedback: r.adminFeedback ?? undefined,
      })),
    });
  };

  return (
    <div className="min-h-screen bg-[oklch(0.96_0.01_240)] flex flex-col">
      {/* Header */}
      <header className="bg-primary shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-1.5">
              <div className="w-5 h-5 bg-primary rounded flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-xs">
                  K
                </span>
              </div>
            </div>
            <span className="text-primary-foreground font-bold text-lg">
              KinerjaKu
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-primary-foreground/80 text-sm hidden sm:block">
              Halo, {displayName}
            </span>
            <Button
              variant="ghost"
              size="sm"
              data-ocid="dashboard.logout.button"
              onClick={handleLogout}
              className="text-primary-foreground hover:bg-white/20"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Keluar
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Left Panel - Input Realisasi */}
          <div
            className="bg-white rounded-lg shadow-sm border border-border"
            data-ocid="dashboard.panel"
          >
            <div className="bg-primary/5 border-b border-border px-5 py-3 rounded-t-lg">
              <h2 className="font-semibold text-foreground">Input Realisasi</h2>
            </div>
            <form
              onSubmit={handleSubmit}
              className="p-5 space-y-4"
              data-ocid="performance.section"
            >
              <div className="space-y-1.5">
                <Label htmlFor="namaPegawai">Nama Pegawai</Label>
                <Input
                  id="namaPegawai"
                  data-ocid="performance.input"
                  value={form.namaPegawai}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, namaPegawai: e.target.value }))
                  }
                  placeholder="Nama pegawai"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tugas">Tugas / Indikator</Label>
                <Textarea
                  id="tugas"
                  data-ocid="performance.tugas.textarea"
                  value={form.tugas}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, tugas: e.target.value }))
                  }
                  placeholder="Deskripsi tugas atau indikator kinerja"
                  rows={3}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="target">Target</Label>
                  <Input
                    id="target"
                    type="number"
                    data-ocid="performance.target.input"
                    value={form.target}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, target: e.target.value }))
                    }
                    placeholder="Angka target"
                    min="1"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="realisasi">Realisasi</Label>
                  <Input
                    id="realisasi"
                    type="number"
                    data-ocid="performance.realisasi.input"
                    value={form.realisasi}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, realisasi: e.target.value }))
                    }
                    placeholder="Angka realisasi"
                    min="0"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                data-ocid="performance.submit_button"
                className="w-full bg-primary hover:bg-[oklch(0.38_0.18_264)] text-primary-foreground"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Menyimpan...
                  </>
                ) : (
                  "Simpan Data"
                )}
              </Button>
            </form>
          </div>

          {/* Right Panel - Data Kinerja */}
          <div
            className="bg-white rounded-lg shadow-sm border border-border"
            data-ocid="dashboard.records.panel"
          >
            <div className="bg-primary/5 border-b border-border px-5 py-3 rounded-t-lg flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Data Kinerja</h2>
              <div className="flex items-center gap-2">
                {records && records.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    data-ocid="dashboard.download.button"
                    onClick={handleDownloadPdf}
                    className="text-primary border-primary hover:bg-primary/10"
                  >
                    <FileDown className="h-3.5 w-3.5 mr-1" />
                    PDF
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  data-ocid="dashboard.refresh.button"
                  onClick={() => refetch()}
                  className="text-primary border-primary hover:bg-primary/10"
                >
                  <RefreshCw className="h-3.5 w-3.5 mr-1" />
                  Refresh
                </Button>
              </div>
            </div>

            <div className="overflow-auto">
              {recordsLoading ? (
                <div
                  className="flex items-center justify-center py-12"
                  data-ocid="records.loading_state"
                >
                  <Loader2 className="h-6 w-6 animate-spin text-primary mr-2" />
                  <span className="text-muted-foreground text-sm">
                    Memuat data...
                  </span>
                </div>
              ) : !records || records.length === 0 ? (
                <div
                  className="text-center py-12 text-muted-foreground"
                  data-ocid="records.empty_state"
                >
                  <p className="text-sm">Belum ada data kinerja</p>
                  <p className="text-xs mt-1">
                    Tambahkan data realisasi di form kiri
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs font-semibold">
                        Tgl & Nama
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Tugas
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Persentase
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Nilai
                      </TableHead>
                      <TableHead className="text-xs font-semibold">
                        Aksi
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((rec, idx) => (
                      <TableRow
                        key={rec.id.toString()}
                        data-ocid={`records.item.${idx + 1}`}
                        className={idx % 2 === 0 ? "bg-white" : "bg-muted/20"}
                      >
                        <TableCell className="text-xs">
                          <div className="font-medium">{rec.date}</div>
                          <div className="text-muted-foreground">
                            {rec.employeeName}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs max-w-[120px] truncate">
                          {rec.task}
                        </TableCell>
                        <TableCell className="text-xs">
                          {rec.percentage.toFixed(1)}%
                        </TableCell>
                        <TableCell>{getScoreBadge(rec.score)}</TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            data-ocid={`records.delete_button.${idx + 1}`}
                            onClick={() => handleDelete(rec.id)}
                            className="h-7 w-7 text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
      </main>

      <footer className="py-3 text-center text-muted-foreground text-xs border-t border-border bg-white">
        &copy; {new Date().getFullYear()}. Dibangun dengan ❤️ menggunakan{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-primary"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
