import React, { useEffect, useState } from "react";
import { Alert, Box, Skeleton, Stack, Typography } from "@mui/material";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import PaidRoundedIcon from "@mui/icons-material/PaidRounded";
import TrendingUpRoundedIcon from "@mui/icons-material/TrendingUpRounded";
import ShoppingCartRoundedIcon from "@mui/icons-material/ShoppingCartRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import MailRoundedIcon from "@mui/icons-material/MailRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { DateRangeFilter } from "./DateRangeFilter";
import { theme } from "./theme";

const subTabs = ["Overview", "Sales"];

const kpis = [
  { key: "totalConversations", label: "Total conversations", overviewKey: "totalConversations", icon: ForumRoundedIcon },
  { key: "assistedOrderValue", label: "Assisted order value", overviewKey: null, icon: PaidRoundedIcon },
  { key: "orderValueUtm", label: "Order value (UTM)", overviewKey: null, icon: TrendingUpRoundedIcon },
  { key: "addToCartAssisted", label: "Add to cart assisted", overviewKey: "addToCartAssisted", icon: ShoppingCartRoundedIcon },
  { key: "resolutionRate", label: "Resolution rate", overviewKey: "resolutionRate", suffix: "%", icon: CheckCircleRoundedIcon },
  { key: "leadCaptures", label: "Lead captures", overviewKey: "leadCaptures", icon: MailRoundedIcon },
  { key: "interactionRate", label: "Interaction rate", overviewKey: "interactionRate", suffix: "%", icon: GroupsRoundedIcon },
];

function SectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 11, fontWeight: 650, letterSpacing: "0.06em", textTransform: "uppercase", color: theme.faint }}>
      {children}
    </Typography>
  );
}

function KpiCard({ label, value, suffix, icon: Icon }) {
  const available = value !== undefined && value !== null;
  return (
    <Box
      sx={{
        minHeight: 142,
        p: 2.25,
        borderRadius: `${theme.radius}px`,
        border: `1px solid ${theme.border}`,
        bgcolor: theme.surface,
        boxShadow: theme.shadowSoft,
      }}
    >
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
        <Typography sx={{ fontSize: 12.5, color: theme.muted, fontWeight: 600, lineHeight: 1.35 }}>
          {label}
        </Typography>
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: `${theme.radiusSmall}px`,
            display: "grid",
            placeItems: "center",
            bgcolor: theme.accentSoft,
            color: theme.accent,
            flexShrink: 0,
          }}
        >
          <Icon sx={{ fontSize: 17 }} />
        </Box>
      </Stack>
      <Typography sx={{ fontSize: 30, fontWeight: 760, color: available ? theme.ink : theme.faint, lineHeight: 1.05, mt: 2.8 }}>
        {available ? `${value}${suffix ?? ""}` : "—"}
      </Typography>
    </Box>
  );
}

function KpiCardSkeleton() {
  return (
    <Box sx={{ minHeight: 142, p: 2.25, borderRadius: `${theme.radius}px`, border: `1px solid ${theme.border}`, bgcolor: theme.surface }}>
      <Stack direction="row" justifyContent="space-between">
        <Skeleton variant="text" sx={{ fontSize: 12.5, width: "60%" }} />
        <Skeleton variant="rounded" width={32} height={32} sx={{ borderRadius: `${theme.radiusSmall}px` }} />
      </Stack>
      <Skeleton variant="text" sx={{ fontSize: 30, width: "42%", mt: 2.5 }} />
    </Box>
  );
}

function EmptyBox({ label }) {
  return (
    <Box
      sx={{
        mt: 2,
        height: 128,
        borderRadius: `${theme.radiusSmall}px`,
        border: `1px dashed ${theme.borderStrong}`,
        display: "grid",
        placeItems: "center",
        color: theme.faint,
        fontSize: 12.5,
        fontWeight: 600,
      }}
    >
      {label}
    </Box>
  );
}

