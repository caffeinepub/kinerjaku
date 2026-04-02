import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import {
  BarChart2,
  LayoutDashboard,
  Loader2,
  LogOut,
  MapPin,
  Users,
} from "lucide-react";
import { useMemo, useState } from "react";
import LeafletMap from "../components/LeafletMap";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  UserRole,
  useAllEmployeeProfiles,
  useAllPerformanceRecords,
  useAllUserProfiles,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import type { EmployeeProfile } from "../hooks/useQueries";

type AdminTab = "dashboard" | "pegawai" | "kinerja" | "peta";

function StatCard({
  label,
  value,
  icon,
}: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="bg-white rounded-lg border border-border shadow-sm p-5 flex items-center gap-4">
      <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
        {icon}
      </div>
      <div>
        <p className="text-muted-foreground text-sm">{label}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
      </div>
    </div>
  );
}

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

export default function AdminPage() {
  const navigate = useNavigate();
  const { identity, clear } = useInternetIdentity();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<AdminTab>("dashboard");

  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const { data: employees, isLoading: empLoading } = useAllEmployeeProfiles();
  const { data: records, isLoading: recLoading } = useAllPerformanceRecords();
  const { data: userProfiles, isLoading: userProfilesLoading } =
    useAllUserProfiles();

  const mergedMapEmployees = useMemo<EmployeeProfile[]>(() => {
    const empMap = new Map<string, EmployeeProfile>();
    for (const emp of employees ?? []) {
      empMap.set(emp.id.toString(), emp);
    }
    for (const [principal, profile] of userProfiles ?? []) {
      const key = principal.toString();
      if (!empMap.has(key)) {
        empMap.set(key, {
          id: principal,
          name: profile.name,
          nip: profile.nip,
          desa: profile.desa,
          latitude: profile.latitude,
          longitude: profile.longitude,
          address: profile.address,
          role: UserRole.user,
          createdAt: 0n,
        });
      }
    }
    return Array.from(empMap.values());
  }, [employees, userProfiles]);

  if (!identity) {
    navigate({ to: "/" });
    return null;
  }

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAdmin === false) {
    navigate({ to: "/dashboard" });
    return null;
  }

  const handleLogout = () => {
    clear();
    qc.clear();
    navigate({ to: "/" });
  };

  const avgPercentage =
    records && records.length > 0
      ? (
          records.reduce((sum, r) => sum + r.percentage, 0) / records.length
        ).toFixed(1)
      : "0";

  const navItems: { id: AdminTab; label: string; icon: React.ReactNode }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      id: "pegawai",
      label: "Data Pegawai",
      icon: <Users className="h-4 w-4" />,
    },
    {
      id: "kinerja",
      label: "Data Kinerja",
      icon: <BarChart2 className="h-4 w-4" />,
    },
    { id: "peta", label: "Peta Lokasi", icon: <MapPin className="h-4 w-4" /> },
  ];

  return (
    <div className="min-h-screen bg-[oklch(0.96_0.01_240)] flex flex-col">
      {/* Header */}
      <header className="bg-primary shadow-md sticky top-0 z-20">
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
            <Badge className="bg-white/20 text-white text-xs border-0">
              Admin
            </Badge>
          </div>
          <Button
            variant="ghost"
            size="sm"
            data-ocid="admin.logout.button"
            onClick={handleLogout}
            className="text-primary-foreground hover:bg-white/20"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Keluar
          </Button>
        </div>
      </header>

      <div className="flex flex-1 max-w-7xl mx-auto w-full">
        {/* Sidebar */}
        <aside className="w-56 bg-sidebar border-r border-sidebar-border shrink-0 min-h-full hidden md:block">
          <nav className="p-3 space-y-1" data-ocid="admin.nav.section">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.id}
                data-ocid={`admin.nav.${item.id}.link`}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  activeTab === item.id
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile tab bar */}
        <div className="md:hidden w-full fixed bottom-0 left-0 bg-sidebar border-t border-sidebar-border z-20 flex">
          {navItems.map((item) => (
            <button
              type="button"
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex-1 flex flex-col items-center py-2 text-xs gap-1 ${
                activeTab === item.id
                  ? "text-white"
                  : "text-sidebar-foreground/60"
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <main className="flex-1 p-5 pb-20 md:pb-5 overflow-auto">
          {/* Dashboard Tab */}
          {activeTab === "dashboard" && (
            <div data-ocid="admin.dashboard.section">
              <h1 className="text-lg font-bold text-foreground mb-5">
                Ringkasan Dashboard
              </h1>
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard
                  label="Total Pegawai"
                  value={employees?.length ?? 0}
                  icon={<Users className="h-5 w-5" />}
                />
                <StatCard
                  label="Total Data Kinerja"
                  value={records?.length ?? 0}
                  icon={<BarChart2 className="h-5 w-5" />}
                />
                <StatCard
                  label="Rata-rata Kinerja"
                  value={`${avgPercentage}%`}
                  icon={<LayoutDashboard className="h-5 w-5" />}
                />
              </div>

              <div className="mt-6 bg-white rounded-lg border border-border shadow-sm p-5">
                <h2 className="font-semibold text-foreground mb-3">
                  5 Data Kinerja Terbaru
                </h2>
                {recLoading ? (
                  <div
                    className="flex items-center gap-2 py-4 text-muted-foreground"
                    data-ocid="admin.records.loading_state"
                  >
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Memuat...</span>
                  </div>
                ) : records && records.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs">Pegawai</TableHead>
                        <TableHead className="text-xs">Tugas</TableHead>
                        <TableHead className="text-xs">%</TableHead>
                        <TableHead className="text-xs">Nilai</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.slice(0, 5).map((rec, idx) => (
                        <TableRow
                          key={rec.id.toString()}
                          data-ocid={`admin.recent.item.${idx + 1}`}
                        >
                          <TableCell className="text-xs">
                            {rec.employeeName}
                          </TableCell>
                          <TableCell className="text-xs truncate max-w-[150px]">
                            {rec.task}
                          </TableCell>
                          <TableCell className="text-xs">
                            {rec.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell>{getScoreBadge(rec.score)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p
                    className="text-sm text-muted-foreground py-4"
                    data-ocid="admin.recent.empty_state"
                  >
                    Belum ada data kinerja
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Data Pegawai Tab */}
          {activeTab === "pegawai" && (
            <div data-ocid="admin.employees.section">
              <h1 className="text-lg font-bold text-foreground mb-5">
                Data Pegawai
              </h1>
              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                {empLoading ? (
                  <div
                    className="flex items-center justify-center py-12"
                    data-ocid="admin.employees.loading_state"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : employees && employees.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/30">
                        <TableHead className="text-xs font-semibold">
                          Nama
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          NIP
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Desa
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Role
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {employees.map((emp: EmployeeProfile, idx: number) => (
                        <TableRow
                          key={emp.id.toString()}
                          data-ocid={`admin.employees.item.${idx + 1}`}
                          className={idx % 2 === 0 ? "bg-white" : "bg-muted/20"}
                        >
                          <TableCell className="text-sm font-medium">
                            {emp.name}
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {emp.nip}
                          </TableCell>
                          <TableCell className="text-xs">{emp.desa}</TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className="text-xs capitalize"
                            >
                              {emp.role}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="admin.employees.empty_state"
                  >
                    <p className="text-sm">Belum ada data pegawai</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Data Kinerja Tab */}
          {activeTab === "kinerja" && (
            <div data-ocid="admin.kinerja.section">
              <h1 className="text-lg font-bold text-foreground mb-5">
                Data Kinerja Seluruh Pegawai
              </h1>
              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                {recLoading ? (
                  <div
                    className="flex items-center justify-center py-12"
                    data-ocid="admin.kinerja.loading_state"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : records && records.length > 0 ? (
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
                          Target
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Realisasi
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          %
                        </TableHead>
                        <TableHead className="text-xs font-semibold">
                          Nilai
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {records.map((rec, idx) => (
                        <TableRow
                          key={rec.id.toString()}
                          data-ocid={`admin.kinerja.item.${idx + 1}`}
                          className={idx % 2 === 0 ? "bg-white" : "bg-muted/20"}
                        >
                          <TableCell className="text-xs">
                            <div className="font-medium">{rec.date}</div>
                            <div className="text-muted-foreground">
                              {rec.employeeName}
                            </div>
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px] truncate">
                            {rec.task}
                          </TableCell>
                          <TableCell className="text-xs">
                            {rec.target.toString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            {rec.realisasi.toString()}
                          </TableCell>
                          <TableCell className="text-xs">
                            {rec.percentage.toFixed(1)}%
                          </TableCell>
                          <TableCell>{getScoreBadge(rec.score)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div
                    className="text-center py-12 text-muted-foreground"
                    data-ocid="admin.kinerja.empty_state"
                  >
                    <p className="text-sm">Belum ada data kinerja</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Peta Lokasi Tab */}
          {activeTab === "peta" && (
            <div data-ocid="admin.peta.section">
              <h1 className="text-lg font-bold text-foreground mb-5">
                Peta Lokasi Pegawai
              </h1>
              <div className="bg-white rounded-lg border border-border shadow-sm overflow-hidden">
                {empLoading || userProfilesLoading ? (
                  <div
                    className="flex items-center justify-center"
                    style={{ height: 500 }}
                    data-ocid="admin.peta.loading_state"
                  >
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="ml-2 text-muted-foreground text-sm">
                      Memuat data peta...
                    </span>
                  </div>
                ) : (
                  <LeafletMap employees={mergedMapEmployees} />
                )}
              </div>
            </div>
          )}
        </main>
      </div>

      <footer className="py-3 text-center text-muted-foreground text-xs border-t border-border bg-white">
        © {new Date().getFullYear()}. Dibangun dengan ❤️ menggunakan{" "}
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
