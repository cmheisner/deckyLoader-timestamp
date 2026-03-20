import React, { CSSProperties, FC, useEffect, useState } from "react";

export interface ClockSettings {
  visible: boolean;
  use24h: boolean;
  showDate: boolean;
  fontSize: number;
  color: string;
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right";
}

const POSITION_STYLES: Record<ClockSettings["position"], CSSProperties> = {
  "top-left":     { top: 8, left: 8 },
  "top-right":    { top: 8, right: 8 },
  "bottom-left":  { bottom: 8, left: 8 },
  "bottom-right": { bottom: 8, right: 8 },
};

export const ClockOverlay: FC<{ settings: ClockSettings }> = ({ settings }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
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

  const style: CSSProperties = {
    position: "fixed",
    zIndex: 99999,
    color: settings.color,
    fontSize: settings.fontSize,
    fontFamily: "monospace",
    textAlign: "center",
    textShadow: "1px 1px 3px rgba(0,0,0,0.8)",
    pointerEvents: "none",
    userSelect: "none",
    lineHeight: 1.3,
    ...POSITION_STYLES[settings.position],
  };

  return (
    <div style={style}>
      {settings.showDate && <div>{dateStr}</div>}
      <div>{timeStr}</div>
    </div>
  );
};
