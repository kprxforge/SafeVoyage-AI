import React, { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, Circle, Polyline, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useApp } from "../context/AppContext";
import { Navigation, ShieldCheck, Crosshair, ChevronUp, ChevronDown, PhoneCall } from "lucide-react";
import { cn } from "../lib/utils";
import { SafeNavigationHandler } from "../components/SafeNavigationHandler";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const userSvgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">
  <circle cx="16" cy="16" r="14" fill="#6366f1" fill-opacity="0.25" />
  <circle cx="16" cy="16" r="7" fill="#6366f1" stroke="#ffffff" stroke-width="2.5" />
</svg>
`;

const safeHubSvgIcon = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="28" height="28">
  <circle cx="16" cy="16" r="12" fill="#10b981" stroke="#ffffff" stroke-width="2" />
  <path d="M12 16.5l2.5 2.5 5.5-5.5" stroke="#ffffff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
`;

const userIcon = new L.DivIcon({
  html: userSvgIcon,
  className: "",
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  popupAnchor: [0, -16],
});

const safeHubIcon = new L.DivIcon({
  html: safeHubSvgIcon,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14],
});

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [lat, lng, map]);
  return null;
}

export function MapScreen() {
  const { location, activeCity, offlineMode, tripActive } = useApp();
  const [showSafeRoute, setShowSafeRoute] = useState(true);
  const [sheetExpanded, setSheetExpanded] = useState(false);
  const [focusCoords, setFocusCoords] = useState<{ lat: number; lng: number } | null>(null);

  if (!location) {
    return (
      <div className="flex items-center justify-center p-10 h-full text-slate-500 text-sm">
        Locating GPS...
      </div>
    );
  }

  const mapCenter = focusCoords || location;

  const safeZone = {
    lat: location.lat + 0.002,
    lng: location.lng + 0.002,
    name: activeCity.safeHubName,
  };
  const dangerZone = {
    lat: location.lat - 0.0028,
    lng: location.lng - 0.001,
    name: "High Risk Pickpocket / Unlit Zone",
  };
  const endPoint = {
    lat: location.lat - 0.0045,
    lng: location.lng + 0.0038,
  };

  const normalRoute: [number, number][] = [
    [location.lat, location.lng],
    [location.lat - 0.0015, location.lng + 0.0008],
    [dangerZone.lat, dangerZone.lng],
    [location.lat - 0.0038, location.lng + 0.0018],
    [endPoint.lat, endPoint.lng],
  ];

  const safeCorridorPolyline: [number, number][] = [
    [location.lat, location.lng],
    [location.lat + 0.001, location.lng + 0.0014],
    [safeZone.lat, safeZone.lng],
    [location.lat - 0.001, location.lng + 0.0034],
    [location.lat - 0.003, location.lng + 0.0045],
    [endPoint.lat, endPoint.lng],
  ];

  const routeData = {
    waypoints: safeCorridorPolyline,
    summary: "Bypasses unlit alleys & passes 24/7 police checkpoint.",
    instructions: [
      { instruction: "Head northeast on lit main avenue", distance: "140m" },
      { instruction: `Pass checkpoint: ${activeCity.safeHubName}`, distance: "210m" },
      { instruction: "Turn right onto commercial pedestrian street", distance: "320m" },
      { instruction: "Arrive at verified hotel safe zone", distance: "150m" },
    ],
  };

  return (
    <div className="h-full w-full flex flex-col relative overflow-hidden">
      {/* Floating Top Controls */}
      <div className="absolute top-3 left-4 right-4 z-[1000] flex items-center justify-between gap-2 pointer-events-none">
        <div className="bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-full shadow-md border border-slate-200/80 flex items-center gap-1.5 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[11px] font-bold text-slate-800">
            {offlineMode ? "Offline Map" : activeCity.name}
          </span>
        </div>

        <div className="flex items-center gap-1.5 pointer-events-auto">
          <button
            onClick={() => setShowSafeRoute(!showSafeRoute)}
            className={cn(
              "px-3 py-1.5 rounded-full shadow-md border text-[11px] font-bold flex items-center gap-1.5 transition-colors cursor-pointer",
              showSafeRoute
                ? "bg-emerald-600 border-emerald-600 text-white"
                : "bg-white/95 border-slate-200 text-slate-700"
            )}
          >
            <Navigation className="w-3 h-3" />
            <span>{showSafeRoute ? "Safe Route ON" : "Safe Route"}</span>
          </button>

          <button
            onClick={() => setFocusCoords({ lat: location.lat, lng: location.lng })}
            className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-slate-200 flex items-center justify-center text-slate-700 hover:text-indigo-600 cursor-pointer"
            title="Recenter GPS"
          >
            <Crosshair className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Interactive Map Canvas */}
      <div className="flex-1 w-full relative z-0">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={15}
          zoomControl={false}
          style={{ height: "100%", width: "100%", zIndex: 0 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          />
          <MapRecenter lat={mapCenter.lat} lng={mapCenter.lng} />

          {tripActive && (
            <Circle
              center={[location.lat, location.lng]}
              pathOptions={{
                color: "#10b981",
                fillColor: "#10b981",
                fillOpacity: 0.25,
                weight: 0,
              }}
              radius={70}
            />
          )}

          <Marker position={[location.lat, location.lng]} icon={userIcon}>
            <Popup>
              <span className="text-xs font-bold text-slate-800">You are here</span>
            </Popup>
          </Marker>

          {/* Verified Safe Zone */}
          <Circle
            center={[safeZone.lat, safeZone.lng]}
            pathOptions={{
              color: "#10b981",
              fillColor: "#10b981",
              fillOpacity: 0.14,
              weight: 1.5,
            }}
            radius={180}
          >
            <Popup>{safeZone.name}</Popup>
          </Circle>

          <Marker position={[safeZone.lat, safeZone.lng]} icon={safeHubIcon}>
            <Popup>
              <div className="text-xs">
                <p className="font-bold text-emerald-800">{safeZone.name}</p>
                <p className="text-slate-500">Verified 24/7 Safe Hub</p>
              </div>
            </Popup>
          </Marker>

          {/* High Risk Area */}
          <Circle
            center={[dangerZone.lat, dangerZone.lng]}
            pathOptions={{
              color: "#f43f5e",
              fillColor: "#f43f5e",
              fillOpacity: 0.18,
              weight: 1.5,
              dashArray: "4, 6",
            }}
            radius={140}
          >
            <Popup>{dangerZone.name}</Popup>
          </Circle>

          {/* Standard Direct Route */}
          <Polyline
            positions={normalRoute}
            pathOptions={{
              color: showSafeRoute ? "#94a3b8" : "#6366f1",
              weight: 4,
              dashArray: showSafeRoute ? "5, 8" : undefined,
            }}
          />

          {/* Safe Corridor Route */}
          {showSafeRoute && (
            <>
              <Polyline
                positions={safeCorridorPolyline}
                pathOptions={{
                  color: "#10b981",
                  weight: 5,
                  opacity: 0.9,
                }}
              />
              <SafeNavigationHandler routeData={routeData} />
            </>
          )}

          <Marker position={[endPoint.lat, endPoint.lng]}>
            <Popup>Hotel Safe Destination</Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Bottom Collapsible Safe Route & Haven Sheet inside Mobile Frame */}
      <div className="bg-white border-t border-slate-200 rounded-t-3xl shadow-xl z-20 px-4 pt-3 pb-3 transition-all">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setSheetExpanded(!sheetExpanded)}
            className="flex items-center gap-2.5 text-left flex-1 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-slate-900 truncate">
                {showSafeRoute ? "Safe Corridor Route · 820m" : "Direct Route · 640m"}
              </p>
              <p className="text-[10px] text-slate-500 truncate">
                Hub: {activeCity.safeHubName}
              </p>
            </div>
          </button>

          <div className="flex items-center gap-1.5 shrink-0">
            <a
              href={`tel:${activeCity.emergencyNumber}`}
              className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100"
              title={`Call ${activeCity.emergencyNumber}`}
            >
              <PhoneCall className="w-3.5 h-3.5" />
            </a>
            <button
              onClick={() => setSheetExpanded(!sheetExpanded)}
              className="w-8 h-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center cursor-pointer"
              aria-label="Toggle route steps"
            >
              {sheetExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {sheetExpanded && (
          <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 max-h-44 overflow-y-auto">
            {routeData.instructions.map((inst, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-xl bg-slate-50 text-xs"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 font-bold text-[10px] flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="font-medium text-slate-800 truncate">
                    {inst.instruction}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-slate-400 tabular-nums shrink-0">
                  {inst.distance}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
