import React, { useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import SendRoundedIcon from "@mui/icons-material/SendRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { theme } from "./theme";

const SIZE = {
  small: { width: 318, height: 470 },
  medium: { width: 342, height: 510 },
  large: { width: 366, height: 550 },
};

const LAUNCHER_SIZE = { small: 48, medium: 56, large: 76 };

function colorMix(hex, target, amount) {
  const value = hex?.replace("#", "") || "70408f";
  const channels = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  const targetChannels = target === "white" ? [255, 255, 255] : [0, 0, 0];
  return `#${channels.map((channel, index) => Math.round(channel + (targetChannels[index] - channel) * amount).toString(16).padStart(2, "0")).join("")}`;
}

function contrastSafeAccent(hex) {
  const value = hex?.replace("#", "") || "70408f";
  const [r, g, b] = [0, 2, 4].map((index) => Number.parseInt(value.slice(index, index + 2), 16));
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255 > 0.78 ? "#70408f" : hex;
}

function Launcher({ config, accent, nudgeBackground, nudgeTextColor, nudgeBorder, size, showNudge, onClick }) {
  return (
    <Stack direction={config.widgetPosition === "left" ? "row" : "row-reverse"} alignItems="center" gap={1.2}>
      <Box
        onClick={onClick}
        sx={{
          position: "relative", width: size, height: size, flex: `0 0 ${size}px`, borderRadius: "50%",
          display: "grid", placeItems: "center", cursor: "pointer", color: "#fff", bgcolor: accent,
          boxShadow: `0 10px 25px ${accent}40`,
          border: config.launcherImage && config.launcherRingColor ? `4px solid ${config.launcherRingColor}` : 0,
        }}
      >
        {config.launcherImage
          ? <Box component="img" src={config.launcherImage} alt="" sx={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} />
          : <ChatBubbleOutlineRoundedIcon sx={{ fontSize: size * 0.43 }} />}
        <Box sx={{ position: "absolute", right: -1, bottom: 2, width: 14, height: 14, borderRadius: "50%", bgcolor: "#16b979", border: "3px solid #fff" }} />
      </Box>
      {showNudge && (
        <Box sx={{ position: "relative", px: 2, py: 1.25, borderRadius: 99, bgcolor: nudgeBackground, color: nudgeTextColor, border: `1px solid ${nudgeBorder}`, boxShadow: `0 9px 22px ${nudgeBackground}35`, whiteSpace: "nowrap" }}>
          <Typography sx={{ color: nudgeTextColor, fontSize: 13.5, fontWeight: 700 }}>{config.nudgeText?.trim() || "Chat with live agent"}</Typography>
          <Box sx={{ position: "absolute", top: -8, right: config.widgetPosition === "left" ? "auto" : -7, left: config.widgetPosition === "left" ? -7 : "auto", width: 25, height: 25, borderRadius: "50%", display: "grid", placeItems: "center", color: theme.muted, bgcolor: "#fff", boxShadow: "0 2px 8px rgba(31,20,37,.15)" }}>
            <CloseRoundedIcon sx={{ fontSize: 16 }} />
          </Box>
        </Box>
      )}
    </Stack>
  );
}

function WidgetLivePreview({ config }) {
  const [open, setOpen] = useState(true);
  const size = SIZE[config.widgetSize] || SIZE.medium;
  const launcherSize = LAUNCHER_SIZE[config.launcherSize] || LAUNCHER_SIZE.medium;
  const accent = contrastSafeAccent(config.themeColor);
  const dark = colorMix(accent, "black", 0.18);
  const soft = colorMix(accent, "white", 0.92);
  const nudgeBackground = config.nudgeBackgroundColor || "#70408f";
  const nudgeTextColor = "#ffffff";
  const nudgeBorder = nudgeBackground.toLowerCase() === "#ffffff" ? "#17131a" : "transparent";

  return (
    <Box sx={{ position: { lg: "sticky" }, top: { lg: 116 }, alignSelf: "flex-start", width: "100%" }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Box>
          <Typography sx={{ fontSize: 13.5, fontWeight: 700, color: theme.ink }}>Live preview</Typography>
          <Typography sx={{ fontSize: 11.5, color: theme.faint }}>Updates as you edit</Typography>
        </Box>
        <Stack direction="row" gap={0.75}>
          <Button size="small" variant={open ? "contained" : "outlined"} onClick={() => setOpen(true)} sx={{ minWidth: 0, px: 1.25, textTransform: "none", fontSize: 11, bgcolor: open ? accent : undefined }}>Open</Button>
          <Button size="small" variant={!open ? "contained" : "outlined"} onClick={() => setOpen(false)} sx={{ minWidth: 0, px: 1.25, textTransform: "none", fontSize: 11, bgcolor: !open ? accent : undefined }}>Launcher</Button>
        </Stack>
      </Stack>

      <Box sx={{ minHeight: 610, p: 2, border: `1px solid ${theme.border}`, borderRadius: `${theme.radius}px`, bgcolor: "#f4f1f5", backgroundImage: "radial-gradient(circle at 15% 10%, rgba(112,64,143,.08), transparent 30%)", display: "flex", flexDirection: "column", alignItems: config.widgetPosition === "left" ? "flex-start" : "flex-end", justifyContent: "flex-end", overflow: "hidden" }}>
        {open && (
          <Box sx={{ width: `min(100%, ${size.width}px)`, height: size.height, mb: 1.5, display: "grid", gridTemplateRows: "auto 1fr auto", overflow: "hidden", borderRadius: 3, bgcolor: "#fdfcfd", border: `1px solid ${accent}1f`, boxShadow: "0 20px 55px rgba(47,31,55,.18)" }}>
            <Stack direction="row" alignItems="center" gap={1.1} sx={{ px: 1.5, py: 1.3, borderBottom: "1px solid #ebe5ee", bgcolor: "rgba(255,255,255,.96)" }}>
              <Box sx={{ width: 36, height: 36, overflow: "hidden", borderRadius: "50%", display: "grid", placeItems: "center", color: "#fff", background: `linear-gradient(145deg, ${accent}, ${dark})`, fontFamily: "Georgia,serif", fontSize: 21, fontWeight: 700 }}>
                {config.launcherImage
                  ? <Box component="img" src={config.launcherImage} alt="" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  : "m"}
              </Box>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 700, color: "#211b27" }}>{config.botTitle}</Typography>
                <Typography noWrap sx={{ mt: 0.2, fontSize: 9.5, color: "#766d7d" }}><Box component="span" sx={{ display: "inline-block", width: 6, height: 6, mr: 0.5, borderRadius: "50%", bgcolor: "#38a169" }} />Online · Typically replies instantly</Typography>
              </Box>
              <CloseRoundedIcon sx={{ fontSize: 20, color: "#756d7b" }} />
            </Stack>

            <Box sx={{ p: 1.6, overflow: "hidden" }}>
              <Box sx={{ maxWidth: "86%", px: 1.35, py: 1.05, borderRadius: "16px 16px 16px 6px", bgcolor: soft, color: "#302637", fontSize: 12.5, lineHeight: 1.45 }}>
                {config.openingMessage}
              </Box>
              <Box sx={{ width: "62%", ml: "auto", mt: 1, px: 1.35, py: 1.05, borderRadius: "16px 16px 6px 16px", bgcolor: accent, color: "#fff", fontSize: 12.5 }}>
                Which product is right for me?
              </Box>
              <Box sx={{ maxWidth: "82%", mt: 1, px: 1.35, py: 1.05, borderRadius: "16px 16px 16px 6px", bgcolor: soft, color: "#302637", fontSize: 12.5, lineHeight: 1.45 }}>
                I can help you find the best Muditam product for your wellness goals.
              </Box>
            </Box>

            <Box sx={{ px: 1.3, pt: 1.1, pb: 1, borderTop: "1px solid #ebe5ee", bgcolor: "#fff" }}>
              <Stack direction="row" gap={0.75}>
                <Box sx={{ flex: 1, px: 1.2, py: 1, border: "1px solid #ded5e3", borderRadius: 1.5, bgcolor: "#fbf9fc", color: "#a098a5", fontSize: 11.5 }}>Ask about a product…</Box>
                <Box sx={{ width: 38, height: 38, borderRadius: 1.5, display: "grid", placeItems: "center", color: "#fff", bgcolor: accent }}><SendRoundedIcon sx={{ fontSize: 18 }} /></Box>
              </Stack>
              <Typography sx={{ mt: 0.65, textAlign: "center", color: "#9a919f", fontSize: 8.5 }}>AI can make mistakes. Please verify important information.</Typography>
            </Box>
          </Box>
        )}

        <Launcher config={config} accent={accent} nudgeBackground={nudgeBackground} nudgeTextColor={nudgeTextColor} nudgeBorder={nudgeBorder} size={launcherSize} showNudge={!open} onClick={() => setOpen((current) => !current)} />
      </Box>
    </Box>
  );
}

export default WidgetLivePreview;
