import React, { useMemo, useState } from "react";
import { Box, Button, Modal, Stack, Typography } from "@mui/material";
import { adminAccessApplication, applicationCatalog } from "./auth";

function AppIcon({ type }) {
  if (type === "shiptrack") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 7.5 12 3l8.5 4.5L12 12 3.5 7.5Z" /><path d="M3.5 7.5V17L12 21l8.5-4V7.5M12 12v9" /></svg>;
  if (type === "ticketing") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v3a2.5 2.5 0 0 0 0 5v3A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5v-3a2.5 2.5 0 0 0 0-5v-3Z" /><path d="M12 7v2M12 12v5" /></svg>;
  if (type === "finance") return <span aria-hidden="true">₹</span>;
  if (type === "sales") return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V5M4 19h16" /><path d="m7 15 4-4 3 2 5-6" /><path d="M15 7h4v4" /></svg>;
  if (type === "hr-incentives") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="8" cy="8" r="3"/><path d="M3 19c.4-3.4 2.1-5 5-5s4.6 1.6 5 5M16 7h5M18.5 4.5v5M16 15h5M16 19h5"/></svg>;
  if (type === "app-dashboard") return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
  if (type === "admin-access") return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="3.5"/><path d="M3.5 19c.4-3.6 2.2-5.5 5.5-5.5s5.1 1.9 5.5 5.5"/><path d="M17.5 12.5v6M14.5 15.5h6"/></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v8a2.5 2.5 0 0 1-2.5 2.5H11l-4.5 4v-4A2.5 2.5 0 0 1 4 13.5v-8Z"/><path d="M8 8h8M8 12h5"/></svg>;
}

const iconStyles = {
  shiptrack: { bgcolor: "#eee8f6", color: "#4d2877" },
  ticketing: { bgcolor: "#3d1f65", color: "#fff" },
  finance: { bgcolor: "#e8f6ef", color: "#16734f" },
  sales: { bgcolor: "#fff0e6", color: "#b45d2b" },
  "hr-incentives": { bgcolor: "#edf1fb", color: "#315b9c" },
  "app-dashboard": { bgcolor: "#e8edf6", color: "#315b9c" },
  "chat-dashboard": { bgcolor: "#eef2ee", color: "#4f655c" },
  "admin-access": { bgcolor: "#f1ecf5", color: "#5b358b" },
};

function visibleApplications(user) {
  if (!user) return [];
  if (user.accountRole === "superadmin") return [...applicationCatalog, adminAccessApplication];
  const allowed = new Set(user.applications || []);
  return applicationCatalog.filter((application) => allowed.has(application.id));
}

export default function ApplicationSwitcher({ user, trigger }) {
  const [open, setOpen] = useState(false);
  const apps = useMemo(() => visibleApplications(user), [user]);
  if (apps.length <= 1) return null;

  return (
    <>
      {trigger({ open: () => setOpen(true) })}
      <Modal open={open} onClose={() => setOpen(false)} aria-labelledby="application-switch-title">
        <Box sx={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(680px, calc(100vw - 32px))",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
          p: 2.75,
          borderRadius: 3,
          border: "1px solid #e6e0eb",
          bgcolor: "#fff",
          boxShadow: "0 30px 80px rgba(31,18,40,.25)",
        }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2.25 }}>
            <Box>
              <Typography sx={{ fontSize: 9, fontWeight: 900, letterSpacing: ".14em", color: "#70408f" }}>WORKSPACES</Typography>
              <Typography id="application-switch-title" sx={{ mt: 0.4, fontSize: 22, fontWeight: 900 }}>All applications</Typography>
            </Box>
            <Button onClick={() => setOpen(false)} sx={{ minWidth: 34, width: 34, height: 34, borderRadius: 2, color: "#655a6e" }}>×</Button>
          </Stack>
          <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" }, gap: 1.25 }}>
            {apps.map((application) => (
              <Box component="a" href={application.href} key={application.id} sx={{
                minHeight: 104,
                p: 1.75,
                display: "grid",
                gridTemplateColumns: "42px minmax(0, 1fr)",
                alignItems: "center",
                gap: "3px 12px",
                border: "1px solid #e7e1eb",
                borderRadius: 2,
                color: "#101828",
                textDecoration: "none",
                bgcolor: "#fff",
                "&:hover": { borderColor: "#b99dcc", bgcolor: "#fbf8fc" },
                "& svg": { width: 21, height: 21, fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round" },
              }}>
                <Box sx={{ gridRow: "1 / 4", width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 2, fontSize: 18, fontWeight: 900, ...(iconStyles[application.id] || iconStyles["chat-dashboard"]) }}><AppIcon type={application.id} /></Box>
                <Typography sx={{ fontSize: 13, fontWeight: 850 }}>{application.label}</Typography>
                <Typography sx={{ color: "#6b6470", fontSize: 10.5, lineHeight: 1.35 }}>{application.description}</Typography>
                <Typography sx={{ color: "#70408f", fontSize: 9.5, fontWeight: 850 }}>Open →</Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </Modal>
    </>
  );
}
