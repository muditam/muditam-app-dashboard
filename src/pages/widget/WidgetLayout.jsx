import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { theme } from "./theme";

const navItems = [
  {
    path: "/widget/dashboard",
    label: "Dashboard",
    title: "AI Performance",
    subtitle: "Track performance and insights across your storefront chat",
  },
  {
    path: "/widget/conversations",
    label: "Conversations",
    title: "Conversations",
    subtitle: "Browse and review every AI widget conversation",
  },
];

function WidgetLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = navItems.find((item) => location.pathname.startsWith(item.path)) ?? navItems[0];

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: theme.canvas }}>
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 10,
          borderBottom: `1px solid ${theme.border}`,
          bgcolor: "rgba(251, 251, 252, 0.9)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Box sx={{ px: { xs: 2.5, md: 5 }, pt: { xs: 1.5, sm: 1.75 } }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Typography sx={{ fontSize: 12.5, fontWeight: 650, color: theme.faint, letterSpacing: "0.01em" }}>
              Muditam AI
            </Typography>
            <Stack direction="row" gap={{ xs: 2, sm: 3 }}>
              {navItems.map((item) => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <Box
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      cursor: "pointer",
                      fontSize: 13.5,
                      fontWeight: active ? 650 : 500,
                      color: active ? theme.ink : theme.muted,
                      pb: 0.5,
                      borderBottom: active ? `2px solid ${theme.accent}` : "2px solid transparent",
                    }}
                  >
                    {item.label}
                  </Box>
                );
              })}
            </Stack>
          </Stack>

          <Box sx={{ py: { xs: 1.75, sm: 2 } }}>
            <Typography sx={{ fontSize: { xs: 22, md: 24 }, fontWeight: 700, letterSpacing: "-0.02em", color: theme.ink }}>
              {current.title}
            </Typography>
            <Typography sx={{ fontSize: 13, color: theme.muted, mt: 0.35 }}>
              {current.subtitle}
            </Typography>
          </Box>
        </Box>
      </Box>

      <Box component="main" sx={{ px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default WidgetLayout;
