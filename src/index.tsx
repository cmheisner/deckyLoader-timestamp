import {
  definePlugin,
  PanelSection,
  PanelSectionRow,
  SliderField,
  ToggleField,
} from "@decky/ui";
import React, { FC, useState } from "react";
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

function loadSettings(): ClockSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    visible: true,
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

const POSITION_CSS: Record<ClockSettings["position"], string> = {
  "top-left":     "top:8px;left:8px;",
  "top-right":    "top:8px;right:8px;",
  "bottom-left":  "bottom:8px;left:8px;",
  "bottom-right": "bottom:8px;right:8px;",
};

function applyOverlay(el: HTMLDivElement, s: ClockSettings) {
  el.style.cssText = `
    position:fixed;
    z-index:99999;
    color:${s.color};
    font-size:${s.fontSize}px;
    font-family:monospace;
    text-align:center;
    text-shadow:1px 1px 3px rgba(0,0,0,0.8);
    pointer-events:none;
    user-select:none;
    line-height:1.3;
    display:${s.visible ? "block" : "none"};
    ${POSITION_CSS[s.position]}
  `;
}

function formatTime(d: Date, use24h: boolean): string {
  return d.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: !use24h,
  });
}

function formatDate(d: Date): string {
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

// QAM panel content — uses local state so sliders/toggles re-render properly
const Content: FC<{
  initialSettings: ClockSettings;
  onOverlayUpdate: (s: ClockSettings) => void;
}> = ({ initialSettings, onOverlayUpdate }) => {
  const [settings, setSettings] = useState<ClockSettings>(initialSettings);

  const update = (patch: Partial<ClockSettings>) => {
    const next = { ...settings, ...patch };
    setSettings(next);
    saveSettings(next);
    onOverlayUpdate(next);
  };

  const colorIdx = Math.max(0, COLORS.indexOf(settings.color));
  const posIdx = Math.max(1, POSITIONS.indexOf(settings.position));

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
  let overlayEl: HTMLDivElement | null = null;
  let timeEl: HTMLDivElement | null = null;
  let dateEl: HTMLDivElement | null = null;
  let ticker: ReturnType<typeof setInterval> | null = null;
  let currentSettings = initialSettings;

  // Try to find the main Steam UI document (not the panel iframe)
  function getTargetDoc(): Document {
    try {
      if (window.parent && window.parent.document && window.parent.document !== document) {
        return window.parent.document;
      }
    } catch {}
    return document;
  }

  function mountOverlay() {
    const doc = getTargetDoc();
    if (doc.getElementById("decky-timestamp-overlay")) return;

    overlayEl = doc.createElement("div");
    overlayEl.id = "decky-timestamp-overlay";

    dateEl = doc.createElement("div");
    timeEl = doc.createElement("div");
    overlayEl.appendChild(dateEl);
    overlayEl.appendChild(timeEl);

    doc.body.appendChild(overlayEl);
    applyOverlay(overlayEl, currentSettings);
    tick();

    ticker = setInterval(tick, 1000);
  }

  function tick() {
    if (!timeEl || !dateEl) return;
    const now = new Date();
    timeEl.textContent = formatTime(now, currentSettings.use24h);
    dateEl.textContent = currentSettings.showDate ? formatDate(now) : "";
    dateEl.style.display = currentSettings.showDate ? "block" : "none";
  }

  function updateOverlay(s: ClockSettings) {
    currentSettings = s;
    if (overlayEl) applyOverlay(overlayEl, s);
    tick();
  }

  function unmountOverlay() {
    if (ticker) { clearInterval(ticker); ticker = null; }
    overlayEl?.remove();
    overlayEl = null;
    timeEl = null;
    dateEl = null;
  }

  mountOverlay();

  return {
    title: <div>Timestamp</div>,
    content: (
      <Content
        initialSettings={initialSettings}
        onOverlayUpdate={updateOverlay}
      />
    ),
    icon: <span>🕐</span>,
    onDismount() {
      unmountOverlay();
    },
  };
});
