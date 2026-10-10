"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SETTINGS_KEY = "vridh-mitra-alarm-settings";

export interface AlarmSettings {
  enabled: boolean;
  volume: number; // 0 to 1
}

export interface AlarmState {
  active: boolean;
  reminderId: string | null;
  reminderName: string | null;
}

/**
 * useAlarm — Web Audio API alarm sound generator + reminder scheduler.
 *
 * Checks active reminders every 15 seconds. When the current time matches a
 * reminder time slot, it triggers an oscillating alarm tone via the Web Audio
 * API and exposes an alarm modal state. The user can mark as taken or snooze.
 */
export function useAlarm(reminders: Array<{ id: string; medicine_name: string; time_slots: string[]; active: boolean }>) {
  const [settings, setSettings] = useState<AlarmSettings>({ enabled: true, volume: 0.5 });
  const [alarm, setAlarm] = useState<AlarmState>({ active: false, reminderId: null, reminderName: null });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastTriggerRef = useRef<string>("");

  // Load settings from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      if (saved) setSettings(JSON.parse(saved));
    } catch { /* ignore */ }
  }, []);

  const saveSettings = useCallback((s: AlarmSettings) => {
    setSettings(s);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch { /* ignore */ }
  }, []);

  const playAlarmSound = useCallback(() => {
    if (!settings.enabled) return;
    try {
      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      // Create a repeating alarm beep pattern
      const playBeep = (startTime: number) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, startTime); // A5
        osc.frequency.setValueAtTime(1100, startTime + 0.15); // ~C6
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(settings.volume, startTime + 0.02);
        gain.gain.linearRampToValueAtTime(0, startTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.3);
      };

      // Play 3 beeps with 0.4s spacing
      for (let i = 0; i < 3; i++) {
        playBeep(ctx.currentTime + i * 0.4);
      }
    } catch (e) { /* AudioContext not available */ }
  }, [settings.enabled, settings.volume]);

  // Check for due reminders
  useEffect(() => {
    const check = () => {
      if (alarm.active) return; // Don't trigger while alarm is showing
      const now = new Date();
      const currentSlot = now.toTimeString().slice(0, 5); // HH:MM
      const triggerKey = `${now.toDateString()}-${currentSlot}`;
      if (lastTriggerRef.current === triggerKey) return;

      for (const r of reminders) {
        if (!r.active) continue;
        if (r.time_slots.includes(currentSlot)) {
          lastTriggerRef.current = triggerKey;
          setAlarm({ active: true, reminderId: r.id, reminderName: r.medicine_name });
          playAlarmSound();
          break;
        }
      }
    };

    check(); // Initial check
    intervalRef.current = setInterval(check, 15000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [reminders, alarm.active, playAlarmSound]);

  const markTaken = useCallback(() => {
    setAlarm({ active: false, reminderId: null, reminderName: null });
  }, []);

  const snooze = useCallback(() => {
    // Snooze for 5 minutes: set a timeout to re-trigger
    setAlarm({ active: false, reminderId: null, reminderName: null });
    const snoozeSlot = new Date(Date.now() + 5 * 60000);
    lastTriggerRef.current = ""; // Allow re-trigger
    setTimeout(() => {
      setAlarm({ active: true, reminderId: "snooze", reminderName: "Snooze" });
      playAlarmSound();
    }, 5 * 60000);
  }, [playAlarmSound]);

  return { settings, saveSettings, alarm, markTaken, snooze, playAlarmSound };
}