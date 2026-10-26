import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { v4 as uuidv4 } from "uuid";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  role?: "Emergency" | "Embassy" | "Medical" | "Family";
  notes?: string;
}

export interface Location {
  lat: number;
  lng: number;
  label?: string;
}

export interface SafetyLogItem {
  id: string;
  time: string;
  message: string;
  type: "info" | "safe" | "warning" | "sos";
}

export interface CityPreset {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  emergencyNumber: string;
  safeHubName: string;
  advisorySummary: string;
}

export const CITY_PRESETS: CityPreset[] = [
  {
    id: "paris",
    name: "Paris",
    country: "France",
    lat: 48.8566,
    lng: 2.3522,
    emergencyNumber: "112",
    safeHubName: "Hôtel de Ville 4th Arr. Police Post",
    advisorySummary: "Heightened pickpocket activity near Châtelet transit hub and Seine riverfront walkways after 21:00."
  },
  {
    id: "tokyo",
    name: "Tokyo",
    country: "Japan",
    lat: 35.6762,
    lng: 139.6503,
    emergencyNumber: "110",
    safeHubName: "Shinjuku Koban Safe Box #4",
    advisorySummary: "Low street crime index. Keep passport carried on person and monitor seismic transit alerts."
  },
  {
    id: "barcelona",
    name: "Barcelona",
    country: "Spain",
    lat: 41.3874,
    lng: 2.1686,
    emergencyNumber: "112",
    safeHubName: "Mossos d'Esquadra Plaça Catalunya",
    advisorySummary: "Watch bags closely at outdoor cafés along La Rambla and metro interchanges."
  },
  {
    id: "rome",
    name: "Rome",
    country: "Italy",
    lat: 41.9028,
    lng: 12.4964,
    emergencyNumber: "112",
    safeHubName: "Carabinieri Piazza Venezia Station",
    advisorySummary: "Avoid unlicensed transit operators near Termini station; use marked white taxis."
  }
];

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "default-1",
    name: "European Emergency Dispatch",
    phone: "112",
    role: "Emergency",
    notes: "24/7 multilingual police, ambulance & fire response"
  },
  {
    id: "default-2",
    name: "U.S. / International Embassy Duty Desk",
    phone: "+33 1 43 12 22 22",
    role: "Embassy",
    notes: "Lost passport replacement & citizen crisis support"
  },
  {
    id: "default-3",
    name: "SOS Médecins 24h English Clinic",
    phone: "+33 1 47 07 77 77",
    role: "Medical",
    notes: "On-call English-speaking emergency physician"
  },
  {
    id: "default-4",
    name: "Elena Vance (Primary ICE)",
    phone: "+1 415 890 4321",
    role: "Family",
    notes: "Receives automated GPS coordinates during Trip Sharing"
  }
];

