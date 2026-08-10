import React, { useEffect, useState } from "react";
import {
  Alert, Box, Checkbox, Dialog, DialogContent, DialogTitle, Divider,
  FormControlLabel, IconButton, InputAdornment, Skeleton, Stack, TextField, Typography, Button,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import TuneRoundedIcon from "@mui/icons-material/TuneRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { loadProductDisplayData, renderStars } from "../../lib/productDisplayData";
import { DateRangeFilter } from "./DateRangeFilter";
import { theme } from "./theme";

const WHATSAPP_ICON_PATH = "M12.031 0h-.062C5.406 0 0 5.406 0 12.031c0 2.578.836 4.964 2.256 6.906L.79 23.156l4.32-1.386c1.867 1.24 4.096 1.964 6.907 1.964h.014c6.61 0 12.03-5.406 12.03-12.032a11.94 11.94 0 0 0-3.522-8.487A11.943 11.943 0 0 0 12.03 0zm7.032 17.05c-.297.836-1.72 1.612-2.375 1.71-.607.09-1.377.129-2.222-.14-1.037-.328-2.37-.735-4.09-1.816-3.02-1.887-4.987-4.987-5.144-5.216-.157-.228-1.294-1.72-1.294-3.286 0-1.564.822-2.335 1.113-2.657.297-.322.647-.402.863-.402.216 0 .432.002.62.011.198.01.463-.075.727.554.272.647.925 2.235 1.006 2.398.08.16.132.35.026.564-.107.213-.16.346-.318.532-.157.187-.332.418-.474.56-.157.157-.32.328-.137.643.183.315.815 1.343 1.75 2.176 1.202 1.07 2.216 1.404 2.531 1.564.315.16.5.132.685-.08.187-.213.792-.926 1.006-1.245.213-.318.427-.264.72-.16.294.107 1.86.877 2.178 1.037.318.16.53.24.61.372.08.132.08.766-.217 1.602z";

const INTENT_OPTIONS = [
  { value: "PRODUCT_DISCOVERY", label: "Product Discovery" },
  { value: "PRODUCT_INFORMATION", label: "Product Information" },
  { value: "PRODUCT_COMPARISON", label: "Product Comparison" },
  { value: "ORDER_OR_SUPPORT", label: "Order / Support" },
  { value: "EXPERT_HANDOFF", label: "Expert Handoff" },
  { value: "GREETING", label: "Greeting" },
  { value: "OFF_TOPIC", label: "Off Topic" },
  { value: "URGENT_SAFETY", label: "Urgent Safety" },
];

const EMPTY_FILTERS = {
  intents: [],
  feedback: [],
  addedToCart: false,
  longChat: false,
  repeatCustomer: false,
  testSession: false,
  healthConcern: "",
  productSlug: "",
};

function activeFilterCount(filters) {
  return (
    filters.intents.length +
    filters.feedback.length +
    (filters.addedToCart ? 1 : 0) +
    (filters.longChat ? 1 : 0) +
    (filters.repeatCustomer ? 1 : 0) +
    (filters.testSession ? 1 : 0) +
    (filters.healthConcern.trim() ? 1 : 0) +
    (filters.productSlug.trim() ? 1 : 0)
  );
}

function FilterSectionLabel({ children }) {
  return (
    <Typography sx={{ fontSize: 12, fontWeight: 700, color: theme.ink, mb: 1 }}>
      {children}
    </Typography>
  );
}

function FiltersDialog({ open, filters, onClose, onApply }) {
  const [draft, setDraft] = useState(filters);

  useEffect(() => {
    if (open) setDraft(filters);
  }, [open, filters]);

  const toggleInArray = (key, value) => {
    setDraft((current) => ({
      ...current,
      [key]: current[key].includes(value)
        ? current[key].filter((item) => item !== value)
        : [...current[key], value],
    }));
  };

  const toggleBoolean = (key) => {
    setDraft((current) => ({ ...current, [key]: !current[key] }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: `${theme.radius}px` } }}>
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pb: 1 }}>
        <Typography sx={{ fontSize: 18, fontWeight: 750, color: theme.ink }}>Filters</Typography>
        <IconButton size="small" onClick={onClose}><CloseRoundedIcon sx={{ fontSize: 20 }} /></IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ pt: 2.5 }}>
        <Stack gap={2.5}>
          <Box>
            <FilterSectionLabel>User Intent</FilterSectionLabel>
            <Stack direction="row" flexWrap="wrap" columnGap={3} rowGap={0.25}>
              {INTENT_OPTIONS.map((option) => (
                <FormControlLabel
                  key={option.value}
                  sx={{ minWidth: 170 }}
                  control={
                    <Checkbox
                      size="small"
                      checked={draft.intents.includes(option.value)}
                      onChange={() => toggleInArray("intents", option.value)}
                    />
                  }
                  label={<Typography sx={{ fontSize: 13.5, color: theme.ink }}>{option.label}</Typography>}
                />
              ))}
            </Stack>
          </Box>

          <Box>
            <FilterSectionLabel>Chat Rating</FilterSectionLabel>
            <Stack direction="row" flexWrap="wrap" columnGap={3} rowGap={0.25}>
              <FormControlLabel
                sx={{ minWidth: 170 }}
                control={<Checkbox size="small" checked={draft.feedback.includes("up")} onChange={() => toggleInArray("feedback", "up")} />}
                label={<Typography sx={{ fontSize: 13.5, color: theme.ink }}>Good</Typography>}
              />
              <FormControlLabel
                sx={{ minWidth: 170 }}
                control={<Checkbox size="small" checked={draft.feedback.includes("down")} onChange={() => toggleInArray("feedback", "down")} />}
                label={<Typography sx={{ fontSize: 13.5, color: theme.ink }}>Poor</Typography>}
              />
            </Stack>
          </Box>

          <Box>
            <FilterSectionLabel>Customer Journey</FilterSectionLabel>
            <Stack direction="row" flexWrap="wrap" columnGap={3} rowGap={0.25}>
              <FormControlLabel
                sx={{ minWidth: 170 }}
                control={<Checkbox size="small" checked={draft.addedToCart} onChange={() => toggleBoolean("addedToCart")} />}
                label={<Typography sx={{ fontSize: 13.5, color: theme.ink }}>Added to Cart</Typography>}
              />
              <FormControlLabel
                sx={{ minWidth: 170 }}
                control={<Checkbox size="small" checked={draft.repeatCustomer} onChange={() => toggleBoolean("repeatCustomer")} />}
                label={<Typography sx={{ fontSize: 13.5, color: theme.ink }}>Repeat Customer</Typography>}
              />
              <FormControlLabel
                sx={{ minWidth: 170 }}
                control={<Checkbox size="small" checked={draft.longChat} onChange={() => toggleBoolean("longChat")} />}
                label={<Typography sx={{ fontSize: 13.5, color: theme.ink }}>Long Chat</Typography>}
              />
              <FormControlLabel
                sx={{ minWidth: 170 }}
                control={<Checkbox size="small" checked={draft.testSession} onChange={() => toggleBoolean("testSession")} />}
                label={<Typography sx={{ fontSize: 13.5, color: theme.ink }}>Test Session</Typography>}
              />
            </Stack>
          </Box>

          <Box>
            <FilterSectionLabel>Need (Concern/Requirement)</FilterSectionLabel>
            <TextField
              size="small"
              fullWidth
              placeholder="e.g. diabetes, thyroid…"
              value={draft.healthConcern}
              onChange={(event) => setDraft((current) => ({ ...current, healthConcern: event.target.value }))}
            />
          </Box>

          <Box>
            <FilterSectionLabel>Product Name</FilterSectionLabel>
            <TextField
              size="small"
              fullWidth
              placeholder="Search for products…"
              value={draft.productSlug}
              onChange={(event) => setDraft((current) => ({ ...current, productSlug: event.target.value }))}
            />
          </Box>
        </Stack>
      </DialogContent>
      <Divider />
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ px: 3, py: 2 }}>
        <Button
          onClick={() => setDraft(EMPTY_FILTERS)}
          sx={{ textTransform: "none", fontWeight: 600, color: theme.muted }}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          disableElevation
          onClick={() => { onApply(draft); onClose(); }}
          sx={{ textTransform: "none", fontWeight: 650, bgcolor: theme.accent, "&:hover": { bgcolor: theme.accent } }}
        >
          Apply
        </Button>
      </Stack>
    </Dialog>
  );
}

