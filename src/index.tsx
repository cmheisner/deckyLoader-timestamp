import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  SliderField,
  ToggleField,
} from "@decky/ui";
import { routerHook } from "@decky/api";
import React, { FC, useState, useEffect, useRef } from "react";
import { ClockSettings } from "./ClockOverlay";

const STORAGE_KEY = "decky-timestamp-settings";

const COLORS = ["#ffffff", "#ffff00", "#00ff00", "#00ffff", "#ff8800", "#ff69b4"];
const COLOR_LABELS: Record<string, string> = {
  "#ffffff": "White",
  "#ffff00": "Yellow",
  "#00ff00": "Green",
  "#00ffff": "Cyan",
  "#ff8800": "Orange",
  "#ff69b4": "Pink",
};

const POSITIONS: ClockSettings["position"][] = [
  "top-left",
  "top-right",
  "bottom-left",
  "bottom-right",
];

const POSITION_STYLES: Record<ClockSettings["position"], React.CSSProperties> = {
  "top-left":     { top: 8, left: 8 },
  "top-right":    { top: 8, right: 8 },
  "bottom-left":  { bottom: 8, left: 8 },
  "bottom-right": { bottom: 8, right: 8 },
};

function loadSettings(): ClockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    visible: false,
    use24h: false,
    showDate: true,
    fontSize: 16,
    color: "#ffffff",
    position: "top-right",
  };
}

function saveSettings(s: ClockSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

// Shared mutable ref updated by the QAM panel, read by the global overlay
let globalSettings = loadSettings();
const listeners: Array<(s: ClockSettings) => void> = [];

function notifyListeners(s: ClockSettings) {
  listeners.forEach((fn) => fn(s));
}

// Persistent overlay — rendered via addGlobalComponent
const ClockOverlayGlobal: FC = () => {
  const [settings, setSettings] = useState<ClockSettings>(globalSettings);
  const [now, setNow] = useState(new Date());
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const listener = (s: ClockSettings) => setSettings(s);
    listeners.push(listener);
    return () => {
      const i = listeners.indexOf(listener);
      if (i >= 0) listeners.splice(i, 1);
    };
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => setNow(new Date()), 1000);
    return () => { if (tickRef.current) clearInterval(tickRef.current); };
  }, []);

  if (!settings.visible) return null;

  const timeStr = now.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !settings.use24h,
  });

  const dateStr = now.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div style={{
      position: "fixed",
      zIndex: 9999,
      color: settings.color,
      fontSize: settings.fontSize,
      fontFamily: "monospace",
      textAlign: "center",
      textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
      pointerEvents: "none",
      userSelect: "none",
      lineHeight: 1.3,
      ...POSITION_STYLES[settings.position],
    }}>
      {settings.showDate && <div>{dateStr}</div>}
      <div>{timeStr}</div>
    </div>
  );
};

// QAM panel content
const Content: FC<{
  initialSettings: ClockSettings;
  onUpdate: (s: ClockSettings) => void;
}> = ({ initialSettings, onUpdate }) => {
  const [settings, setSettings] = useState<ClockSettings>(initialSettings);

  const update = (patch: Partial<ClockSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    globalSettings = next;
    onUpdate(next);
  };

  const colorIdx = Math.max(0, COLORS.indexOf(settings.color));
  const posIdx = Math.max(0, POSITIONS.indexOf(settings.position));

  return (
    <PanelSection>
      <PanelSectionRow>
        <ToggleField
          label="Show Clock"
          checked={settings.visible}
          onChange={(v) => update({ visible: v })}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="24-Hour Format"
          checked={settings.use24h}
          onChange={(v) => update({ use24h: v })}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <ToggleField
          label="Show Date"
          checked={settings.showDate}
          onChange={(v) => update({ showDate: v })}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label={`Font Size: ${settings.fontSize}px`}
          value={settings.fontSize}
          min={10}
          max={36}
          step={1}
          onChange={(v) => update({ fontSize: v })}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label={`Color: ${COLOR_LABELS[settings.color] ?? settings.color}`}
          value={colorIdx}
          min={0}
          max={COLORS.length - 1}
          step={1}
          onChange={(v) => update({ color: COLORS[v] })}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label={`Position: ${settings.position}`}
          value={posIdx}
          min={0}
          max={POSITIONS.length - 1}
          step={1}
          onChange={(v) => update({ position: POSITIONS[v] })}
        />
      </PanelSectionRow>
    </PanelSection>
  );
};

export default definePlugin(() => {
  const initialSettings = loadSettings();
  globalSettings = initialSettings;

  routerHook.addGlobalComponent("DeckyTimestamp", ClockOverlayGlobal);

  return {
    title: <div>Timestamp</div>,
    content: (
      <Content
        initialSettings={initialSettings}
        onUpdate={notifyListeners}
      />
    ),
    icon: <span>🕐</span>,
    onDismount() {
      routerHook.removeGlobalComponent("DeckyTimestamp");
    },
  };
});