function RankedList({ items, emptyLabel }) {
  if (!items?.length) return <EmptyBox label={emptyLabel} />;
  const max = Math.max(...items.map((item) => item.count));
  return (
    <Stack gap={1.35} sx={{ mt: 2.25 }}>
      {items.map((item) => (
        <Box key={item.label}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
            <Typography sx={{ fontSize: 13, fontWeight: 550, color: theme.ink }}>
              {item.label}
            </Typography>
            <Typography sx={{ fontSize: 13, fontWeight: 550, color: theme.muted }}>
              {item.count}
            </Typography>
          </Stack>
          <Box sx={{ height: 4, borderRadius: 999, bgcolor: theme.accentSoft, overflow: "hidden" }}>
            <Box sx={{ height: "100%", width: `${(item.count / max) * 100}%`, bgcolor: theme.accent, borderRadius: 999 }} />
          </Box>
        </Box>
      ))}
    </Stack>
  );
}

function RankedListSkeleton({ rows = 4 }) {
  return (
    <Stack gap={1.5} sx={{ mt: 2.5 }}>
      {Array.from({ length: rows }, (_, index) => (
        <Box key={index}>
          <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.6 }}>
            <Skeleton variant="text" sx={{ fontSize: 13, width: `${55 - index * 8}%` }} />
            <Skeleton variant="text" sx={{ fontSize: 13, width: 20 }} />
          </Stack>
          <Skeleton variant="rounded" height={5} sx={{ borderRadius: 999 }} />
        </Box>
      ))}
    </Stack>
  );
}

