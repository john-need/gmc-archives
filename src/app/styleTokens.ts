import type { CSSProperties } from "react";

export const COLORS = {
  bg: "#F4F0E9",
  sidebar: "#EDE6DB",
  sidebarBorder: "#E4DBCD",
  card: "#FBF7EC",
  cardAlt: "#FBF8F3",
  cardBorder: "#EAE1D4",
  border: "#E3DACD",
  borderLight: "#ECE4D7",
  text: "#2A2520",
  textMuted: "#7A7064",
  textFaint: "#A79D90",
  textNav: "#9A9085",
  badgeBg: "#F2ECE2",
  badgeText: "#A0958A",
  accent: "#4A5E22",
  accentHover: "#38491A",
  accentBg: "#E9ECD7",
  accentBorder: "#CFD8B0",
  navActiveBg: "#FBF7EC",
  navActiveText: "#38491A",
  danger: "#C0492F",
  dangerBg: "#F7E3DC",
  success: "#4E8C4A",
  successBg: "#E8F0E5"
} as const;

export const cardStyle: CSSProperties = {
  border: `1px solid ${COLORS.cardBorder}`,
  borderRadius: 4,
  background: COLORS.card,
  padding: 18
};

export const badgeStyle: CSSProperties = {
  fontSize: "10.5px",
  fontWeight: 700,
  letterSpacing: ".05em",
  color: COLORS.badgeText,
  fontFamily: "ui-monospace, monospace",
  background: COLORS.badgeBg,
  padding: "3px 8px",
  borderRadius: 2
};

export const inputStyle: CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 3,
  border: `1px solid ${COLORS.border}`,
  background: COLORS.card,
  fontSize: "14.5px",
  color: COLORS.text,
  outline: "none",
  fontFamily: "inherit",
  boxSizing: "border-box"
};

export const primaryButtonStyle: CSSProperties = {
  padding: "10px 18px",
  borderRadius: 3,
  border: "none",
  background: COLORS.accent,
  color: "#fff",
  fontSize: 14,
  fontWeight: 600,
  cursor: "pointer"
};

export const secondaryButtonStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  padding: "7px 13px",
  borderRadius: 2,
  border: "1px solid #E6DDD0",
  background: COLORS.cardAlt,
  color: "#3A342C",
  fontSize: "12.5px",
  fontWeight: 600,
  cursor: "pointer"
};

export const iconButtonStyle: CSSProperties = {
  width: 34,
  height: 34,
  flex: "none",
  borderRadius: 2,
  border: "1px solid #E6DDD0",
  background: COLORS.cardAlt,
  color: COLORS.textMuted,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center"
};

export function navButtonStyle(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    gap: 12,
    width: "100%",
    padding: "11px 13px",
    border: "none",
    borderRadius: 3,
    font: "inherit",
    fontSize: "14.5px",
    cursor: "pointer",
    textAlign: "left",
    background: active ? COLORS.navActiveBg : "transparent",
    color: active ? COLORS.navActiveText : COLORS.textMuted,
    fontWeight: active ? 600 : 500,
    boxShadow: active ? "0 1px 2px rgba(60,45,30,.05), 0 2px 5px rgba(60,45,30,.06)" : "none",
    textDecoration: "none"
  };
}

export function toggleButtonStyle(active: boolean): CSSProperties {
  return {
    width: 34,
    height: 32,
    border: "none",
    borderRadius: 2,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: active ? COLORS.card : "transparent",
    color: active ? COLORS.navActiveText : COLORS.textNav,
    boxShadow: active ? "0 1px 3px rgba(60,45,30,.1)" : "none"
  };
}

export function chipStyle(active: boolean): CSSProperties {
  return {
    padding: "7px 14px",
    borderRadius: 2,
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
    border: `1px solid ${active ? COLORS.accent : "#E6DDD0"}`,
    background: active ? COLORS.accentBg : COLORS.card,
    color: active ? COLORS.navActiveText : COLORS.textMuted
  };
}

export function favoriteButtonStyle(active: boolean): CSSProperties {
  return {
    width: 32,
    height: 32,
    flex: "none",
    border: "none",
    background: "transparent",
    color: active ? COLORS.accent : "#C3B9AC",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 2
  };
}

export function sendButtonStyle(canSend: boolean): CSSProperties {
  return {
    flex: "none",
    width: 42,
    height: 42,
    borderRadius: 3,
    border: "none",
    cursor: canSend ? "pointer" : "default",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: canSend ? COLORS.accent : "#E6DDD0",
    color: canSend ? "#fff" : "#B5AB9E"
  };
}

export function dropZoneStyle(dragOver: boolean): CSSProperties {
  return {
    cursor: "pointer",
    borderRadius: 4,
    padding: "44px 24px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    textAlign: "center",
    border: `2px dashed ${dragOver ? COLORS.accent : "#D9CEBE"}`,
    background: dragOver ? COLORS.accentBg : COLORS.cardAlt
  };
}

export const pageStyle: CSSProperties = {
  flex: 1,
  overflow: "auto",
  padding: "26px 28px 40px"
};

export const headerStyle: CSSProperties = {
  height: 64,
  flex: "none",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "0 28px",
  borderBottom: "1px solid #E7DFD2",
  background: "#F8F4ED"
};