function EmptyPanel({ title, description }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      gap={0.75}
      sx={{ height: "100%", minHeight: 320, color: theme.faint, textAlign: "center", px: 3 }}
    >
      <Typography sx={{ fontWeight: 600, fontSize: 13.5, color: theme.muted }}>
        {title}
      </Typography>
      <Typography sx={{ fontSize: 12.5 }}>{description}</Typography>
    </Stack>
  );
}

function ConversationListSkeleton({ rows = 8 }) {
  return (
    <Stack gap={1.25}>
      {Array.from({ length: rows }, (_, index) => (
        <Box key={index} sx={{ px: 1.5, py: 0.5 }}>
          <Skeleton variant="text" sx={{ fontSize: 13, width: "45%" }} />
          <Skeleton variant="text" sx={{ fontSize: 11.5, width: "65%" }} />
        </Box>
      ))}
    </Stack>
  );
}

function TranscriptSkeleton() {
  const widths = ["55%", "70%", "40%", "60%"];
  return (
    <Stack sx={{ p: 3, gap: 1.5, height: "100%" }}>
      {widths.map((width, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          height={44}
          sx={{ width, alignSelf: index % 2 === 0 ? "flex-end" : "flex-start", borderRadius: 2 }}
        />
      ))}
    </Stack>
  );
}

