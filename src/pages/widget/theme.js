// Shared design tokens for the /widget section. Deliberately distinct from the
// main dashboard (no gradients, no per-card rainbow icon colors) — a restrained
// neutral palette with a single accent, used consistently across all three pages.
export const theme = {
  ink: "#151417",
  muted: "#74717b",
  faint: "#aaa6b2",
  border: "#e8e5ec",
  borderStrong: "#d9d4de",
  surface: "#ffffff",
  canvas: "#f7f6f8",
  accent: "#70408f",
  accentSoft: "#f2ecf6",
  danger: "#d64545",
  dangerSoft: "#fdeeee",
  radius: 12,
  radiusSmall: 8,
  shadow: "0 14px 36px rgba(38, 30, 44, 0.06)",
  shadowSoft: "0 8px 22px rgba(38, 30, 44, 0.045)",
  // Matches the actual storefront widget's own chat bubble colors exactly
  // (apps/storefront-widget/src/styles.css), so the transcript view here looks
  // like the real conversation the customer saw, not a generic admin-UI restyle.
  chatUserGradient: "linear-gradient(145deg, #7d4e99, #70408f)",
  chatAssistantBg: "#f7f4f9",
  chatAssistantText: "#302637",
  widgetBorder: "#ebe5ee",
  widgetPurpleDark: "#57316f",
  widgetWhatsappGreen: "#209d58",
};
