import React, { useEffect, useState } from "react";
import {
  Box,
  ButtonBase,
  Chip,
  Container,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import AnalyticsRoundedIcon from "@mui/icons-material/AnalyticsRounded";
import AutoGraphRoundedIcon from "@mui/icons-material/AutoGraphRounded";
import ChatBubbleRoundedIcon from "@mui/icons-material/ChatBubbleRounded";
import CampaignRoundedIcon from "@mui/icons-material/CampaignRounded";
import InsightsRoundedIcon from "@mui/icons-material/InsightsRounded";
import AssignmentRoundedIcon from "@mui/icons-material/AssignmentRounded";
import RestaurantMenuRoundedIcon from "@mui/icons-material/RestaurantMenuRounded";
import VideoCameraFrontRoundedIcon from "@mui/icons-material/VideoCameraFrontRounded";
import Push from "./Push";
import Chats from "./Chats";
import Bookings from "./Bookings";
import DietDashboard from "./DietDashboard";
import LiveClasses from "./LiveClasses";

const tabs = [
  { id: "chats", label: "Chats", icon: ChatBubbleRoundedIcon },
  { id: "bookings", label: "Bookings", icon: AssignmentRoundedIcon },
  { id: "classes", label: "Live Classes", icon: VideoCameraFrontRoundedIcon },
  { id: "diet", label: "Diet", icon: RestaurantMenuRoundedIcon },
  { id: "analytics", label: "Analytics", icon: AnalyticsRoundedIcon },
  { id: "push", label: "Push", icon: CampaignRoundedIcon },
];

function Dashboard() {
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem("dashboardActiveTabV2") || "chats");

  useEffect(() => {
    localStorage.setItem("dashboardActiveTabV2", activeTab);
  }, [activeTab]);

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        color: "#101828",
        background:
          "linear-gradient(180deg, #eef6f3 0%, #f7f8fb 38%, #ffffff 100%)",
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
                <InsightsRoundedIcon />
              </Box>
              <Box>
                <Typography fontSize={20} fontWeight={950} lineHeight={1.05}>
                  Muditam Command Center
                </Typography>
                <Typography fontSize={12.5} color="text.secondary" fontWeight={700}>
                  Live support, campaigns and growth signals
                </Typography>
              </Box>
            </Stack>

            <Paper
              elevation={0}
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
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const selected = activeTab === tab.id;
                return (
                  <ButtonBase
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
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
                    {tab.label}
                  </ButtonBase>
                );
              })}
            </Paper>
          </Stack>
        </Container>
      </Box>

      <Box component="main" sx={{ px: { xs: 1.5, md: 3 }, py: { xs: 2, md: 2.5 } }}>
        {activeTab === "analytics" && (
          <Box sx={{ maxWidth: 1320, mx: "auto" }}>
            <Stack direction={{ xs: "column", md: "row" }} gap={2} mb={2}>
              {[
                ["Revenue pulse", "Live", "#0f766e"],
                ["Chat velocity", "Realtime", "#543287"],
                ["Campaign health", "Active", "#b45309"],
              ].map(([label, value, color]) => (
                <Paper
                  key={label}
                  elevation={0}
                  sx={{
                    flex: 1,
                    p: 2.25,
                    borderRadius: 3,
                    border: "1px solid rgba(16, 24, 40, 0.08)",
                    boxShadow: "0 18px 48px rgba(16, 24, 40, 0.08)",
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography fontSize={13} color="text.secondary" fontWeight={850}>
                      {label}
                    </Typography>
                    <AutoGraphRoundedIcon sx={{ color, fontSize: 22 }} />
                  </Stack>
                  <Typography fontSize={30} fontWeight={950} color={color} sx={{ mt: 1 }}>
                    {value}
                  </Typography>
                  <Chip
                    size="small"
                    label="Connected dashboard"
                    sx={{ mt: 1, borderRadius: 999, bgcolor: "#f2f4f7", fontWeight: 800 }}
                  />
                </Paper>
              ))}
            </Stack>
            <Paper
              elevation={0}
              sx={{
                p: 3,
                borderRadius: 3,
                border: "1px solid rgba(16, 24, 40, 0.08)",
                bgcolor: "#fff",
              }}
            >
              <Typography variant="h5" fontWeight={950}>
                Analytics
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.75 }}>
                Add your key business charts here. The live chat workspace is now the default dashboard view.
              </Typography>
            </Paper>
          </Box>
        )}
        {activeTab === "chats" && <Chats />}
        {activeTab === "bookings" && <Bookings />}
        {activeTab === "classes" && <LiveClasses />}
        {activeTab === "diet" && <DietDashboard />}
        {activeTab === "push" && <Push />}
      </Box>
    </Box>
  );
}

export default Dashboard;
