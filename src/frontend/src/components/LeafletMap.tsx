import { useState } from "react";
import { useEffect, useRef } from "react";
import type { EmployeeProfile } from "../hooks/useQueries";

interface LeafletMapProps {
  employees: EmployeeProfile[];
}

declare global {
  interface Window {
    L: any;
  }
}

const MARKER_COLORS = [
  "#1d4ed8",
  "#dc2626",
  "#16a34a",
  "#d97706",
  "#7c3aed",
  "#0891b2",
  "#be185d",
  "#65a30d",
];

function loadLeaflet(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.L) {
      resolve();
      return;
    }
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
    document.head.appendChild(link);

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => resolve();
    script.onerror = reject;
    document.head.appendChild(script);
  });
}

function clearMarkers(L: any, map: any) {
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

function makeDivIcon(color: string, L: any, opacity = 1) {
  return L.divIcon({
    className: "",
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" opacity="${opacity}"><path d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z" fill="${color}"/><circle cx="14" cy="14" r="6" fill="white"/></svg>`,
    iconSize: [28, 36],
    iconAnchor: [14, 36],
    popupAnchor: [0, -36],
  });
}

function addMarkersToMap(
  L: any,
  map: any,
  employees: EmployeeProfile[],
  selectedKecamatan: string,
  kecamatanColorMap: Map<string, string>,
  geocodedCoords: Map<string, { lat: number; lng: number }>,
) {
  const filtered =
    selectedKecamatan === "__all__"
      ? employees
      : employees.filter((e) => (e.kecamatan || e.desa) === selectedKecamatan);

  const markersWithCoords: { lat: number; lng: number }[] = [];

  for (const emp of filtered) {
    let lat = emp.latitude;
    let lng = emp.longitude;
    let isGeocoded = false;
    const geocodeKey = emp.kecamatan || emp.desa;

    if (lat === 0 && lng === 0 && geocodeKey) {
      const gc = geocodedCoords.get(geocodeKey);
      if (gc) {
        lat = gc.lat;
        lng = gc.lng;
        isGeocoded = true;
      } else {
        continue;
      }
    } else if (lat === 0 && lng === 0) {
      continue;
    }

    const kecamatanKey = emp.kecamatan || emp.desa;
    const color = kecamatanColorMap.get(kecamatanKey) ?? MARKER_COLORS[0];
    const icon = makeDivIcon(color, L, isGeocoded ? 0.65 : 1);
    const marker = L.marker([lat, lng], { icon });
    const geocodeNote = isGeocoded
      ? `<div style="color:#d97706;font-size:10px;margin-top:4px">📍 Lokasi perkiraan berdasarkan kecamatan</div>`
      : "";
    const kecamatanInfo = emp.kecamatan
      ? `<span style="color:#6b7280;font-size:11px;margin-top:2px;display:block">Kecamatan: ${emp.kecamatan}</span>`
      : "";
    const desaInfo = emp.desa
      ? `<span style="color:#6b7280;font-size:11px;display:block">Desa: ${emp.desa}</span>`
      : "";
    marker.bindPopup(`
      <div style="min-width:200px;font-family:sans-serif">
        <div style="background:${color};color:#fff;padding:6px 10px;border-radius:6px 6px 0 0;margin:-8px -8px 8px -8px">
          <strong style="font-size:13px">&#128205; ${emp.kecamatan || emp.desa}</strong>
        </div>
        <strong style="color:#1f2937;font-size:14px">${emp.name}</strong><br/>
        <span style="color:#6b7280;font-size:12px">NIP: ${emp.nip}</span><br/>
        ${kecamatanInfo}
        ${desaInfo}
        <span style="color:#6b7280;font-size:11px;margin-top:4px;display:block">${emp.address}</span>
        ${geocodeNote}
      </div>
    `);
    marker.addTo(map);
    markersWithCoords.push({ lat, lng });
  }

  if (markersWithCoords.length > 0) {
    if (selectedKecamatan !== "__all__" || markersWithCoords.length <= 3) {
      const bounds = L.latLngBounds(
        markersWithCoords.map((c) => [c.lat, c.lng]),
      );
      map.fitBounds(bounds, { maxZoom: 14, padding: [50, 50] });
    }
  }

  return markersWithCoords.length;
}

export default function LeafletMap({ employees }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const geocachRef = useRef<Map<string, { lat: number; lng: number } | null>>(
    new Map(),
  );
  const [selectedKecamatan, setSelectedKecamatan] = useState("__all__");
  const [leafletReady, setLeafletReady] = useState(false);
  const [geocodedCoords, setGeocodedCoords] = useState<
    Map<string, { lat: number; lng: number }>
  >(new Map());

  // Use kecamatan as primary grouping; fall back to desa
  const uniqueKecamatans = Array.from(
    new Set(employees.map((e) => e.kecamatan || e.desa).filter(Boolean)),
  ).sort();
  const kecamatanColorMap = new Map<string, string>();
  uniqueKecamatans.forEach((kec, i) => {
    kecamatanColorMap.set(kec, MARKER_COLORS[i % MARKER_COLORS.length]);
  });

  // Geocode employees with lat/lng = 0 using kecamatan (more reliable)
  useEffect(() => {
    const keysToGeocode = employees
      .filter(
        (e) =>
          e.latitude === 0 &&
          e.longitude === 0 &&
          (e.kecamatan || e.desa) &&
          !geocachRef.current.has(e.kecamatan || e.desa),
      )
      .map((e) => e.kecamatan || e.desa)
      .filter((key, idx, arr) => arr.indexOf(key) === idx);

    if (keysToGeocode.length === 0) return;

    for (const key of keysToGeocode) {
      geocachRef.current.set(key, null);
    }

    const fetchGeocode = async (key: string) => {
      try {
        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(`${key}, Indonesia`)}&format=json&limit=1`;
        const res = await fetch(url, {
          headers: { "Accept-Language": "id" },
        });
        const data = await res.json();
        if (data && data.length > 0) {
          const coords = {
            lat: Number.parseFloat(data[0].lat),
            lng: Number.parseFloat(data[0].lon),
          };
          geocachRef.current.set(key, coords);
          setGeocodedCoords((prev) => {
            const next = new Map(prev);
            next.set(key, coords);
            return next;
          });
        }
      } catch {
        // silently fail
      }
    };

    keysToGeocode.forEach((key, i) => {
      setTimeout(() => fetchGeocode(key), i * 1100);
    });
  }, [employees]);

  const totalWithCoords = employees.filter((e) => {
    if (e.latitude !== 0 || e.longitude !== 0) return true;
    const key = e.kecamatan || e.desa;
    return key && geocodedCoords.has(key);
  }).length;

  const filteredCount =
    selectedKecamatan === "__all__"
      ? totalWithCoords
      : employees.filter((e) => {
          if ((e.kecamatan || e.desa) !== selectedKecamatan) return false;
          if (e.latitude !== 0 || e.longitude !== 0) return true;
          const key = e.kecamatan || e.desa;
          return key && geocodedCoords.has(key);
        }).length;

  useEffect(() => {
    loadLeaflet().then(() => {
      if (!mapRef.current || mapInstanceRef.current) return;
      const L = window.L;
      const map = L.map(mapRef.current).setView([-2.5, 118.0], 5);
      mapInstanceRef.current = map;
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);
      setLeafletReady(true);
    });
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: kecamatanColorMap is derived, not stable ref
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L || !leafletReady) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    clearMarkers(L, map);
    addMarkersToMap(
      L,
      map,
      employees,
      selectedKecamatan,
      kecamatanColorMap,
      geocodedCoords,
    );
  }, [employees, selectedKecamatan, leafletReady, geocodedCoords]);

  const geocodedKecamatanCount = geocodedCoords.size;

  return (
    <div>
      <div className="flex items-center gap-3 p-3 border-b border-border bg-muted/20">
        <label
          htmlFor="kecamatan-filter"
          className="text-sm font-medium text-foreground whitespace-nowrap"
        >
          Filter Kecamatan:
        </label>
        <select
          id="kecamatan-filter"
          data-ocid="admin.peta.select"
          className="flex-1 max-w-xs text-sm border border-border rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-primary/40"
          value={selectedKecamatan}
          onChange={(e) => setSelectedKecamatan(e.target.value)}
        >
          <option value="__all__">Semua Kecamatan</option>
          {uniqueKecamatans.map((kec) => (
            <option key={kec} value={kec}>
              {kec}
            </option>
          ))}
        </select>
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {filteredCount} titik
        </span>
      </div>

      {geocodedKecamatanCount > 0 && (
        <div className="px-3 py-2 bg-amber-50 border-b border-amber-200 text-xs text-amber-700 flex items-center gap-1.5">
          <span>⚠️</span>
          <span>
            {geocodedKecamatanCount} kecamatan menggunakan lokasi perkiraan
            (titik semi-transparan) — pegawai tidak mengisi koordinat GPS saat
            registrasi.
          </span>
        </div>
      )}

      <div
        ref={mapRef}
        style={{ height: 480, width: "100%" }}
        data-ocid="admin.peta.canvas_target"
      />

      {uniqueKecamatans.length > 0 && (
        <div className="p-3 border-t border-border bg-muted/10 flex flex-wrap gap-3 items-center">
          <span className="text-xs font-semibold text-muted-foreground mr-1">
            Legenda Kecamatan:
          </span>
          {uniqueKecamatans.map((kec) => (
            <div key={kec} className="flex items-center gap-1.5">
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: kecamatanColorMap.get(kec),
                }}
              />
              <span className="text-xs text-foreground">{kec}</span>
              <span className="text-xs text-muted-foreground">
                (
                {
                  employees.filter((e) => (e.kecamatan || e.desa) === kec)
                    .length
                }
                )
              </span>
            </div>
          ))}
        </div>
      )}

      {totalWithCoords === 0 && employees.length > 0 && (
        <div
          className="text-center py-4 text-muted-foreground text-sm border-t border-border"
          data-ocid="admin.peta.loading_state"
        >
          Sedang mengambil koordinat kecamatan dari server peta...
        </div>
      )}

      {employees.length === 0 && (
        <div
          className="text-center py-4 text-muted-foreground text-sm border-t border-border"
          data-ocid="admin.peta.empty_state"
        >
          Belum ada pegawai yang terdaftar.
        </div>
      )}
    </div>
  );
}
