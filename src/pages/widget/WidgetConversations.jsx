import React, { useEffect, useState } from "react";
import { Alert, Box, InputAdornment, Skeleton, Stack, TextField, Typography } from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { theme } from "./theme";

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

function ProductCards({ products }) {
  if (!products?.length) return null;
  return (
    <Stack direction="row" flexWrap="wrap" gap={1} sx={{ alignSelf: "flex-start", maxWidth: "90%" }}>
      {products.map((product) => (
        <Box
          key={product.productSlug}
          component="a"
          href={product.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          sx={{
            display: "block",
            textDecoration: "none",
            color: "inherit",
            width: 190,
            borderRadius: `${theme.radiusSmall}px`,
            border: `1px solid ${theme.border}`,
            bgcolor: theme.surface,
            p: 1.5,
          }}
        >
          <Typography sx={{ fontSize: 13, fontWeight: 650, color: theme.ink }}>
            {product.name}
          </Typography>
          <Typography sx={{ fontSize: 11.5, color: theme.muted, mt: 0.4 }}>
            {product.reason}
          </Typography>
        </Box>
      ))}
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
          textDecoration: "none", fontWeight: 650, fontSize: 12.5,
          px: 1.75, py: 0.9, borderRadius: `${theme.radiusSmall}px`,
          border: `1px solid ${theme.border}`, color: theme.ink,
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
          textDecoration: "none", fontWeight: 650, fontSize: 12.5,
          px: 1.75, py: 0.9, borderRadius: `${theme.radiusSmall}px`,
          bgcolor: theme.accent, color: "#fff",
        }}
      >
        WhatsApp
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

  useEffect(() => {
    let cancelled = false;
    commerceWidgetApi.getConversations()
      .then((data) => { if (!cancelled) setConversations(data.conversations ?? []); })
      .catch((err) => { if (!cancelled) setError(err.message); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

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
          <TextField
            size="small"
            placeholder="Search session id..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              endAdornment: <InputAdornment position="end"><SearchRoundedIcon sx={{ fontSize: 17, color: theme.faint }} /></InputAdornment>,
              sx: { fontSize: 13, borderRadius: `${theme.radiusSmall}px` },
            }}
          />
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loading
              ? <ConversationListSkeleton />
              : <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} search={search} />}
          </Box>
        </Box>

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
