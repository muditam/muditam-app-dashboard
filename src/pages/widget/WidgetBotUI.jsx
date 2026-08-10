import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Skeleton, Stack, Switch, TextField, Typography } from "@mui/material";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import OpenInFullRoundedIcon from "@mui/icons-material/OpenInFullRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import ChatBubbleOutlineRoundedIcon from "@mui/icons-material/ChatBubbleOutlineRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { theme } from "./theme";
import WidgetLivePreview from "./WidgetLivePreview";

const TABS = [
  { key: "theme", label: "Theme & Branding", icon: PaletteRoundedIcon },
  { key: "position", label: "Widget Position", icon: OpenInFullRoundedIcon },
  { key: "visibility", label: "Widget Visibility", icon: VisibilityRoundedIcon },
  { key: "opening", label: "Opening Experience", icon: ChatBubbleOutlineRoundedIcon },
];

const THEME_PRESETS = ["#2563eb", "#16a34a", "#7c3aed", "#dc2626", "#ea580c", "#db2777", "#70408f"];

function resizeLauncherImage(file) {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      reject(new Error("Please choose an image file."));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error("Please choose an image smaller than 5 MB."));
      return;
    }
    const image = new Image();
    const objectUrl = URL.createObjectURL(file);
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 160;
      canvas.height = 160;
      const context = canvas.getContext("2d");
      if (!context) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("This browser could not prepare the image."));
        return;
      }
      const crop = Math.min(image.naturalWidth, image.naturalHeight);
      const sourceX = (image.naturalWidth - crop) / 2;
      const sourceY = (image.naturalHeight - crop) / 2;
      context.drawImage(image, sourceX, sourceY, crop, crop, 0, 0, 160, 160);
      URL.revokeObjectURL(objectUrl);
      resolve(canvas.toDataURL("image/jpeg", 0.84));
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("The selected image could not be read."));
    };
    image.src = objectUrl;
  });
}

function SectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.faint, mb: 1.25 }}>
      {children}
    </Typography>
  );
}

function FieldLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 13, fontWeight: 550, color: theme.ink, mb: 0.75 }}>
      {children}
    </Typography>
  );
}

function ColorSwatch({ color, selected, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        width: 52, height: 36, borderRadius: `${theme.radiusSmall}px`, bgcolor: color, cursor: "pointer",
        border: selected ? `2px solid ${theme.ink}` : "2px solid transparent",
        outline: selected ? `1px solid ${theme.border}` : "none",
        outlineOffset: 2,
      }}
    />
  );
}

function ColorPickerSwatch({ value, onChange, size = 36 }) {
  return (
    <Box sx={{ width: size, height: size }}>
      <input
        type="color"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        style={{
          width: "100%", height: "100%", border: `2px solid ${theme.accent}`,
          borderRadius: theme.radiusSmall, cursor: "pointer", padding: 0, background: "none",
        }}
      />
    </Box>
  );
}

function ChoiceButton({ label, selected, onClick }) {
  return (
    <Box
      onClick={onClick}
      sx={{
        flex: 1, textAlign: "center", py: 1.1, cursor: "pointer",
        borderRadius: `${theme.radiusSmall}px`,
        border: `1px solid ${selected ? theme.accent : theme.border}`,
        color: selected ? theme.accent : theme.ink,
        fontSize: 13.5, fontWeight: selected ? 650 : 500,
        bgcolor: selected ? theme.accentSoft : "transparent",
      }}
    >
      {label}
    </Box>
  );
}

function EmptyBox({ label }) {
  return (
    <Box
      sx={{
        height: 160, borderRadius: `${theme.radiusSmall}px`, border: `1px dashed ${theme.borderStrong}`,
        display: "grid", placeItems: "center", color: theme.faint, fontSize: 12.5, fontWeight: 550,
      }}
    >
      {label}
    </Box>
  );
}

