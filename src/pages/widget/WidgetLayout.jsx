import React from "react";
import { Box, Container, Stack, Typography, ButtonBase } from "@mui/material";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import SmartToyRoundedIcon from "@mui/icons-material/SmartToyRounded";

const navItems = [
  { path: "/widget/dashboard", label: "Dashboard", icon: DashboardRoundedIcon },
  { path: "/widget/conversations", label: "Conversations", icon: ForumRoundedIcon },
];

function WidgetLayout() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        color: "#101828",
        background: "linear-gradient(180deg, #eef6f3 0%, #f7f8fb 38%, #ffffff 100%)",
      }}
    >
      <Box
        component="header"
        sx={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          borderBottom: "1px solid rgba(16, 24, 40, 0.08)",
          bgcolor: "rgba(255,255,255,0.84)",
          backdropFilter: "blur(18px)",
        }}
      >
        <Container maxWidth={false} sx={{ px: { xs: 1.5, md: 3 }, py: 1.25 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Stack direction="row" alignItems="center" gap={1.25}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: 2,
                  display: "grid",
                  placeItems: "center",
                  color: "#fff",
                  background: "linear-gradient(135deg, #0f766e 0%, #543287 100%)",
                  boxShadow: "0 14px 34px rgba(15, 118, 110, 0.22)",
                }}
              >
                <SmartToyRoundedIcon />
              </Box>
              <Box>
                <Typography fontSize={20} fontWeight={950} lineHeight={1.05}>
                  AI Widget
                </Typography>
                <Typography fontSize={12.5} color="text.secondary" fontWeight={700}>
                  Storefront AI chat performance and conversations
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 0.5,
                p: 0.5,
                borderRadius: 2,
                border: "1px solid rgba(16, 24, 40, 0.08)",
                bgcolor: "#fff",
                overflowX: "auto",
              }}
            >
              {navItems.map((item) => {
                const Icon = item.icon;
                const selected = location.pathname.startsWith(item.path);
                return (
                  <ButtonBase
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    sx={{
                      minHeight: 40,
                      px: 1.5,
                      borderRadius: 1.5,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 0.75,
                      whiteSpace: "nowrap",
                      color: selected ? "#fff" : "#475467",
                      bgcolor: selected ? "#182230" : "transparent",
                      fontWeight: 850,
                      fontSize: 14,
                      "&:hover": {
                        bgcolor: selected ? "#182230" : "#f2f4f7",
                      },
                    }}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                    {item.label}
                  </ButtonBase>
                );
              })}
            </Box>
          </Stack>
        </Container>
      </Box>

      <Box component="main" sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 2.5 } }}>
        <Outlet />
      </Box>
    </Box>
  );
}

export default WidgetLayout;
