import React, { useEffect, useState } from "react";
import { Box, Drawer, IconButton, List, ListItemButton, ListItemText, Stack, Typography, Divider } from "@mui/material";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
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

function WidgetLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const current = navItems.find((item) => location.pathname.startsWith(item.path)) ?? navItems[0];
  const [authed, setAuthed] = useState(() => isAuthenticated());
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const handleUnauthorized = () => setAuthed(false);
    window.addEventListener("muditam-widget-unauthorized", handleUnauthorized);
    return () => window.removeEventListener("muditam-widget-unauthorized", handleUnauthorized);
  }, []);

  if (!authed) {
    return <WidgetLogin onSuccess={() => setAuthed(true)} />;
  }

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
            <IconButton onClick={() => setDrawerOpen(true)} size="small">
              <MenuRoundedIcon sx={{ fontSize: 22, color: theme.ink }} />
            </IconButton>
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

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 260, display: "flex", flexDirection: "column" }}>
          <Typography sx={{ fontSize: 12.5, fontWeight: 650, color: theme.faint, px: 2.5, pt: 2.5, pb: 1 }}>
            Muditam AI
          </Typography>
          <List sx={{ px: 1 }}>
            {navItems.map((item) => {
              const active = location.pathname.startsWith(item.path);
              return (
                <ListItemButton
                  key={item.path}
                  selected={active}
                  onClick={() => { navigate(item.path); setDrawerOpen(false); }}
                  sx={{
                    borderRadius: `${theme.radiusSmall}px`,
                    mb: 0.5,
                    "&.Mui-selected": { bgcolor: theme.accentSoft, "&:hover": { bgcolor: theme.accentSoft } },
                  }}
                >
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontSize: 14,
                      fontWeight: active ? 650 : 500,
                      color: active ? theme.accent : theme.ink,
                    }}
                  />
                </ListItemButton>
              );
            })}
          </List>
          <Divider sx={{ mt: 0.5 }} />
          <ListItemButton
            onClick={() => { logout(); setAuthed(false); setDrawerOpen(false); }}
            sx={{ px: 2.5, py: 1.75 }}
          >
            <LogoutRoundedIcon sx={{ fontSize: 18, color: theme.muted, mr: 1.25 }} />
            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 550, color: theme.muted }} primary="Log out" />
          </ListItemButton>
        </Box>
      </Drawer>

      <Box component="main" sx={{ px: { xs: 2, sm: 3, md: 5 }, py: { xs: 3, md: 4 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default WidgetLayout;
