// Shared design tokens for the /widget section. Deliberately distinct from the
// main dashboard (no gradients, no per-card rainbow icon colors) — a restrained
// neutral palette with a single accent, used consistently across all three pages.
export const theme = {
  ink: "#111113",
  muted: "#8a8a92",
  faint: "#b8b8c0",
  border: "#ececee",
  borderStrong: "#e0e0e4",
  surface: "#ffffff",
  canvas: "#fbfbfc",
  accent: "#5b3df0",
  accentSoft: "#efeafe",
  danger: "#d64545",
  dangerSoft: "#fdeeee",
  radius: 14,
  radiusSmall: 10,
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
