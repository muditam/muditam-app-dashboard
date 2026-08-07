import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Chip,
  InputAdornment,
  List,
  ListItemButton,
  ListItemText,
  Paper,
  Skeleton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";

function EmptyPanel({ icon: Icon, title, description }) {
  return (
    <Stack
      alignItems="center"
      justifyContent="center"
      gap={1}
      sx={{ height: "100%", minHeight: 320, color: "text.secondary", textAlign: "center", px: 3 }}
    >
      <Icon sx={{ fontSize: 32, opacity: 0.5 }} />
      <Typography fontWeight={850} fontSize={14.5}>
        {title}
      </Typography>
      <Typography fontSize={13}>{description}</Typography>
    </Stack>
  );
}

function ConversationListSkeleton({ rows = 8 }) {
  return (
    <Stack gap={0.75}>
      {Array.from({ length: rows }, (_, index) => (
        <Box key={index} sx={{ px: 2, py: 1.25, borderRadius: 2 }}>
          <Skeleton variant="text" sx={{ fontSize: 13.5, width: "45%" }} />
          <Skeleton variant="text" sx={{ fontSize: 12, width: "65%" }} />
        </Box>
      ))}
    </Stack>
  );
}

function TranscriptSkeleton() {
  const widths = ["55%", "70%", "40%", "60%"];
  return (
    <Stack sx={{ p: 2.5, gap: 1.5, height: "100%" }}>
      {widths.map((width, index) => (
        <Skeleton
          key={index}
          variant="rounded"
          height={48}
          sx={{ width, alignSelf: index % 2 === 0 ? "flex-end" : "flex-start", borderRadius: 2.5 }}
        />
      ))}
    </Stack>
  );
}

function CustomerProfileSkeleton({ rows = 8 }) {
  return (
    <Stack gap={1.5}>
      {Array.from({ length: rows }, (_, index) => (
        <Box key={index}>
          <Skeleton variant="text" sx={{ fontSize: 11.5, width: "35%" }} />
          <Skeleton variant="text" sx={{ fontSize: 14, width: "65%" }} />
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
    return <EmptyPanel icon={ForumRoundedIcon} title="No sessions yet" description="Conversations will appear here as customers chat." />;
  }
  return (
    <List disablePadding>
      {filtered.map((item) => (
        <ListItemButton
          key={item.conversationId}
          selected={item.conversationId === selectedId}
          onClick={() => onSelect(item.conversationId)}
          sx={{ borderRadius: 2, mb: 0.5 }}
        >
          <ListItemText
            primary={item.conversationId.slice(0, 8)}
            secondary={formatTime(item.lastMessageAt)}
            primaryTypographyProps={{ fontSize: 13.5, fontWeight: 800 }}
            secondaryTypographyProps={{ fontSize: 12 }}
          />
          {item.resolutionStatus === "escalated" && (
            <Chip size="small" label="Escalated" color="warning" sx={{ fontWeight: 800 }} />
          )}
        </ListItemButton>
      ))}
    </List>
  );
}

function ProductCards({ products }) {
  if (!products?.length) return null;
  return (
    <Stack direction="row" flexWrap="wrap" gap={1.25} sx={{ alignSelf: "flex-start", maxWidth: "90%" }}>
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
            width: 200,
            borderRadius: 2.5,
            border: "1px solid rgba(16, 24, 40, 0.1)",
            bgcolor: "#fff",
            p: 1.5,
          }}
        >
          <Typography fontSize={13.5} fontWeight={800}>
            {product.name}
          </Typography>
          <Typography fontSize={12} color="text.secondary" sx={{ mt: 0.5 }}>
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
    <Stack direction="row" gap={1.25} sx={{ alignSelf: "flex-start" }}>
      <Box
        component="a"
        href={handoff.phoneHref}
        sx={{
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 13,
          px: 2,
          py: 1,
          borderRadius: 2,
          border: "1px solid rgba(16, 24, 40, 0.15)",
          color: "#182230",
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
          textDecoration: "none",
          fontWeight: 800,
          fontSize: 13,
          px: 2,
          py: 1,
          borderRadius: 2,
          bgcolor: "#209d58",
          color: "#fff",
        }}
      >
        Chat here
      </Box>
    </Stack>
  );
}

function Transcript({ detail, loading }) {
  if (loading) return <TranscriptSkeleton />;
  if (!detail) {
    return <EmptyPanel icon={ForumRoundedIcon} title="Select a conversation" description="Pick a session on the left to view its transcript." />;
  }
  return (
    <Stack sx={{ p: 2.5, gap: 1.5, overflowY: "auto", height: "100%" }}>
      {detail.messages.map((message) => (
        <React.Fragment key={message._id}>
          <Box
            sx={{
              alignSelf: message.role === "user" ? "flex-end" : "flex-start",
              maxWidth: "75%",
              bgcolor: message.role === "user" ? "#182230" : "#f2f4f7",
              color: message.role === "user" ? "#fff" : "#101828",
              borderRadius: 2.5,
              px: 2,
              py: 1.25,
            }}
          >
            <Typography fontSize={14} sx={{ whiteSpace: "pre-wrap" }}>
              {message.text}
            </Typography>
            <Typography fontSize={11} sx={{ mt: 0.5, opacity: 0.7 }}>
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
    return <EmptyPanel icon={PersonRoundedIcon} title="No profile data" description="Location, health concern, language, and visit history will show here." />;
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
    <Stack gap={1.5}>
      {rows.map(([label, value]) => (
        <Box key={label}>
          <Typography fontSize={11.5} color="text.secondary" fontWeight={800} sx={{ textTransform: "uppercase" }}>
            {label}
          </Typography>
          <Typography fontSize={14} fontWeight={700}>
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
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Box>
          <Typography fontSize={24} fontWeight={950}>
            Customer Conversations
          </Typography>
          <Typography color="text.secondary" fontSize={13.5}>
            Browse and review every AI widget conversation
          </Typography>
        </Box>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>
          Couldn't load conversations: {error}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} gap={2} sx={{ height: { md: 640 } }}>
        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 300 },
            flexShrink: 0,
            borderRadius: 3,
            border: "1px solid rgba(16, 24, 40, 0.08)",
            p: 2,
            display: "flex",
            flexDirection: "column",
            gap: 1.5,
          }}
        >
          <TextField
            size="small"
            placeholder="Search session id..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{ endAdornment: <InputAdornment position="end"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <Box sx={{ flex: 1, overflowY: "auto" }}>
            {loading
              ? <ConversationListSkeleton />
              : <ConversationList conversations={conversations} selectedId={selectedId} onSelect={setSelectedId} search={search} />}
          </Box>
        </Paper>

        <Paper
          elevation={0}
          sx={{
            flex: 1,
            borderRadius: 3,
            border: "1px solid rgba(16, 24, 40, 0.08)",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <Transcript detail={detail} loading={detailLoading} />
        </Paper>

        <Paper
          elevation={0}
          sx={{
            width: { xs: "100%", md: 320 },
            flexShrink: 0,
            borderRadius: 3,
            border: "1px solid rgba(16, 24, 40, 0.08)",
            p: 2.5,
          }}
        >
          <Typography fontWeight={950} fontSize={16} sx={{ mb: 1.5 }}>
            Customer Profile
          </Typography>
          <CustomerProfile detail={detail} loading={detailLoading} />
        </Paper>
      </Stack>
    </Box>
  );
}

export default WidgetConversations;
