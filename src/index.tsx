import {
  ButtonItem,
  definePlugin,
  PanelSection,
  PanelSectionRow,
  SliderField,
  ToggleField,
} from "@decky/ui";
import { FC, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ClockOverlay, ClockSettings } from "./ClockOverlay";

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

// The QAM panel content
const Content: FC<{
  settings: ClockSettings;
  onChange: (s: ClockSettings) => void;
}> = ({ settings, onChange }) => {
  const update = (patch: Partial<ClockSettings>) => {
    const next = { ...settings, ...patch };
    onChange(next);
  };

  const colorIdx = COLORS.indexOf(settings.color);
  const posIdx = POSITIONS.indexOf(settings.position);

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
          value={colorIdx >= 0 ? colorIdx : 0}
          min={0}
          max={COLORS.length - 1}
          step={1}
          onChange={(v) => update({ color: COLORS[v] })}
        />
      </PanelSectionRow>

      <PanelSectionRow>
        <SliderField
          label={`Position: ${settings.position}`}
          value={posIdx >= 0 ? posIdx : 1}
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
  let settings = loadSettings();
  let overlayRoot: HTMLDivElement | null = null;
  let reactRoot: any = null;

  function mountOverlay() {
    overlayRoot = document.createElement("div");
    overlayRoot.id = "decky-timestamp-overlay";
    document.body.appendChild(overlayRoot);

    // Use React 18 createRoot if available, else fallback
    const { createRoot } = require("react-dom/client");
    reactRoot = createRoot(overlayRoot);
    renderOverlay();
  }

  function renderOverlay() {
    if (!reactRoot) return;
    const { createElement } = require("react");
    reactRoot.render(createElement(ClockOverlay, { settings }));
  }

  function unmountOverlay() {
    if (reactRoot) {
      reactRoot.unmount();
      reactRoot = null;
    }
    overlayRoot?.remove();
    overlayRoot = null;
  }

  mountOverlay();

  return {
    title: <div>Timestamp</div>,
    content: (
      <Content
        settings={settings}
        onChange={(s) => {
          settings = s;
          saveSettings(s);
          renderOverlay();
        }}
      />
    ),
    icon: <span>🕐</span>,
    onDismount() {
      unmountOverlay();
    },
  };
});