function WidgetBotUI() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState("theme");

  useEffect(() => {
    let cancelled = false;
    commerceWidgetApi.getWidgetConfig()
      .then((data) => { if (!cancelled) setConfig(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const updateField = (key, value) => {
    setSaved(false);
    setConfig((current) => ({ ...current, [key]: value }));
  };

  const handleSave = () => {
    setSaving(true);
    setError(null);
    commerceWidgetApi.saveWidgetConfig(config)
      .then((data) => { setConfig(data); setSaved(true); })
      .catch((err) => setError(err.message))
      .finally(() => setSaving(false));
  };

  const handleLauncherImage = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      setError(null);
      const launcherImage = await resizeLauncherImage(file);
      updateField("launcherImage", launcherImage);
      if (/^#(?:f[0-9a-f]){3}$/i.test(config.themeColor) || config.themeColor?.toLowerCase() === "#ffffff") {
        updateField("themeColor", "#70408f");
      }
    } catch (uploadError) {
      setError(uploadError.message);
    }
  };

  if (loading) {
    return (
      <Box sx={{ maxWidth: 900 }}>
        <Skeleton variant="rounded" height={44} sx={{ mb: 3, borderRadius: `${theme.radiusSmall}px` }} />
        <Skeleton variant="rounded" height={320} sx={{ borderRadius: `${theme.radius}px` }} />
      </Box>
    );
  }

  if (!config) {
    return (
      <Box sx={{ maxWidth: 900 }}>
        <Alert severity="error" sx={{ borderRadius: 2 }}>
          Couldn't load widget config{error ? `: ${error}` : ""}.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1380 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          {error}
        </Alert>
      )}

      <Stack direction="row" flexWrap="wrap" gap={3} sx={{ borderBottom: `1px solid ${theme.border}`, mb: 3 }}>
        {TABS.map((tab) => {
          const selected = activeTab === tab.key;
          const Icon = tab.icon;
          return (
            <Stack
              key={tab.key}
              direction="row"
              alignItems="center"
              gap={0.6}
              onClick={() => setActiveTab(tab.key)}
              sx={{
                pb: 1.5, cursor: "pointer",
                fontSize: 13.5, fontWeight: selected ? 650 : 500,
                color: selected ? theme.ink : theme.muted,
                borderBottom: selected ? `2px solid ${theme.accent}` : "2px solid transparent",
                mb: "-1px",
              }}
            >
              <Icon sx={{ fontSize: 17 }} />
              {tab.label}
            </Stack>
          );
        })}
      </Stack>

      <Stack direction={{ xs: "column", lg: "row" }} alignItems="flex-start" gap={4}>
      <Box sx={{ flex: 1, minWidth: 0, width: "100%" }}>
      <Box sx={{ p: 3, borderRadius: `${theme.radius}px`, border: `1px solid ${theme.border}`, bgcolor: theme.surface }}>
        {activeTab === "theme" && (
          <Stack gap={3.5}>
            <Box>
              <SectionLabel>Chat Icon</SectionLabel>
              <FieldLabel>Launcher image</FieldLabel>
              <Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} gap={2}>
                <Box
                  sx={{
                    width: 72, height: 72, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center",
                    bgcolor: config.launcherImage ? "#f5f0f8" : config.themeColor,
                    color: "#fff", border: `4px solid #fff`, boxShadow: `0 0 0 1px ${theme.border}, 0 7px 20px rgba(48,31,57,.14)`,
                  }}
                >
                  {config.launcherImage
                    ? <Box component="img" src={config.launcherImage} alt="Launcher preview" sx={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <ChatBubbleOutlineRoundedIcon sx={{ fontSize: 29 }} />}
                </Box>
                <Stack direction="row" gap={1} flexWrap="wrap">
                  <Button component="label" variant="outlined" size="small" sx={{ textTransform: "none" }}>
                    {config.launcherImage ? "Replace image" : "Upload image"}
                    <input hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={handleLauncherImage} />
                  </Button>
                  {config.launcherImage && (
                    <Button size="small" color="inherit" onClick={() => updateField("launcherImage", null)} sx={{ textTransform: "none" }}>
                      Remove
                    </Button>
                  )}
                </Stack>
              </Stack>
              <Typography sx={{ mt: 1.25, fontSize: 12, color: theme.faint }}>
                Square portrait recommended. It will be cropped into a circle.
              </Typography>
            </Box>

            {!config.launcherImage && (
              <Box>
                <SectionLabel>Icon Color</SectionLabel>
                <FieldLabel>Choose a color when no image is uploaded</FieldLabel>
                <Stack direction="row" flexWrap="wrap" gap={1}>
                  {THEME_PRESETS.map((color) => (
                    <ColorSwatch
                      key={color}
                      color={color}
                      selected={config.themeColor?.toLowerCase() === color.toLowerCase()}
                      onClick={() => updateField("themeColor", color)}
                    />
                  ))}
                  <ColorPickerSwatch value={config.themeColor} onChange={(value) => updateField("themeColor", value)} size={36} />
                </Stack>
              </Box>
            )}

            {config.launcherImage && (
              <Box>
                <SectionLabel>Portrait Ring</SectionLabel>
                <FieldLabel>Choose a ring around the uploaded image</FieldLabel>
                <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} alignItems="stretch">
                  <ChoiceButton
                    label="Purple ring"
                    selected={config.launcherRingColor === "#70408f"}
                    onClick={() => updateField("launcherRingColor", "#70408f")}
                  />
                  <ChoiceButton
                    label="Custom ring"
                    selected={Boolean(config.launcherRingColor && config.launcherRingColor !== "#70408f")}
                    onClick={() => updateField(
                      "launcherRingColor",
                      config.launcherRingColor && config.launcherRingColor !== "#70408f"
                        ? config.launcherRingColor
                        : "#9b6bb5",
                    )}
                  />
                  <ChoiceButton
                    label="No ring"
                    selected={!config.launcherRingColor}
                    onClick={() => updateField("launcherRingColor", null)}
                  />
                </Stack>
                {config.launcherRingColor && config.launcherRingColor !== "#70408f" && (
                  <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.5 }}>
                    <ColorPickerSwatch
                      value={config.launcherRingColor}
                      onChange={(value) => updateField("launcherRingColor", value)}
                    />
                    <Typography sx={{ fontSize: 12, color: theme.muted }}>{config.launcherRingColor}</Typography>
                  </Stack>
                )}
              </Box>
            )}

            <Box>
              <SectionLabel>Bot Information</SectionLabel>
              <FieldLabel>Bot Title</FieldLabel>
              <TextField
                size="small"
                fullWidth
                value={config.botTitle}
                onChange={(event) => updateField("botTitle", event.target.value)}
              />
            </Box>

            <Box>
              <SectionLabel>Pulse Effect</SectionLabel>
              <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: config.pulseEffect ? 2 : 0 }}>
                <Box>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 550, color: theme.ink }}>
                    Animate a pulse ring around the chat icon
                  </Typography>
                  <Typography sx={{ fontSize: 12, color: theme.muted, mt: 0.25 }}>
                    Draws attention to the widget for first-time visitors.
                  </Typography>
                </Box>
                <Switch
                  checked={config.pulseEffect}
                  onChange={(event) => updateField("pulseEffect", event.target.checked)}
                />
              </Stack>
              {config.pulseEffect && (
                <Stack direction="row" alignItems="center" gap={1.25}>
                  <ColorPickerSwatch
                    value={config.pulseColor}
                    onChange={(value) => updateField("pulseColor", value)}
                  />
                  <TextField
                    size="small"
                    value={config.pulseColor}
                    onChange={(event) => updateField("pulseColor", event.target.value)}
                    sx={{ width: 140 }}
                  />
                </Stack>
              )}
            </Box>
          </Stack>
        )}

        {activeTab === "position" && (
          <Stack gap={3.5}>
            <Box>
              <FieldLabel>Widget Size</FieldLabel>
              <Typography sx={{ mb: 1.25, fontSize: 12, color: theme.faint }}>Controls the opened chat panel.</Typography>
              <Stack direction="row" gap={1.25}>
                {["small", "medium", "large"].map((size) => (
                  <ChoiceButton
                    key={size}
                    label={size[0].toUpperCase() + size.slice(1)}
                    selected={config.widgetSize === size}
                    onClick={() => updateField("widgetSize", size)}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <FieldLabel>Launcher Size</FieldLabel>
              <Typography sx={{ mb: 1.25, fontSize: 12, color: theme.faint }}>Controls only the circular chat icon.</Typography>
              <Stack direction="row" gap={1.25}>
                {["small", "medium", "large"].map((size) => (
                  <ChoiceButton
                    key={size}
                    label={size[0].toUpperCase() + size.slice(1)}
                    selected={(config.launcherSize || "medium") === size}
                    onClick={() => updateField("launcherSize", size)}
                  />
                ))}
              </Stack>
            </Box>

            <Box>
              <FieldLabel>Widget Position</FieldLabel>
              <Stack direction="row" gap={1.25} sx={{ maxWidth: 280 }}>
                {["left", "right"].map((position) => (
                  <ChoiceButton
                    key={position}
                    label={position[0].toUpperCase() + position.slice(1)}
                    selected={config.widgetPosition === position}
                    onClick={() => updateField("widgetPosition", position)}
                  />
                ))}
              </Stack>
            </Box>

            <Stack direction="row" gap={3}>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Gap from Side (px)</FieldLabel>
                <TextField
                  size="small"
                  type="number"
                  fullWidth
                  value={config.gapFromSide}
                  onChange={(event) => updateField("gapFromSide", Number(event.target.value))}
                />
              </Box>
              <Box sx={{ flex: 1 }}>
                <FieldLabel>Gap from Bottom (px)</FieldLabel>
                <TextField
                  size="small"
                  type="number"
                  fullWidth
                  value={config.gapFromBottom}
                  onChange={(event) => updateField("gapFromBottom", Number(event.target.value))}
                />
              </Box>
            </Stack>
          </Stack>
        )}

        {activeTab === "visibility" && (
          <EmptyBox label="Visibility rules aren't built yet — the widget always shows on every page." />
        )}

        {activeTab === "opening" && (
          <Stack gap={3}>
            <Box>
              <FieldLabel>Invitation background</FieldLabel>
              <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} alignItems="stretch">
                <ChoiceButton
                  label="Purple"
                  selected={!config.nudgeBackgroundColor || config.nudgeBackgroundColor === "#70408f"}
                  onClick={() => updateField("nudgeBackgroundColor", "#70408f")}
                />
                <ChoiceButton
                  label="White"
                  selected={config.nudgeBackgroundColor?.toLowerCase() === "#ffffff"}
                  onClick={() => updateField("nudgeBackgroundColor", "#ffffff")}
                />
                <ChoiceButton
                  label="Custom"
                  selected={Boolean(config.nudgeBackgroundColor
                    && !["#70408f", "#ffffff"].includes(config.nudgeBackgroundColor.toLowerCase()))}
                  onClick={() => updateField(
                    "nudgeBackgroundColor",
                    config.nudgeBackgroundColor && !["#70408f", "#ffffff"].includes(config.nudgeBackgroundColor.toLowerCase())
                      ? config.nudgeBackgroundColor
                      : "#9b6bb5",
                  )}
                />
              </Stack>
              {config.nudgeBackgroundColor
                && !["#70408f", "#ffffff"].includes(config.nudgeBackgroundColor.toLowerCase()) && (
                <Stack direction="row" alignItems="center" gap={1} sx={{ mt: 1.5 }}>
                  <ColorPickerSwatch
                    value={config.nudgeBackgroundColor}
                    onChange={(value) => updateField("nudgeBackgroundColor", value)}
                  />
                  <Typography sx={{ fontSize: 12, color: theme.muted }}>{config.nudgeBackgroundColor}</Typography>
                </Stack>
              )}
              <Typography sx={{ mt: 1, fontSize: 12, color: theme.faint }}>
                White uses the same white text with a black border.
              </Typography>
            </Box>
            <Box>
              <FieldLabel>Invitation popup</FieldLabel>
              <TextField
                size="small"
                fullWidth
                value={config.nudgeText}
                inputProps={{ maxLength: 60 }}
                onChange={(event) => updateField("nudgeText", event.target.value)}
                helperText="Appears after 3 seconds, hides after 5 seconds, and returns on icon hover."
              />
            </Box>
            <Box>
              <FieldLabel>Opening Message</FieldLabel>
              <TextField
                size="small"
                fullWidth
                multiline
                minRows={3}
                value={config.openingMessage}
                onChange={(event) => updateField("openingMessage", event.target.value)}
              />
            </Box>
          </Stack>
        )}
      </Box>

      <Stack direction="row" alignItems="center" justifyContent="flex-end" gap={1.5} sx={{ mt: 2.5 }}>
        {saved && <Typography sx={{ fontSize: 12.5, color: theme.muted }}>Saved</Typography>}
        <Button
          variant="contained"
          disableElevation
          disabled={saving}
          onClick={handleSave}
          sx={{ textTransform: "none", fontWeight: 650, bgcolor: theme.accent, "&:hover": { bgcolor: theme.accent } }}
        >
          {saving ? "Saving…" : "Save Changes"}
        </Button>
      </Stack>
      </Box>
      <Box sx={{ width: { xs: "100%", lg: 420 }, flex: { lg: "0 0 420px" } }}>
        <WidgetLivePreview config={config} />
      </Box>
      </Stack>
    </Box>
  );
}

export default WidgetBotUI;