function ProductRecommendationsTable({ products }) {
  if (!products?.length) return <EmptyBox label="No recommendations yet" />;
  return (
    <Box sx={{ mt: 2.5, overflowX: "auto" }}>
      <Stack gap={0.5} sx={{ minWidth: 340 }}>
        <Stack direction="row" sx={{ px: 0.25, pb: 1 }}>
          <SectionLabel><Box sx={{ flex: 1 }}>Product</Box></SectionLabel>
        </Stack>
        {products.map((product) => (
          <Stack
            key={product.productSlug}
            direction="row"
            alignItems="center"
            sx={{ px: 0.25, py: 1, borderTop: `1px solid ${theme.border}` }}
          >
            <Typography sx={{ fontSize: 13.5, fontWeight: 550, flex: 1, color: theme.ink, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {product.productSlug}
            </Typography>
            <Typography sx={{ fontSize: 13, width: 80, textAlign: "right", color: theme.muted, flexShrink: 0 }}>
              {product.recommended} shown
            </Typography>
            <Typography sx={{ fontSize: 13, width: 70, textAlign: "right", color: theme.muted, flexShrink: 0 }}>
              {product.clicked} clicked
            </Typography>
            <Typography sx={{ fontSize: 13.5, fontWeight: 650, width: 55, textAlign: "right", color: theme.ink, flexShrink: 0 }}>
              {product.clickThroughRate}%
            </Typography>
          </Stack>
        ))}
      </Stack>
    </Box>
  );
}

function ProductRecommendationsSkeleton({ rows = 4 }) {
  return (
    <Stack gap={1.5} sx={{ mt: 2.5 }}>
      {Array.from({ length: rows }, (_, index) => (
        <Stack key={index} direction="row" alignItems="center" gap={2}>
          <Skeleton variant="text" sx={{ fontSize: 13.5, flex: 1 }} />
          <Skeleton variant="text" sx={{ fontSize: 13.5, width: 80 }} />
          <Skeleton variant="text" sx={{ fontSize: 13.5, width: 70 }} />
          <Skeleton variant="text" sx={{ fontSize: 13.5, width: 55 }} />
        </Stack>
      ))}
    </Stack>
  );
}

function Panel({ title, description, children }) {
  return (
    <Box sx={{ minWidth: 0, p: 2.5, borderRadius: `${theme.radius}px`, border: `1px solid ${theme.border}`, bgcolor: theme.surface, boxShadow: theme.shadowSoft }}>
      <Typography sx={{ fontSize: 14.5, fontWeight: 720, color: theme.ink }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 12.5, color: theme.muted, mt: 0.35, lineHeight: 1.45 }}>
        {description}
      </Typography>
      {children}
    </Box>
  );
}

function WidgetDashboard() {
  const [activeSubTab, setActiveSubTab] = useState("Overview");
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    commerceWidgetApi.getOverview({
      from: dateRange?.from ? dateRange.from.toISOString() : undefined,
      to: dateRange?.to ? dateRange.to.toISOString() : undefined,
    })
      .then((data) => { if (!cancelled) setOverview(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [dateRange]);

  return (
    <Box>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        sx={{ borderBottom: `1px solid ${theme.border}`, mb: 2.5 }}
      >
        <Stack direction="row" gap={2.5}>
          {subTabs.map((tab) => {
            const selected = activeSubTab === tab;
            return (
              <Box
                key={tab}
                onClick={() => setActiveSubTab(tab)}
                sx={{
                  pb: 1,
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: selected ? 720 : 600,
                  color: selected ? theme.ink : theme.muted,
                  borderBottom: selected ? `2px solid ${theme.accent}` : "2px solid transparent",
                  mb: "-1px",
                }}
              >
                {tab}
              </Box>
            );
          })}
        </Stack>
        <Box sx={{ mb: 0.8 }}>
          <DateRangeFilter range={dateRange} onChange={setDateRange} />
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Couldn't load live data: {error}
        </Alert>
      )}

      {activeSubTab === "Overview" && (
        <>
          <Typography sx={{ fontSize: 12.5, color: theme.muted, mb: 2, lineHeight: 1.5 }}>
            Live storefront metrics. Assisted and UTM order value will populate when order attribution is connected.
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", lg: "repeat(4, minmax(0, 1fr))" },
              gap: 1.5,
              mb: 3,
            }}
          >
            {loading
              ? kpis.map((kpi) => <KpiCardSkeleton key={kpi.key} />)
              : kpis.map((kpi) => (
                  <KpiCard
                    key={kpi.key}
                    label={kpi.label}
                    suffix={kpi.suffix}
                    icon={kpi.icon}
                    value={kpi.overviewKey && overview ? overview[kpi.overviewKey] : undefined}
                  />
                ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" },
              gap: 1.5,
            }}
          >
            <Panel title="Conversion Funnel" description="Conversation → Add to Cart → Order (needs order attribution)">
              <EmptyBox label="Not built yet" />
            </Panel>
            <Panel title="Top User Intents" description="Routing categories assigned to conversations">
              {loading ? <RankedListSkeleton /> : (
                <RankedList
                  items={overview?.topIntents?.map((item) => ({ label: item.intent, count: item.count }))}
                  emptyLabel="No conversations yet"
                />
              )}
            </Panel>
            <Panel title="Top Health Concerns" description="Conditions customers have disclosed in chat">
              {loading ? <RankedListSkeleton /> : (
                <RankedList
                  items={overview?.topHealthConcerns?.map((item) => ({ label: item.concern, count: item.count }))}
                  emptyLabel="None disclosed yet"
                />
              )}
            </Panel>
            <Panel title="Handoff Reasons" description="Why conversations escalated to a human expert">
              {loading ? <RankedListSkeleton /> : (
                <RankedList
                  items={overview?.handoffReasons?.map((item) => ({ label: item.reason, count: item.count }))}
                  emptyLabel="No handoffs yet"
                />
              )}
            </Panel>
            <Panel title="Top Interaction Pages" description="Pages where chat conversations started">
              {loading ? <RankedListSkeleton /> : (
                <RankedList
                  items={overview?.topPages?.map((item) => ({ label: item.page, count: item.count }))}
                  emptyLabel="No conversations yet"
                />
              )}
            </Panel>
            <Panel title="Top Traffic Sources" description="UTM source parsed from the page URL">
              {loading ? <RankedListSkeleton /> : (
                <RankedList
                  items={overview?.topTrafficSources?.map((item) => ({ label: item.source, count: item.count }))}
                  emptyLabel="No UTM-tagged traffic yet"
                />
              )}
            </Panel>
            <Panel title="Product Recommendations" description="How often each recommendation was actually clicked">
              {loading
                ? <ProductRecommendationsSkeleton />
                : <ProductRecommendationsTable products={overview?.productRecommendations} />}
            </Panel>
          </Box>
        </>
      )}

      {activeSubTab !== "Overview" && (
        <Box sx={{ p: 5, borderRadius: `${theme.radius}px`, border: `1px solid ${theme.border}`, textAlign: "center" }}>
          <Typography sx={{ fontSize: 13.5, color: theme.muted }}>
            {activeSubTab} view is not scoped yet.
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default WidgetDashboard;