function CustomerProfileSkeleton({ rows = 8 }) {
  return (
    <Stack gap={1.75}>
      {Array.from({ length: rows }, (_, index) => (
        <Box key={index}>
          <Skeleton variant="text" sx={{ fontSize: 11, width: "35%" }} />
          <Skeleton variant="text" sx={{ fontSize: 13.5, width: "65%" }} />
        </Box>
      ))}
    </Stack>
  );
}

function formatTime(value) {
  if (!value) return "";
  return new Date(value).toLocaleString();
}

function ConversationList({ conversations, selectedId, onSelect, search }) {
  const filtered = search
    ? conversations.filter((item) => item.conversationId.toLowerCase().includes(search.toLowerCase()))
    : conversations;
  if (!filtered.length) {
    return <EmptyPanel title="No sessions yet" description="Conversations will appear here as customers chat." />;
  }
  return (
    <Stack gap={0.25}>
      {filtered.map((item) => {
        const selected = item.conversationId === selectedId;
        return (
          <Box
            key={item.conversationId}
            onClick={() => onSelect(item.conversationId)}
            sx={{
              px: 1.5,
              py: 1,
              borderRadius: `${theme.radiusSmall}px`,
              cursor: "pointer",
              bgcolor: selected ? theme.accentSoft : "transparent",
              "&:hover": { bgcolor: selected ? theme.accentSoft : theme.canvas },
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography sx={{ fontSize: 13, fontWeight: 600, color: theme.ink }}>
                {item.conversationId.slice(0, 8)}
              </Typography>
              {item.resolutionStatus === "escalated" && (
                <Box sx={{
                  fontSize: 10.5, fontWeight: 650, color: theme.danger, bgcolor: theme.dangerSoft,
                  borderRadius: 999, px: 0.9, py: 0.15,
                }}>
                  Escalated
                </Box>
              )}
            </Stack>
            <Typography sx={{ fontSize: 11.5, color: theme.muted, mt: 0.15 }}>
              {formatTime(item.lastMessageAt)}
            </Typography>
          </Box>
        );
      })}
    </Stack>
  );
}

function ProductCard({ product }) {
  const [display, setDisplay] = useState(null);

  useEffect(() => {
    let cancelled = false;
    loadProductDisplayData(product.productSlug, product.productUrl)
      .then((data) => { if (!cancelled) setDisplay(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [product.productSlug, product.productUrl]);

  return (
    <Box
      sx={{
        width: 176,
        borderRadius: "16px",
        border: `1px solid ${theme.widgetBorder}`,
        bgcolor: "#fff",
        boxShadow: "0 5px 18px rgb(69 44 80 / 6%)",
        overflow: "hidden",
      }}
    >
      <Box
        component="a"
        href={product.productUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{ display: "block", textDecoration: "none", color: "inherit" }}
      >
        <Box sx={{ height: 140, display: "grid", placeItems: "center", bgcolor: "#fbf9fc" }}>
          {display?.image
            ? <Box component="img" src={display.image} alt={product.name} sx={{ width: "100%", height: "100%", objectFit: "contain" }} />
            : <Box sx={{ fontSize: 11, fontWeight: 750, letterSpacing: "0.04em", color: "#8994a6" }}>Muditam</Box>}
        </Box>
        <Typography sx={{ fontSize: 13, fontWeight: 650, color: "#211b27", px: 1.25, pt: 1.25 }}>
          {product.name}
        </Typography>
        {display?.rating && (
          <Stack direction="row" alignItems="center" gap={0.6} sx={{ px: 1.25, pt: 0.4 }}>
            <Typography sx={{ fontSize: 12, color: "#f8c900", letterSpacing: "1px" }}>
              {renderStars(display.rating.average)}
            </Typography>
            <Typography sx={{ fontSize: 10.5, color: "#8a8a92" }}>
              {display.rating.average.toFixed(1)} ({display.rating.count})
            </Typography>
          </Stack>
        )}
      </Box>
      <Box
        sx={{
          m: 1.25, mt: 1,
          textAlign: "center",
          fontSize: 12, fontWeight: 750,
          py: 0.9,
          borderRadius: "10px",
          border: `1px solid ${theme.widgetPurpleDark}`,
          color: theme.widgetPurpleDark,
        }}
      >
        Add to Cart
      </Box>
    </Box>
  );
}

function ProductCards({ products }) {
  if (!products?.length) return null;
  return (
    <Stack direction="row" flexWrap="wrap" gap={1.25} sx={{ alignSelf: "flex-start", maxWidth: "90%" }}>
      {products.map((product) => <ProductCard key={product.productSlug} product={product} />)}
    </Stack>
  );
}

function HandoffActions({ handoff }) {
  if (!handoff) return null;
  return (
    <Stack direction="row" gap={1} sx={{ alignSelf: "flex-start" }}>
      <Box
        component="a"
        href={handoff.phoneHref}
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center",
          minHeight: 44, textDecoration: "none", fontWeight: 750, fontSize: 12,
          px: 1.75, borderRadius: "13px",
          border: `1px solid ${theme.widgetBorder}`, color: theme.widgetPurpleDark, bgcolor: "#fff",
        }}
      >
        Call {handoff.phoneDisplay}
      </Box>
      <Box
        component="a"
        href={handoff.whatsappUrl}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          display: "flex", alignItems: "center", justifyContent: "center", gap: 0.75,
          minHeight: 44, textDecoration: "none", fontWeight: 750, fontSize: 12,
          px: 1.75, borderRadius: "13px",
          bgcolor: theme.widgetWhatsappGreen, color: "#fff",
          boxShadow: "0 5px 14px rgb(32 157 88 / 16%)",
        }}
      >
        <Box component="svg" viewBox="0 0 24 24" width={16} height={16} sx={{ fill: "currentColor", flexShrink: 0 }}>
          <path d={WHATSAPP_ICON_PATH} />
        </Box>
        Chat here
      </Box>
    </Stack>
  );
}

function Transcript({ detail, loading }) {
  if (loading) return <TranscriptSkeleton />;
  if (!detail) {
    return <EmptyPanel title="Select a conversation" description="Pick a session on the left to view its transcript." />;
  }
  return (
    <Stack sx={{ p: 3, gap: 1.25, overflowY: "auto", height: "100%" }}>
      {detail.messages.map((message) => (
        <React.Fragment key={message._id}>
          <Box
            sx={{
              alignSelf: message.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "75%",
              background: message.role === "user" ? theme.chatUserGradient : theme.chatAssistantBg,
              color: message.role === "user" ? "#fff" : theme.chatAssistantText,
              borderRadius: "17px",
              borderBottomRightRadius: message.role === "user" ? "6px" : "17px",
              borderBottomLeftRadius: message.role === "assistant" ? "6px" : "17px",
              px: 1.75,
              py: 1.1,
            }}
          >
            <Typography sx={{ fontSize: 13.5, whiteSpace: "pre-wrap" }}>
              {message.text}
            </Typography>
            <Typography sx={{ fontSize: 10.5, mt: 0.4, opacity: 0.65 }}>
              {formatTime(message.createdAt)}
            </Typography>
          </Box>
          <ProductCards products={message.recommendedProducts} />
          <HandoffActions handoff={message.handoff} />
        </React.Fragment>
      ))}
    </Stack>
  );
}

function CustomerProfile({ detail, loading }) {
  if (loading) return <CustomerProfileSkeleton />;
  if (!detail) {
    return <EmptyPanel title="No profile data" description="Location, health concern, language, and visit history will show here." />;
  }
  const { conversation, visitor } = detail;
  const location = visitor?.location
    ? [visitor.location.city, visitor.location.region, visitor.location.country].filter(Boolean).join(", ")
    : "Unknown";
  const healthConcerns = visitor?.healthConcerns?.length
    ? visitor.healthConcerns.map((item) => item.concern).join(", ")
    : "Not disclosed";
  const rows = [
    ["Visitor", conversation.visitorId?.slice(0, 8)],
    ["Location", location],
    ["Language", visitor?.language ?? conversation.language],
    ["Health concern", healthConcerns],
    ["Events", visitor?.eventsCounter ?? "—"],
    ["Visited days", visitor?.visitedDays?.join(", ") ?? "—"],
    ["Page", conversation.pageContext?.url ?? "Unknown"],
    ["Channel", conversation.channel ?? "—"],
    ["Feedback", conversation.feedback ?? "None"],
    ["Lead captured", conversation.leadCaptured ? "Yes" : "No"],
    ["Resolution", conversation.resolutionStatus],
  ];
  return (
    <Stack gap={1.75}>
      {rows.map(([label, value]) => (
        <Box key={label}>
          <Typography sx={{ fontSize: 10.5, fontWeight: 650, letterSpacing: "0.05em", textTransform: "uppercase", color: theme.faint }}>
            {label}
          </Typography>
          <Typography sx={{ fontSize: 13.5, fontWeight: 550, color: theme.ink, mt: 0.15 }}>
            {value}
          </Typography>
        </Box>
      ))}
    </Stack>
  );
}

function WidgetConversations() {
  const [conversations, setConversations] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateRange, setDateRange] = useState(undefined);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    commerceWidgetApi.getConversations({
      from: dateRange?.from ? dateRange.from.toISOString() : undefined,
      to: dateRange?.to ? dateRange.to.toISOString() : undefined,
      intent: filters.intents.join(","),
      feedback: filters.feedback.join(","),
      addedToCart: filters.addedToCart,
      longChat: filters.longChat,
      repeatCustomer: filters.repeatCustomer,
      testSession: filters.testSession,
      healthConcern: filters.healthConcern.trim(),
      productSlug: filters.productSlug.trim(),
    })
      .then((data) => { if (!cancelled) setConversations(data.conversations ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [filters, dateRange]);

  useEffect(() => {
    if (!selectedId) { setDetail(null); return; }
    let cancelled = false;
    setDetailLoading(true);
    commerceWidgetApi.getConversation(selectedId)
      .then((data) => { if (!cancelled) setDetail(data); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setDetailLoading(false); });
    return () => { cancelled = true; };
  }, [selectedId]);

  return (
    <Box sx={{ maxWidth: 1320 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          Couldn't load conversations: {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ height: { xs: "auto", md: 620 } }}>
        <Box
          sx={{
            width: { xs: "100%", md: 260, lg: 280 },
            flexShrink: 0,
            height: { xs: 320, md: "auto" },
            borderRadius: `${theme.radius}px`,
            border: `1px solid ${theme.border}`,
            bgcolor: theme.surface,
            p: 1.75,
            display: "flex",
            flexDirection: "column",
            gap: 1.25,
          }}
        >
          <Box>
            <Typography sx={{ fontSize: 11, fontWeight: 650, color: theme.faint, mb: 0.6 }}>Date Range</Typography>
            <DateRangeFilter range={dateRange} onChange={setDateRange} />
          </Box>
          <Stack direction="row" gap={0.75}>
            <TextField
              size="small"
              fullWidth
              placeholder="Search session id..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              InputProps={{
                endAdornment: <InputAdornment position="end"><SearchRoundedIcon sx={{ fontSize: 17, color: theme.faint }} /></InputAdornment>,
                sx: { fontSize: 13, borderRadius: `${theme.radiusSmall}px` },
              }}
            />
            <Box sx={{ position: "relative", flexShrink: 0 }}>
              <IconButton
                onClick={() => setFiltersOpen(true)}
                sx={{
                  border: `1px solid ${activeFilterCount(filters) ? theme.accent : theme.border}`,
                  borderRadius: `${theme.radiusSmall}px`,
                  color: activeFilterCount(filters) ? theme.accent : theme.muted,
                }}
              >
                <TuneRoundedIcon sx={{ fontSize: 18 }} />
              </IconButton>
              {activeFilterCount(filters) > 0 && (
                <Box
                  sx={{
                    position: "absolute", top: -4, right: -4,
                    minWidth: 16, height: 16, borderRadius: "50%",
                    bgcolor: theme.accent, color: "#fff",
                    fontSize: 10, fontWeight: 700,
                    display: "grid", placeItems: "center",
                  }}
                >
                  {activeFilterCount(filters)}
                </Box>
              )}
            </Box>
          </Stack>
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loading
              ? <ConversationListSkeleton />
              : <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} search={search} />}
          </Box>
        </Box>

        <FiltersDialog
          open={filtersOpen}
          filters={filters}
          onClose={() => setFiltersOpen(false)}
          onApply={setFilters}
        />

        <Box
          sx={{
            flex: 1,
            minWidth: 0,
            height: { xs: 420, md: "auto" },
            borderRadius: `${theme.radius}px`,
            border: `1px solid ${theme.border}`,
            bgcolor: theme.surface,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Transcript detail={detail} loading={detailLoading} />
        </Box>

        <Box
          sx={{
            width: { xs: "100%", md: 260, lg: 300 },
            flexShrink: 0,
            height: { xs: 320, md: "auto" },
            overflowY: "auto",
            borderRadius: `${theme.radius}px`,
            border: `1px solid ${theme.border}`,
            bgcolor: theme.surface,
            p: 2.5,
          }}
        >
          <Typography sx={{ fontSize: 14, fontWeight: 650, color: theme.ink, mb: 2 }}>
            Customer Profile
          </Typography>
          <CustomerProfile detail={detail} loading={detailLoading} />
        </Box>
      </Stack>
    </Box>
  );
}

export default WidgetConversations;
