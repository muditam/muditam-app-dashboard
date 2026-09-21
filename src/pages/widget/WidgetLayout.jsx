import React, { useEffect, useState } from "react";
import { Box, Button, Stack, Typography } from "@mui/material";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { theme } from "./theme";
import WidgetLogin from "./WidgetLogin";
import { isAuthenticated, logout } from "./widgetAuth";

const navItems = [
  {
    path: "/widget/dashboard",
    label: "Dashboard",
    title: "AI Performance",
    subtitle: "Track performance and insights across your storefront chat",
  },
  {
    path: "/widget/conversations",
    label: "Chats",
    title: "Chats",
    subtitle: "Browse and review every AI widget conversation",
  },
  {
    path: "/widget/bot-ui",
    label: "Bot UI",
    title: "Bot UI",
    subtitle: "Customize how the chat widget looks and greets visitors",
  },
  {
    path: "/widget/bot-flow",
    label: "Bot Flow",
    title: "Bot Flow",
    subtitle: "Configure how the bot handles conversations and hand-offs",
  },
];

const sidebarWidth = 152;

function WidgetLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = navItems.find((item) => location.pathname.startsWith(item.path)) ?? navItems[0];
  const [authed, setAuthed] = useState(() => isAuthenticated());

  useEffect(() => {
    const handleUnauthorized = () => setAuthed(false);
    window.addEventListener("muditam-widget-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("muditam-widget-unauthorized", handleUnauthorized);
  }, []);

  if (!authed) {
    return <WidgetLogin onSuccess={() => setAuthed(true)} />;
  }

  const handleLogout = () => {
    logout();
    setAuthed(false);
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.canvas,
        display: { xs: "block", lg: "grid" },
        gridTemplateColumns: { lg: `${sidebarWidth}px minmax(0, 1fr)` },
      }}
    >
      <Box
        component="aside"
        sx={{
          display: { xs: "none", lg: "flex" },
          position: "sticky",
          top: 0,
          alignSelf: "start",
          height: "100vh",
          width: sidebarWidth,
          boxSizing: "border-box",
          flexDirection: "column",
          borderRight: `1px solid ${theme.border}`,
          bgcolor: "#fff",
          px: 1,
          py: 1.5,
        }}
      >
        <Typography sx={{ fontSize: 13.5, fontWeight: 760, color: theme.ink, px: 0.5, mb: 2 }}>
          Muditam AI
        </Typography>
        <Stack gap={0.2}>
          {navItems.map((item) => {
            const active = location.pathname.startsWith(item.path);
            return (
              <Box
                key={item.path}
                onClick={() => navigate(item.path)}
                sx={{
                  position: "relative",
                  minHeight: 32,
                  display: "flex",
                  alignItems: "center",
                  px: 0.9,
                  borderRadius: `${theme.radiusSmall}px`,
                  color: active ? theme.ink : theme.muted,
                  bgcolor: active ? theme.accentSoft : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: active ? 720 : 620,
                  lineHeight: 1,
                  "&:hover": { bgcolor: active ? theme.accentSoft : theme.canvas },
                  "&::before": active ? {
                    content: '""',
                    position: "absolute",
                    left: 0,
                    top: 8,
                    bottom: 8,
                    width: 3,
                    borderRadius: 99,
                    bgcolor: theme.accent,
                  } : {},
                }}
              >
                {item.label}
              </Box>
            );
          })}
        </Stack>
        <Box sx={{ flex: 1 }} />
        <Button
          disableRipple
          onClick={handleLogout}
          startIcon={<LogoutRoundedIcon sx={{ fontSize: 18 }} />}
          sx={{
            justifyContent: "flex-start",
            minHeight: 32,
            px: 0.9,
            borderRadius: `${theme.radiusSmall}px`,
            color: theme.muted,
            textTransform: "none",
            fontSize: 12,
            fontWeight: 600,
            "&:hover": { bgcolor: theme.canvas },
          }}
        >
          Log out
        </Button>
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Box
          component="header"
          sx={{
            position: "sticky",
            top: 0,
            zIndex: 10,
            borderBottom: `1px solid ${theme.border}`,
            bgcolor: "rgba(247, 246, 248, 0.96)",
            backdropFilter: "blur(10px)",
          }}
        >
            <Box sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 2.5, lg: 3 }, pt: { xs: 1.25, sm: 1.4 } }}>
            <Typography sx={{ display: { lg: "none" }, fontSize: 15, fontWeight: 760, color: theme.ink, mb: 1.25 }}>
              Muditam AI
            </Typography>
            <Stack
              direction="row"
              gap={0.75}
              sx={{
                display: { xs: "flex", lg: "none" },
                overflowX: "auto",
                pb: 1,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              {navItems.map((item) => {
                const active = location.pathname.startsWith(item.path);
                return (
                  <Button
                    key={item.path}
                    disableRipple
                    onClick={() => navigate(item.path)}
                    sx={{
                      flex: "0 0 auto",
                      minHeight: 34,
                      px: 1.4,
                      borderRadius: 99,
                      color: active ? theme.accent : theme.ink,
                      bgcolor: active ? theme.accentSoft : "rgba(255,255,255,.72)",
                      border: `1px solid ${active ? theme.accentSoft : theme.border}`,
                      textTransform: "none",
                      fontSize: 12.5,
                      fontWeight: active ? 700 : 600,
                    }}
                  >
                    {item.label}
                  </Button>
                );
              })}
              <Button
                disableRipple
                onClick={handleLogout}
                startIcon={<LogoutRoundedIcon sx={{ fontSize: 17 }} />}
                sx={{
                  flex: "0 0 auto",
                  minHeight: 34,
                  px: 1.4,
                  borderRadius: 99,
                  color: theme.muted,
                  bgcolor: "rgba(255,255,255,.72)",
                  border: `1px solid ${theme.border}`,
                  textTransform: "none",
                  fontSize: 12.5,
                  fontWeight: 600,
                }}
              >
                Logout
              </Button>
            </Stack>

            <Box sx={{ py: { xs: 1.25, sm: 1.45 } }}>
              <Typography sx={{ fontSize: { xs: 22, md: 24 }, fontWeight: 760, color: theme.ink, lineHeight: 1.15 }}>
                {current.title}
              </Typography>
              <Typography sx={{ fontSize: 13, color: theme.muted, mt: 0.45, maxWidth: "100%", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {current.subtitle}
              </Typography>
            </Box>
          </Box>
        </Box>

        <Box component="main" sx={{ maxWidth: 1280, mx: "auto", px: { xs: 2, sm: 2.5, lg: 3 }, py: { xs: 2.25, md: 3 }, minWidth: 0 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}

export default WidgetLayout;
