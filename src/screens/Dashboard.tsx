import React, { useEffect, useState } from "react";
import {
  ShieldCheck,
  Navigation,
  Mic,
  WifiOff,
  RefreshCw,
  PhoneCall,
  Copy,
  Check,
  Clock,
  MapPin,
  AlertTriangle,
} from "lucide-react";
import { useApp, CITY_PRESETS } from "../context/AppContext";
import { cn } from "../lib/utils";
import { generateSafetyAlert } from "../services/ai";

interface DashboardProps {
  onNavigate?: (tab: string) => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const {
    sosActive,
    setSosActive,
    location,
    activeCity,
    selectCityPreset,
    useLiveGps,
    offlineMode,
    setOfflineMode,
    tripActive,
    setTripActive,
    voiceSosActive,
    setVoiceSosActive,
    checkInSecondsLeft,
    startCheckInTimer,
    cancelCheckInTimer,
    confirmSafeCheckIn,
    contacts,
    addSafetyLog,
  } = useApp();

  const [safetyAlert, setSafetyAlert] = useState<string>(activeCity.advisorySummary);
  const [isRefreshingAlert, setIsRefreshingAlert] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [sosCountdown, setSosCountdown] = useState<number | null>(null);

  // Speech Recognition Setup
  useEffect(() => {
    let recognition: any;
    if (voiceSosActive) {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.onresult = (event: any) => {
            const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase();
            if (transcript.includes("help") || transcript.includes("emergency")) {
              setSosActive(true);
            }
          };
          recognition.onerror = () => {
            setVoiceError("Mic permission unavailable in this browser.");
            setVoiceSosActive(false);
          };
          recognition.start();
          setVoiceError(null);
        } catch {
          setVoiceError("Voice recognition unavailable.");
          setVoiceSosActive(false);
        }
      } else {
        setVoiceError("Voice recognition not supported in this browser.");
        setVoiceSosActive(false);
      }
    }

