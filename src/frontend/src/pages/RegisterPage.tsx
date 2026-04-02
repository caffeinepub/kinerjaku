import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import { Loader2, MapPin } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

async function geocodeDesa(
  desa: string,
  kecamatan: string,
  kabupaten: string,
): Promise<{ lat: number; lng: number } | null> {
  try {
    const query = [desa, kecamatan, kabupaten, "Indonesia"]
      .filter(Boolean)
      .join(", ");
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "Accept-Language": "id" } });
    const data = await res.json();
    if (data && data.length > 0) {
      return {
        lat: Number.parseFloat(data[0].lat),
        lng: Number.parseFloat(data[0].lon),
      };
    }
    return null;
  } catch {
    return null;
  }
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const { identity } = useInternetIdentity();
  const saveProfile = useSaveCallerUserProfile();

  const [form, setForm] = useState({
    nama: "",
    nip: "",
    desa: "",
    kecamatan: "",
    kabupaten: "",
    alamat: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!identity) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Anda belum login.</p>
          <Button onClick={() => navigate({ to: "/" })}>
            Ke Halaman Login
          </Button>
        </div>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nama || !form.nip || !form.desa) {
      toast.error("Nama, NIP, dan Desa wajib diisi");
      return;
    }
    setIsSubmitting(true);
    try {
      const coords = await geocodeDesa(
        form.desa,
        form.kecamatan,
        form.kabupaten,
      );
      const fullAddress = [
        form.alamat,
        form.desa,
        form.kecamatan,
        form.kabupaten,
      ]
        .filter(Boolean)
        .join(", ");

      await saveProfile.mutateAsync({
        name: form.nama,
        nip: form.nip,
        desa: form.desa,
        kecamatan: form.kecamatan,
        address: fullAddress,
        latitude: coords?.lat ?? 0,
        longitude: coords?.lng ?? 0,
      });

      toast.success("Profil berhasil disimpan!");
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(`Gagal menyimpan profil: ${String(err)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-primary shadow-md">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center gap-3">
          <div className="bg-white rounded-lg p-1.5">
            <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-xs">
                K
              </span>
            </div>
          </div>
          <span className="text-primary-foreground font-bold text-xl">
            KinerjaKu
          </span>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-10">
        <Card className="shadow-lg border-border">
          <CardHeader className="border-b border-border pb-4">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              <CardTitle className="text-lg text-foreground">
                Pendaftaran Profil Pegawai
              </CardTitle>
            </div>
            <CardDescription>
              Lengkapi data diri Anda. Lokasi desa akan otomatis ditandai di
              peta.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
              data-ocid="register.section"
            >
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="nama">
                    Nama Lengkap <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nama"
                    data-ocid="register.input"
                    value={form.nama}
                    onChange={(e) => handleChange("nama", e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="nip">
                    NIP <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="nip"
                    data-ocid="register.nip.input"
                    value={form.nip}
                    onChange={(e) => handleChange("nip", e.target.value)}
                    placeholder="Nomor Induk Pegawai"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="desa">
                    Desa/Kelurahan <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="desa"
                    data-ocid="register.desa.input"
                    value={form.desa}
                    onChange={(e) => handleChange("desa", e.target.value)}
                    placeholder="Nama desa atau kelurahan"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kecamatan">Kecamatan</Label>
                  <Input
                    id="kecamatan"
                    data-ocid="register.kecamatan.input"
                    value={form.kecamatan}
                    onChange={(e) => handleChange("kecamatan", e.target.value)}
                    placeholder="Nama kecamatan"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="kabupaten">Kabupaten/Kota</Label>
                  <Input
                    id="kabupaten"
                    data-ocid="register.kabupaten.input"
                    value={form.kabupaten}
                    onChange={(e) => handleChange("kabupaten", e.target.value)}
                    placeholder="Nama kabupaten atau kota"
                  />
                </div>

                <div className="sm:col-span-2 space-y-1.5">
                  <Label htmlFor="alamat">Alamat Lengkap</Label>
                  <Input
                    id="alamat"
                    data-ocid="register.alamat.input"
                    value={form.alamat}
                    onChange={(e) => handleChange("alamat", e.target.value)}
                    placeholder="Jalan, nomor rumah, RT/RW"
                  />
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  data-ocid="register.submit_button"
                  className="w-full bg-primary hover:bg-[oklch(0.38_0.18_264)] text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Menyimpan...
                    </>
                  ) : (
                    "Simpan Profil"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
