import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, ShieldCheck, User } from "lucide-react";
import { useEffect } from "react";
import { useActor } from "../hooks/useActor";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  UserRole,
  useCallerUserProfile,
  useCallerUserRole,
} from "../hooks/useQueries";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login, loginStatus, identity, isInitializing } =
    useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { data: profile, isLoading: profileLoading } = useCallerUserProfile();
  const { data: role, isLoading: roleLoading } = useCallerUserRole();

  const isLoggingIn = loginStatus === "logging-in";
  const isLoggedIn = !!identity;
  const isChecking = actorFetching || profileLoading || roleLoading;

  useEffect(() => {
    if (!isLoggedIn || isChecking) return;
    if (!profile) {
      navigate({ to: "/register" });
      return;
    }
    if (role === UserRole.admin) {
      navigate({ to: "/admin" });
    } else {
      navigate({ to: "/dashboard" });
    }
  }, [isLoggedIn, isChecking, profile, role, navigate]);

  if (isInitializing) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isLoggedIn && isChecking) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground text-sm">Memeriksa akun Anda...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.46_0.21_264)] to-[oklch(0.32_0.18_264)] flex flex-col">
      {/* Header */}
      <header className="bg-[oklch(0.28_0.15_264)] shadow-md px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center gap-3">
          <div className="bg-white rounded-lg p-1.5">
            <div className="w-6 h-6 bg-[oklch(0.46_0.21_264)] rounded flex items-center justify-center">
              <span className="text-white font-bold text-xs">K</span>
            </div>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            KinerjaKu
          </span>
          <span className="text-white/60 text-sm ml-2">
            Sistem Manajemen Kinerja Pegawai
          </span>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-3xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">
              Selamat Datang di KinerjaKu
            </h1>
            <p className="text-white/75 text-base">
              Silakan masuk sesuai peran Anda untuk melanjutkan
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6" data-ocid="login.section">
            {/* Admin Login */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[oklch(0.93_0.05_260)] flex items-center justify-center">
                  <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Login Admin</CardTitle>
                <CardDescription>
                  Akses panel administrasi dan kelola seluruh data pegawai
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  data-ocid="login.admin.button"
                  className="w-full bg-primary hover:bg-[oklch(0.38_0.18_264)] text-primary-foreground"
                  onClick={() => login()}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang
                      Masuk...
                    </>
                  ) : (
                    "Masuk sebagai Admin"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Employee Login */}
            <Card className="border-0 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <CardHeader className="text-center pb-4">
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-[oklch(0.93_0.05_260)] flex items-center justify-center">
                  <User className="w-8 h-8 text-primary" />
                </div>
                <CardTitle className="text-xl">Login Pegawai</CardTitle>
                <CardDescription>
                  Input data realisasi kinerja dan pantau progres Anda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  data-ocid="login.employee.button"
                  variant="outline"
                  className="w-full border-primary text-primary hover:bg-[oklch(0.93_0.05_260)]"
                  onClick={() => login()}
                  disabled={isLoggingIn}
                >
                  {isLoggingIn ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sedang
                      Masuk...
                    </>
                  ) : (
                    "Masuk sebagai Pegawai"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          <p className="text-center text-white/60 text-sm mt-8">
            Menggunakan Internet Identity untuk keamanan data Anda
          </p>
        </div>
      </main>

      <footer className="py-4 text-center text-white/50 text-xs">
        © {new Date().getFullYear()}. Dibangun dengan ❤️ menggunakan{" "}
        <a
          href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
          target="_blank"
          rel="noreferrer"
          className="underline hover:text-white/80"
        >
          caffeine.ai
        </a>
      </footer>
    </div>
  );
}
