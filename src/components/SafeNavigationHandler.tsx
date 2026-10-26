import React, { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet-routing-machine";

// Fix generic Leaflet icon missing issue for Vite
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

export interface RouteInstruction {
  instruction: string;
  distance: string;
  street?: string;
}

export interface RouteData {
  waypoints: [number, number][];
  summary: string;
  instructions: RouteInstruction[];
}

interface SafeNavigationHandlerProps {
  routeData: RouteData;
}

export const SafeNavigationHandler: React.FC<SafeNavigationHandlerProps> = ({ routeData }) => {
  const map = useMap();
  const routingControlRef = useRef<L.Routing.Control | null>(null);

  useEffect(() => {
    if (!map || !routeData || routeData.waypoints.length < 2) return;

    const waypoints = routeData.waypoints.map((wp) => L.latLng(wp[0], wp[1]));

    const routingControl = L.Routing.control({
      waypoints,
      lineOptions: {
        styles: [{ color: "#10b981", weight: 6, opacity: 0.9 }],
        extendToWaypoints: true,
        missingRouteTolerance: 0,
      },
      show: false,
      showAlternatives: false,
      fitSelectedRoutes: true,
      routeWhileDragging: false,
      addWaypoints: false,
    }).addTo(map);

    routingControlRef.current = routingControl;

    return () => {
      if (routingControlRef.current && map) {
        try {
          const plan = routingControlRef.current.getPlan();
          if (plan) {
            plan.setWaypoints([]);
          }
          map.removeControl(routingControlRef.current);
        } catch (error) {
          console.warn("Leaflet Routing Machine cleanup error:", error);
        }
      }
    };
  }, [map, routeData]);

  return null;
};
