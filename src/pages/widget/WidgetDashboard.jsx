import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  ButtonBase,
  CircularProgress,
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
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";

const subTabs = ["Overview", "Sales", "Support"];

const kpis = [
  { key: "totalConversations", label: "Total Conversations", icon: ForumRoundedIcon, color: "#2563eb", overviewKey: "totalConversations" },
  { key: "assistedOrderValue", label: "Assisted Order Value", icon: PaidRoundedIcon, color: "#0f766e", overviewKey: null },
  { key: "orderValueUtm", label: "Order Value (UTM)", icon: TrendingUpRoundedIcon, color: "#7c3aed", overviewKey: null },
  { key: "addToCartAssisted", label: "Add to Cart Assisted", icon: ShoppingCartRoundedIcon, color: "#c2410c", overviewKey: null },
  { key: "resolutionRate", label: "Resolution Rate", icon: CheckCircleRoundedIcon, color: "#15803d", overviewKey: "resolutionRate", suffix: "%" },
  { key: "leadCaptures", label: "Lead Captures", icon: MailRoundedIcon, color: "#4338ca", overviewKey: "leadCaptures" },
  { key: "interactionRate", label: "Interaction %", icon: GroupsRoundedIcon, color: "#0e7490", overviewKey: null },
];

function KpiCard({ label, icon: Icon, color, value, suffix }) {
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
        {value === undefined || value === null ? "—" : `${value}${suffix ?? ""}`}
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

function RankedList({ items, emptyLabel, barColor = "#182230" }) {
  if (!items?.length) {
    return (
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
        {emptyLabel}
      </Box>
    );
  }
  const max = Math.max(...items.map((item) => item.count));
  return (
    <Stack gap={1.25} sx={{ mt: 2.5 }}>
      {items.map((item) => (
        <Box key={item.label}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
            <Typography fontSize={13} fontWeight={800}>
              {item.label}
            </Typography>
            <Typography fontSize={13} color="text.secondary" fontWeight={800}>
              {item.count}
            </Typography>
          </Stack>
          <Box sx={{ height: 8, borderRadius: 999, bgcolor: "#f2f4f7", overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${(item.count / max) * 100}%`, bgcolor: barColor }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function PanelCard({ title, description, children }) {
  return (
    <Paper elevation={0} sx={{ flex: "1 1 420px", p: 3, borderRadius: 3, border: "1px solid rgba(16, 24, 40, 0.08)" }}>
      <Typography fontWeight={950} fontSize={17}>
        {title}
      </Typography>
      <Typography color="text.secondary" fontSize={13.5} sx={{ mt: 0.5 }}>
        {description}
      </Typography>
      {children}
    </Paper>
  );
}

function ProductRecommendationsTable({ products }) {
  if (!products?.length) {
    return (
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
        No recommendations yet
      </Box>
    );
  }
  return (
    <Stack gap={1} sx={{ mt: 2.5 }}>
      <Stack direction="row" sx={{ px: 0.5 }}>
        <Typography fontSize={11.5} color="text.secondary" fontWeight={800} sx={{ flex: 1, textTransform: "uppercase" }}>
          Product
        </Typography>
        <Typography fontSize={11.5} color="text.secondary" fontWeight={800} sx={{ width: 90, textAlign: "right", textTransform: "uppercase" }}>
          Recommended
        </Typography>
        <Typography fontSize={11.5} color="text.secondary" fontWeight={800} sx={{ width: 70, textAlign: "right", textTransform: "uppercase" }}>
          Clicked
        </Typography>
        <Typography fontSize={11.5} color="text.secondary" fontWeight={800} sx={{ width: 60, textAlign: "right", textTransform: "uppercase" }}>
          CTR
        </Typography>
      </Stack>
      {products.map((product) => (
        <Stack key={product.productSlug} direction="row" alignItems="center" sx={{ px: 0.5, py: 0.5 }}>
          <Typography fontSize={13.5} fontWeight={700} sx={{ flex: 1 }}>
            {product.productSlug}
          </Typography>
          <Typography fontSize={13.5} sx={{ width: 90, textAlign: "right" }}>
            {product.recommended}
          </Typography>
          <Typography fontSize={13.5} sx={{ width: 70, textAlign: "right" }}>
            {product.clicked}
          </Typography>
          <Typography fontSize={13.5} fontWeight={800} sx={{ width: 60, textAlign: "right" }}>
            {product.clickThroughRate}%
          </Typography>
        </Stack>
      ))}
    </Stack>
  );
}

function WidgetDashboard() {
  const [activeSubTab, setActiveSubTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    commerceWidgetApi.getOverview()
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
        {loading && <CircularProgress size={20} />}
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

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          Couldn't load live data: {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
        Total Conversations, Resolution Rate, Lead Captures, and Top Intents are live. Assisted Order Value,
        Order Value (UTM), Add to Cart Assisted, and Interaction % need order/cart attribution that isn't
        built yet, so those still show as unavailable.
      </Alert>

      {activeSubTab === "Overview" && (
        <>
          <Stack direction="row" flexWrap="wrap" gap={2} mb={2}>
            {kpis.map((kpi) => (
              <KpiCard
                key={kpi.key}
                {...kpi}
                value={kpi.overviewKey && overview ? overview[kpi.overviewKey] : undefined}
              />
            ))}
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={2}>
            <SectionPlaceholder
              title="Conversion Funnel"
              description="Conversation → Add to Cart → Order journey (needs order attribution, not built yet)"
            />
            <PanelCard title="Top 5 User Intents" description="Routing categories the AI assigned to conversations">
              <RankedList
                items={overview?.topIntents?.map((item) => ({ label: item.intent, count: item.count }))}
                emptyLabel="No conversations yet"
              />
            </PanelCard>
            <PanelCard title="Top Health Concerns" description="Conditions customers have disclosed in chat">
              <RankedList
                items={overview?.topHealthConcerns?.map((item) => ({ label: item.concern, count: item.count }))}
                emptyLabel="No health concerns disclosed yet"
                barColor="#b91c1c"
              />
            </PanelCard>
            <PanelCard title="Handoff Reasons" description="Why conversations escalated to a human expert">
              <RankedList
                items={overview?.handoffReasons?.map((item) => ({ label: item.reason, count: item.count }))}
                emptyLabel="No handoffs yet"
                barColor="#b45309"
              />
            </PanelCard>
            <PanelCard title="Top Interaction Pages" description="Pages where chat conversations started">
              <RankedList
                items={overview?.topPages?.map((item) => ({ label: item.page, count: item.count }))}
                emptyLabel="No conversations yet"
                barColor="#0f766e"
              />
            </PanelCard>
            <PanelCard title="Top Traffic Sources" description="UTM source parsed from the page URL, where present">
              <RankedList
                items={overview?.topTrafficSources?.map((item) => ({ label: item.source, count: item.count }))}
                emptyLabel="No UTM-tagged traffic yet"
                barColor="#7c3aed"
              />
            </PanelCard>
            <PanelCard title="Product Recommendations" description="How often each recommended product was actually clicked">
              <ProductRecommendationsTable products={overview?.productRecommendations} />
            </PanelCard>
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