    return () => {
      if (recognition) {
        try {
          recognition.stop();
        } catch {}
      }
    };
  }, [voiceSosActive, setSosActive, setVoiceSosActive]);

  // 3-second SOS safety countdown
  useEffect(() => {
    if (sosCountdown === null) return;
    if (sosCountdown <= 0) {
      setSosCountdown(null);
      setSosActive(true);
      return;
    }
    const t = setTimeout(() => {
      setSosCountdown((prev) => (prev !== null ? prev - 1 : null));
    }, 1000);
    return () => clearTimeout(t);
  }, [sosCountdown, setSosActive]);

  const fetchAdvisory = async () => {
    if (offlineMode) {
      setSafetyAlert(`Offline Cache (${activeCity.name}): ${activeCity.advisorySummary}`);
      return;
    }
    if (!location) return;
    setIsRefreshingAlert(true);
    try {
      const res = await generateSafetyAlert(
        `${activeCity.name}, ${activeCity.country} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
      );
      setSafetyAlert(res);
    } catch {
      setSafetyAlert(activeCity.advisorySummary);
    } finally {
      setIsRefreshingAlert(false);
    }
  };

  useEffect(() => {
    setSafetyAlert(
      offlineMode
        ? `Offline Cache (${activeCity.name}): ${activeCity.advisorySummary}`
        : activeCity.advisorySummary
    );
    if (!offlineMode && location) {
      generateSafetyAlert(
        `${activeCity.name}, ${activeCity.country} (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`
      )
        .then((res) => {
          if (res && !res.includes("Could not fetch")) {
            setSafetyAlert(res);
          }
        })
        .catch(() => {});
    }
  }, [activeCity.id, offlineMode]);

  const handleCopyDistressSms = () => {
    const coordsText = location
      ? `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
      : `${activeCity.lat.toFixed(4)}, ${activeCity.lng.toFixed(4)}`;
    const message = `SAFEVOYAGE AI ALERT: I am in ${activeCity.name} (${coordsText}). Safe hub: ${activeCity.safeHubName}. Map: https://maps.google.com/?q=${coordsText}`;
    navigator.clipboard?.writeText(message).catch(() => {});
    setCopiedCoords(true);
    addSafetyLog("Copied GPS emergency coordinates", "info");
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="flex flex-col flex-1 px-5 pt-3 pb-5 gap-3.5">
      {/* Top App Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-xs">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 leading-none">SafeVoyage AI</h1>
            <span className="text-[10px] font-medium text-emerald-600">
              {sosActive ? "Distress Active" : "Guardian Active · Low Risk"}
            </span>
          </div>
        </div>

        <button
          onClick={() => setOfflineMode(!offlineMode)}
          className={cn(
            "px-2.5 py-1.5 rounded-full text-[10px] font-bold flex items-center gap-1 border transition-colors cursor-pointer",
            offlineMode
              ? "bg-amber-50 border-amber-200 text-amber-700"
              : "bg-white border-slate-200 text-slate-600 hover:bg-slate-50"
          )}
        >
          <WifiOff className="w-3 h-3" />
          <span>{offlineMode ? "Offline" : "Online"}</span>
        </button>
      </div>

      {/* Dark Hero Location & Sector Card */}
      <div
        className="rounded-3xl p-4 text-white shadow-md relative overflow-hidden"
        style={{
          background:
            "radial-gradient(ellipse at 20% 20%, rgba(99, 102, 241, 0.25) 0%, transparent 60%), #0f172a",
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-medium text-indigo-300 block">
              Current Monitored Sector
            </span>
            <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">
              {activeCity.name}, {activeCity.country}
            </h2>
            <p className="text-[11px] font-mono text-slate-300 tabular-nums mt-0.5">
              {location
                ? `${location.lat.toFixed(4)}° N, ${location.lng.toFixed(4)}° E`
                : "Locating..."}
            </p>
          </div>

          <a
            href={`tel:${activeCity.emergencyNumber}`}
            className="px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/15 text-white text-xs font-bold flex items-center gap-1.5 shrink-0"
          >
            <PhoneCall className="w-3.5 h-3.5 text-rose-400" />
            <span className="font-mono tabular-nums">{activeCity.emergencyNumber}</span>
          </a>
        </div>

        <p className="text-[11px] text-slate-300 mt-2.5 pt-2.5 border-t border-white/10 truncate">
          Safe Hub: <span className="text-white font-semibold">{activeCity.safeHubName}</span>
        </p>

        {/* City Switcher & GPS Row */}
        <div className="flex items-center gap-1.5 mt-3 overflow-x-auto no-scrollbar pb-0.5">
          {CITY_PRESETS.map((city) => (
            <button
              key={city.id}
              onClick={() => selectCityPreset(city.id)}
              className={cn(
                "px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-colors whitespace-nowrap shrink-0 cursor-pointer",
                activeCity.id === city.id
                  ? "bg-indigo-500 text-white"
                  : "bg-white/10 text-slate-300 hover:bg-white/20"
              )}
            >
              {city.name}
            </button>
          ))}
          <button
            onClick={useLiveGps}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-indigo-200 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
            title="Sync Live GPS"
          >
            <MapPin className="w-3 h-3" />
            <span>GPS</span>
          </button>
          <button
            onClick={handleCopyDistressSms}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold bg-white/10 hover:bg-white/20 text-slate-200 flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copiedCoords ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copiedCoords ? "Copied" : "Copy GPS"}</span>
          </button>
        </div>
      </div>

      {/* Gemini Flash Safety Advisory Card */}
      <div className="bg-white rounded-2xl p-3.5 border border-slate-200/80 shadow-xs">
        <div className="flex items-center justify-between mb-1.5">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-50 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
              AI
            </div>
            <span className="text-xs font-bold text-slate-800">Local Safety Insight</span>
          </div>
          <button
            onClick={fetchAdvisory}
            disabled={isRefreshingAlert}
            className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={cn("w-3 h-3", isRefreshingAlert && "animate-spin")} />
            <span>Refresh</span>
          </button>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{safetyAlert}</p>
      </div>

      {/* Guardian Controls (2-Column Grid) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={() => {
            setVoiceError(null);
            setVoiceSosActive(!voiceSosActive);
          }}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all cursor-pointer",
            voiceSosActive
              ? "bg-indigo-50/90 border-indigo-300 text-indigo-900"
              : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                voiceSosActive ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              <Mic className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {voiceSosActive ? "ON" : "OFF"}
            </span>
          </div>
          <p className="text-xs font-bold">Voice SOS</p>
          <p className="text-[10px] text-slate-500 truncate">
            {voiceSosActive ? "Say 'help' aloud" : "Hands-free trigger"}
          </p>
        </button>

        <button
          onClick={() => setTripActive(!tripActive)}
          className={cn(
            "p-3 rounded-2xl border text-left transition-all cursor-pointer",
            tripActive
              ? "bg-emerald-50/90 border-emerald-300 text-emerald-900"
              : "bg-white border-slate-200/80 hover:bg-slate-50 text-slate-800"
          )}
        >
          <div className="flex items-center justify-between mb-1">
            <div
              className={cn(
                "w-7 h-7 rounded-lg flex items-center justify-center",
                tripActive ? "bg-emerald-600 text-white" : "bg-slate-100 text-slate-600"
              )}
            >
              <Navigation className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-bold text-slate-400">
              {tripActive ? "LIVE" : "OFF"}
            </span>
          </div>
          <p className="text-xs font-bold">Trip Sharing</p>
          <p className="text-[10px] text-slate-500 truncate">
            {tripActive ? `Sharing w/ ${contacts.length} contacts` : "Share live route"}
          </p>
        </button>
      </div>

      {voiceError && (
        <div className="px-3 py-2 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-[11px] text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
          <span>{voiceError}</span>
        </div>
      )}

      {/* Auto Check-In Timer Strip */}
      <div className="bg-white rounded-2xl p-3 border border-slate-200/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 leading-tight">Safe Arrival Timer</p>
            <p className="text-[10px] text-slate-500 truncate">
              {checkInSecondsLeft !== null
                ? `Auto-SOS in ${formatTimer(checkInSecondsLeft)}`
                : "Auto-alerts if you don't check in"}
            </p>
          </div>
        </div>

        {checkInSecondsLeft !== null ? (
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={confirmSafeCheckIn}
              className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white text-[10px] font-bold cursor-pointer"
            >
              Safe
            </button>
            <button
              onClick={cancelCheckInTimer}
              className="px-2 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-bold cursor-pointer"
            >
              Stop
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1 shrink-0">
            {[15, 30].map((m) => (
              <button
                key={m}
                onClick={() => startCheckInTimer(m)}
                className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 text-[10px] font-bold font-mono tabular-nums cursor-pointer"
              >
                {m}m
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Primary Emergency SOS Button (Thumb Zone) */}
      <div className="mt-auto pt-1">
        {sosActive ? (
          <button
            onClick={() => setSosActive(false)}
            className="w-full py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all active:scale-98 cursor-pointer"
          >
            <span>Stand Down Emergency SOS</span>
          </button>
        ) : sosCountdown !== null ? (
          <div className="flex gap-2">
            <button
              onClick={() => setSosCountdown(null)}
              className="flex-1 py-4 rounded-2xl bg-slate-900 text-white font-bold text-sm cursor-pointer"
            >
              Cancel ({sosCountdown}s)
            </button>
            <button
              onClick={() => {
                setSosCountdown(null);
                setSosActive(true);
              }}
              className="px-5 py-4 rounded-2xl bg-rose-600 text-white font-bold text-sm cursor-pointer"
            >
              Send Now
            </button>
          </div>
        ) : (
          <button
            onClick={() => setSosCountdown(3)}
            className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2.5 transition-all active:scale-98 cursor-pointer"
          >
            <span className="w-2.5 h-2.5 rounded-full bg-white" />
            <span className="tracking-wide">Trigger Emergency SOS</span>
          </button>
        )}
        <p className="text-[10px] text-center text-slate-400 mt-1.5">
          {sosActive
            ? `Broadcasting coordinates to ${contacts.length} emergency contacts`
            : "3-second safety delay · Sends live GPS to your trusted contacts"}
        </p>
      </div>
    </div>
  );
}
