import React, { useState, useEffect, useRef } from "react";
import { Home, Map, Languages, Users, Wifi, Battery, Volume2, VolumeX, CheckCircle2 } from "lucide-react";
import { cn } from "../lib/utils";
import { useApp } from "../context/AppContext";

interface MobileContainerProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: string) => void;
  sosActive: boolean;
}

export function MobileContainer({ children, activeTab, onTabChange, sosActive }: MobileContainerProps) {
  const { checkInSecondsLeft, confirmSafeCheckIn } = useApp();
  const [sirenOn, setSirenOn] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sirenIntervalRef = useRef<number | null>(null);

  const tabs = [
    { id: "dashboard", icon: Home, label: "Home" },
    { id: "map", icon: Map, label: "Map" },
    { id: "translate", icon: Languages, label: "Translate" },
    { id: "contacts", icon: Users, label: "Contacts" },
  ];

  const [time, setTime] = useState("");
  useEffect(() => {
    const updateClock = () => {
      setTime(
        new Date()
          .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          .replace(/ AM| PM/, "")
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  // Audible Deterrent Siren when SOS is active
  useEffect(() => {
    if (!sosActive && sirenOn) {
      setSirenOn(false);
    }
  }, [sosActive, sirenOn]);

  useEffect(() => {
    if (sirenOn) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        let high = true;
        const playTone = () => {
          if (!audioCtxRef.current) return;
          const osc = audioCtxRef.current.createOscillator();
          const gain = audioCtxRef.current.createGain();
          osc.type = "triangle";
          osc.frequency.setValueAtTime(high ? 880 : 660, audioCtxRef.current.currentTime);
          gain.gain.setValueAtTime(0.15, audioCtxRef.current.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, audioCtxRef.current.currentTime + 0.35);
          osc.connect(gain);
          gain.connect(audioCtxRef.current.destination);
          osc.start();
          osc.stop(audioCtxRef.current.currentTime + 0.35);
          high = !high;
        };

        playTone();
        sirenIntervalRef.current = window.setInterval(playTone, 400);
      } catch (e) {
        console.warn("Web Audio API unavailable", e);
      }
    } else {
      if (sirenIntervalRef.current) {
        clearInterval(sirenIntervalRef.current);
        sirenIntervalRef.current = null;
      }
      if (audioCtxRef.current) {
        audioCtxRef.current.close().catch(() => {});
        audioCtxRef.current = null;
      }
    }

    return () => {
      if (sirenIntervalRef.current) clearInterval(sirenIntervalRef.current);
      if (audioCtxRef.current) audioCtxRef.current.close().catch(() => {});
    };
  }, [sirenOn]);

  const formatCountdown = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="w-full min-h-screen bg-slate-100 flex items-center justify-center font-sans text-slate-900 md:py-6">
      {/* Mobile Device Frame */}
      <div
        className={cn(
          "w-full h-[100dvh] md:w-[380px] md:h-[760px] bg-slate-50 md:rounded-[48px] shadow-2xl md:border-[10px] border-slate-900 overflow-hidden relative flex flex-col transition-colors duration-300",
          sosActive && "bg-rose-50/90 border-rose-950"
        )}
      >
        {/* Status Bar */}
        <div
          className={cn(
            "px-7 pt-3.5 pb-2 flex justify-between items-center text-[11px] font-bold shrink-0 z-20 transition-colors",
            sosActive ? "bg-rose-600 text-white" : "bg-white text-slate-800"
          )}
        >
          <span className="font-mono tabular-nums">{time || "9:41"}</span>
          <div className="w-20 h-4 bg-slate-900 rounded-full hidden md:block" />
          <div className="flex items-center gap-1.5">
            <Wifi className="w-3.5 h-3.5" />
            <Battery className="w-4 h-4" />
          </div>
        </div>

        {/* Active SOS Compact Bar inside Mobile Frame */}
        {sosActive && (
          <div className="bg-rose-600 text-white px-4 py-2 flex items-center justify-between gap-2 shrink-0 z-20 border-t border-rose-500/40">
            <span className="text-[11px] font-bold tracking-wide">
              SOS Broadcasting Live GPS
            </span>
            <button
              onClick={() => setSirenOn(!sirenOn)}
              className={cn(
                "px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer",
                sirenOn ? "bg-amber-400 text-slate-950" : "bg-white/20 text-white hover:bg-white/30"
              )}
            >
              {sirenOn ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
              <span>{sirenOn ? "Mute Siren" : "Siren"}</span>
            </button>
          </div>
        )}

        {/* Active Check-In Timer Pill Bar inside Mobile Frame */}
        {checkInSecondsLeft !== null && !sosActive && (
          <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between gap-2 shrink-0 z-20">
            <span className="text-[11px] font-medium text-slate-200">
              Check-in:{" "}
              <strong className="font-mono text-emerald-400 tabular-nums">
                {formatCountdown(checkInSecondsLeft)}
              </strong>
            </span>
            <button
              onClick={confirmSafeCheckIn}
              className="px-2.5 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-[10px] font-bold flex items-center gap-1 cursor-pointer"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>I&apos;m Safe</span>
            </button>
          </div>
        )}

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto relative z-0 flex flex-col">
          {children}
        </main>

        {/* Bottom Navigation */}
        <nav className="border-t border-slate-200/80 px-4 py-2 flex justify-around items-center bg-white shrink-0 z-20">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className={cn(
                  "flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all cursor-pointer min-w-[64px]",
                  isActive
                    ? "text-indigo-600 bg-indigo-50/80 font-semibold"
                    : "text-slate-400 hover:text-slate-700"
                )}
                aria-label={tab.label}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.4 : 1.8} />
                <span className="text-[10px] mt-1 tracking-tight">{tab.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Home Indicator */}
        <div className="bg-white pb-2 pt-0.5 flex justify-center shrink-0 z-20 hidden md:flex">
          <div className="w-28 h-1 bg-slate-300 rounded-full" />
        </div>
      </div>

      {/* Contextual Info (Desktop only) */}
      <div className="ml-12 max-w-[280px] hidden lg:block">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-600 text-xs font-semibold mb-4">
          <span>SafeVoyage AI</span>
        </div>
        <h2 className="text-3xl font-bold text-slate-900 tracking-tight leading-tight mb-3">
          Pocket Tourist Safety Monitor.
        </h2>
        <p className="text-xs text-slate-500 leading-relaxed mb-6">
          Designed for one-handed operation in unfamiliar cities with instant SOS dispatch, safe corridor routing, and offline crisis translation.
        </p>
        <div className="space-y-3">
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-900">Gemini Flash Advisory</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Real-time localized street safety tips & phonetic crisis translation.
            </p>
          </div>
          <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
            <p className="text-xs font-bold text-slate-900">Safe Corridor Routing</p>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Pedestrian paths that prioritize lit avenues & 24/7 police checkpoints.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
