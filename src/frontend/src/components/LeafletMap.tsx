import { useEffect, useRef } from "react";
import type { EmployeeProfile } from "../hooks/useQueries";

interface LeafletMapProps {
  employees: EmployeeProfile[];
}

declare global {
  interface Window {
    // biome-ignore lint/suspicious/noExplicitAny: Leaflet global
    L: any;
  }
}

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

function clearMarkers(
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet instance
  L: any,
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet map instance
  map: any,
) {
  map.eachLayer((layer: any) => {
    if (layer instanceof L.Marker) {
      map.removeLayer(layer);
    }
  });
}

function addMarkers(
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet instance
  L: any,
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet map instance
  map: any,
  employees: EmployeeProfile[],
) {
  const valid = employees.filter((e) => e.latitude !== 0 || e.longitude !== 0);
  for (const emp of valid) {
    const marker = L.marker([emp.latitude, emp.longitude]);
    marker.bindPopup(`
      <div style="min-width:180px">
        <strong style="color:#1a56db;font-size:14px">${emp.name}</strong><br/>
        <span style="color:#666;font-size:12px">NIP: ${emp.nip}</span><br/>
        <span style="font-size:12px">&#128205; ${emp.desa}</span><br/>
        <span style="color:#666;font-size:11px">${emp.address}</span>
      </div>
    `);
    marker.addTo(map);
  }
  return valid.length;
}

export default function LeafletMap({ employees }: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  // biome-ignore lint/suspicious/noExplicitAny: Leaflet map instance
  const mapInstanceRef = useRef<any>(null);
  const employeesRef = useRef(employees);
  employeesRef.current = employees;

  const hasCoords = employees.some(
    (e) => e.latitude !== 0 || e.longitude !== 0,
  );

  // Initialize map once
  useEffect(() => {
    loadLeaflet().then(() => {
      if (!mapRef.current || mapInstanceRef.current) return;

      const L = window.L;
      L.Icon.Default.prototype._getIconUrl = undefined;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(mapRef.current).setView([-2.5, 118.0], 5);
      mapInstanceRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 18,
      }).addTo(map);

      addMarkers(L, map, employeesRef.current);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // biome-ignore lint/correctness/useExhaustiveDependencies: intentional init-only

  // Update markers when employees change
  useEffect(() => {
    if (!mapInstanceRef.current || !window.L) return;
    const L = window.L;
    const map = mapInstanceRef.current;
    clearMarkers(L, map);
    addMarkers(L, map, employees);
  }, [employees]);

  return (
    <div>
      <div
        ref={mapRef}
        style={{ height: 500, width: "100%" }}
        data-ocid="admin.peta.canvas_target"
      />
      {!hasCoords && (
        <div
          className="text-center py-4 text-muted-foreground text-sm border-t border-border"
          data-ocid="admin.peta.empty_state"
        >
          Belum ada pegawai dengan data lokasi. Pastikan pegawai telah mendaftar
          dengan data desa yang valid.
        </div>
      )}
    </div>
  );
}
