import React, { useState } from "react";
import {
  Alert,
  Box,
  ButtonBase,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";

const subTabs = ["Overview", "Sales", "Support"];

const kpis = [
  { key: "totalConversations", label: "Total Conversations", icon: ForumRoundedIcon, color: "#2563eb" },
  { key: "assistedOrderValue", label: "Assisted Order Value", icon: PaidRoundedIcon, color: "#0f766e" },
  { key: "orderValueUtm", label: "Order Value (UTM)", icon: TrendingUpRoundedIcon, color: "#7c3aed" },
  { key: "addToCartAssisted", label: "Add to Cart Assisted", icon: ShoppingCartRoundedIcon, color: "#c2410c" },
  { key: "resolutionRate", label: "Resolution Rate", icon: CheckCircleRoundedIcon, color: "#15803d" },
  { key: "leadCaptures", label: "Lead Captures", icon: MailRoundedIcon, color: "#4338ca" },
  { key: "interactionRate", label: "Interaction %", icon: GroupsRoundedIcon, color: "#0e7490" },
];

function KpiCard({ label, icon: Icon, color }) {
  return (
    <Paper
      elevation={0}
      sx={{
        flex: "1 1 220px",
        p: 2.25,
        borderRadius: 3,
        border: "1px solid rgba(16, 24, 40, 0.08)",
      }}
    >
      <Stack direction="row" alignItems="center" justifyContent="space-between">
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: 2,
            display: "grid",
            placeItems: "center",
            bgcolor: `${color}1a`,
            color,
          }}
        >
          <Icon sx={{ fontSize: 20 }} />
        </Box>
      </Stack>
      <Typography fontSize={28} fontWeight={950} sx={{ mt: 1.5 }}>
        —
      </Typography>
      <Typography fontSize={13} color="text.secondary" fontWeight={700}>
        {label}
      </Typography>
    </Paper>
  );
}

function SectionPlaceholder({ title, description }) {
  return (
    <Paper
      elevation={0}
      sx={{ flex: "1 1 420px", p: 3, borderRadius: 3, border: "1px solid rgba(16, 24, 40, 0.08)" }}
    >
      <Typography fontWeight={950} fontSize={17}>
        {title}
      </Typography>
      <Typography color="text.secondary" fontSize={13.5} sx={{ mt: 0.5 }}>
        {description}
      </Typography>
      <Box
        sx={{
          mt: 2.5,
          height: 160,
          borderRadius: 2,
          border: "1px dashed rgba(16, 24, 40, 0.15)",
          display: "grid",
          placeItems: "center",
          color: "text.secondary",
          fontSize: 13,
          fontWeight: 700,
        }}
      >
        No data yet
      </Box>
    </Paper>
  );
}

function WidgetDashboard() {
  const [activeSubTab, setActiveSubTab] = useState("Overview");

  return (
    <Box sx={{ maxWidth: 1320, mx: "auto" }}>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" alignItems={{ md: "center" }} gap={1.5} mb={2}>
        <Box>
          <Typography fontSize={24} fontWeight={950}>
            AI Performance Dashboard
          </Typography>
          <Typography color="text.secondary" fontSize={13.5}>
            Track performance and insights across your business
          </Typography>
        </Box>
      </Stack>

      <Box
        sx={{
          display: "inline-flex",
          gap: 0.5,
          p: 0.5,
          mb: 2.5,
          borderRadius: 2,
          border: "1px solid rgba(16, 24, 40, 0.08)",
          bgcolor: "#fff",
        }}
      >
        {subTabs.map((tab) => {
          const selected = activeSubTab === tab;
          return (
            <ButtonBase
              key={tab}
              onClick={() => setActiveSubTab(tab)}
              sx={{
                px: 1.75,
                py: 0.75,
                borderRadius: 1.5,
                fontWeight: 850,
                fontSize: 14,
                color: selected ? "#fff" : "#475467",
                bgcolor: selected ? "#182230" : "transparent",
                "&:hover": { bgcolor: selected ? "#182230" : "#f2f4f7" },
              }}
            >
              {tab}
            </ButtonBase>
          );
        })}
      </Box>

      <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
        This dashboard isn't connected to live data yet — conversations aren't being persisted by the backend
        yet, so every metric below is a placeholder. Once persistence and the analytics endpoints ship, these
        cards will populate automatically.
      </Alert>

      {activeSubTab === "Overview" && (
        <>
          <Stack direction="row" flexWrap="wrap" gap={2} mb={2}>
            {kpis.map((kpi) => (
              <KpiCard key={kpi.key} {...kpi} />
            ))}
          </Stack>

          <Stack direction={{ xs: "column", md: "row" }} gap={2}>
            <SectionPlaceholder
              title="Conversion Funnel"
              description="Conversation → Add to Cart → Order journey"
            />
            <SectionPlaceholder
              title="Top 5 User Intents"
              description="Top 5 user intents that occurred"
            />
          </Stack>
        </>
      )}

      {activeSubTab !== "Overview" && (
        <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: "1px solid rgba(16, 24, 40, 0.08)", textAlign: "center" }}>
          <Typography fontWeight={850} color="text.secondary">
            {activeSubTab} view is not scoped yet.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}

export default WidgetDashboard;