interface AppContextType {
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  contacts: Contact[];
  addContact: (c: Omit<Contact, "id">) => void;
  removeContact: (id: string) => void;
  location: Location | null;
  setLocation: (l: Location) => void;
  activeCity: CityPreset;
  selectCityPreset: (cityId: string) => void;
  useLiveGps: () => void;
  sosActive: boolean;
  setSosActive: (v: boolean) => void;
  tripActive: boolean;
  setTripActive: (v: boolean) => void;
  voiceSosActive: boolean;
  setVoiceSosActive: (v: boolean) => void;
  checkInSecondsLeft: number | null;
  startCheckInTimer: (minutes: number) => void;
  cancelCheckInTimer: () => void;
  confirmSafeCheckIn: () => void;
  safetyLogs: SafetyLogItem[];
  addSafetyLog: (message: string, type?: SafetyLogItem["type"]) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [offlineMode, setOfflineModeState] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>(() => {
    try {
      const stored = localStorage.getItem("safetrek_contacts");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return INITIAL_CONTACTS;
  });

  const [activeCity, setActiveCity] = useState<CityPreset>(CITY_PRESETS[0]);
  const [location, setLocation] = useState<Location | null>({
    lat: CITY_PRESETS[0].lat,
    lng: CITY_PRESETS[0].lng,
    label: `${CITY_PRESETS[0].name}, ${CITY_PRESETS[0].country}`
  });
  const [sosActive, setSosActiveState] = useState(false);
  const [tripActive, setTripActiveState] = useState(false);
  const [voiceSosActive, setVoiceSosActiveState] = useState(false);
  const [checkInSecondsLeft, setCheckInSecondsLeft] = useState<number | null>(null);
  const [safetyLogs, setSafetyLogs] = useState<SafetyLogItem[]>([
    {
      id: "log-init-1",
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      message: "GPS telemetry locked · Safe zone perimeter verified",
      type: "safe"
    }
  ]);

  const addSafetyLog = (message: string, type: SafetyLogItem["type"] = "info") => {
    const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setSafetyLogs((prev) => [{ id: uuidv4(), time, message, type }, ...prev.slice(0, 14)]);
  };

  // Save contacts
  useEffect(() => {
    try {
      localStorage.setItem("safetrek_contacts", JSON.stringify(contacts));
    } catch (e) {}
  }, [contacts]);

  // Countdown timer for Scheduled Check-in
  useEffect(() => {
    if (checkInSecondsLeft === null) return;
    if (checkInSecondsLeft <= 0) {
      setCheckInSecondsLeft(null);
      setSosActiveState(true);
      addSafetyLog("Missed scheduled safety check-in — Automatic SOS alert triggered", "sos");
      return;
    }
    const timer = setInterval(() => {
      setCheckInSecondsLeft((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(timer);
  }, [checkInSecondsLeft]);

  const selectCityPreset = (cityId: string) => {
    const found = CITY_PRESETS.find((c) => c.id === cityId);
    if (found) {
      setActiveCity(found);
      setLocation({
        lat: found.lat,
        lng: found.lng,
        label: `${found.name}, ${found.country}`
      });
      addSafetyLog(`Switched monitoring sector to ${found.name}, ${found.country}`, "info");
    }
  };

  const useLiveGps = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
            label: "Live GPS Coordinates"
          });
          addSafetyLog("Synchronized with live device GPS coordinates", "safe");
        },
        () => {
          addSafetyLog("Device geolocation unavailable — using current city sector", "warning");
        }
      );
    }
  };

  const setOfflineMode = (v: boolean) => {
    setOfflineModeState(v);
    addSafetyLog(
      v ? "Offline mode enabled — using cached maps & phrasebook" : "Reconnected to live cloud safety feed",
      v ? "warning" : "safe"
    );
  };

  const setSosActive = (v: boolean) => {
    setSosActiveState(v);
    addSafetyLog(
      v
        ? `EMERGENCY SOS ACTIVATED — Broadcasting coordinates to ${contacts.length} contacts`
        : "Emergency SOS stood down by user confirmation",
      v ? "sos" : "safe"
    );
  };

  const setTripActive = (v: boolean) => {
    setTripActiveState(v);
    addSafetyLog(
      v
        ? "Guardian Trip Sharing started — Live breadcrumb trail active"
        : "Guardian Trip Sharing ended safely",
      v ? "safe" : "info"
    );
  };

  const setVoiceSosActive = (v: boolean) => {
    setVoiceSosActiveState(v);
    addSafetyLog(
      v ? "Voice SOS trigger armed (wake keyword: 'help' or 'emergency')" : "Voice SOS trigger disarmed",
      "info"
    );
  };

  const startCheckInTimer = (minutes: number) => {
    setCheckInSecondsLeft(minutes * 60);
    addSafetyLog(`Started ${minutes}-minute safe arrival timer`, "info");
  };

  const cancelCheckInTimer = () => {
    setCheckInSecondsLeft(null);
    addSafetyLog("Cancelled scheduled check-in timer", "info");
  };

  const confirmSafeCheckIn = () => {
    setCheckInSecondsLeft(null);
    addSafetyLog("Confirmed safe arrival · Contacts notified of safe status", "safe");
  };

  const addContact = (c: Omit<Contact, "id">) => {
    setContacts((prev) => [...prev, { ...c, id: uuidv4() }]);
    addSafetyLog(`Added emergency contact: ${c.name}`, "info");
  };

  const removeContact = (id: string) => {
    setContacts((prev) => prev.filter((c) => c.id !== id));
  };

  return (
    <AppContext.Provider
      value={{
        offlineMode,
        setOfflineMode,
        contacts,
        addContact,
        removeContact,
        location,
        setLocation,
        activeCity,
        selectCityPreset,
        useLiveGps,
        sosActive,
        setSosActive,
        tripActive,
        setTripActive,
        voiceSosActive,
        setVoiceSosActive,
        checkInSecondsLeft,
        startCheckInTimer,
        cancelCheckInTimer,
        confirmSafeCheckIn,
        safetyLogs,
        addSafetyLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
