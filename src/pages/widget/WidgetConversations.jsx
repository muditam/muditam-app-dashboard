import React from "react";
import {
  Alert,
  Box,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import FilterListRoundedIcon from "@mui/icons-material/FilterListRounded";
import ForumRoundedIcon from "@mui/icons-material/ForumRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";

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

function WidgetConversations() {
  return (
    <Box sx={{ maxWidth: 1440, mx: "auto" }}>
      <Box sx={{ mb: 2 }}>
        <Typography fontSize={24} fontWeight={950}>
          Customer Conversations
        </Typography>
        <Typography color="text.secondary" fontSize={13.5}>
          Browse and review every AI widget conversation
        </Typography>
      </Box>

      <Alert severity="info" sx={{ mb: 2.5, borderRadius: 2 }}>
        Conversations aren't being persisted yet — the backend doesn't store chat sessions today. This view
        will populate once the storage layer and read endpoints are in place.
      </Alert>

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
            type="text"
            label="Date Range"
            disabled
            value="Not connected"
          />
          <TextField
            size="small"
            label="Filter Chats"
            disabled
            value=""
            InputProps={{ endAdornment: <InputAdornment position="end"><FilterListRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <TextField
            size="small"
            placeholder="Search session number..."
            disabled
            InputProps={{ endAdornment: <InputAdornment position="end"><SearchRoundedIcon fontSize="small" /></InputAdornment> }}
          />
          <Box sx={{ flex: 1, overflowY: "auto", mt: 1 }}>
            <EmptyPanel icon={ForumRoundedIcon} title="No sessions yet" description="Conversations will appear here once persistence is live." />
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
          }}
        >
          <EmptyPanel icon={ForumRoundedIcon} title="Select a conversation" description="Pick a session on the left to view its transcript." />
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
          <Typography fontWeight={950} fontSize={16} sx={{ mb: 1 }}>
            Customer Profile
          </Typography>
          <EmptyPanel icon={PersonRoundedIcon} title="No profile data" description="Location, health concern, language, and visit history will show here." />
        </Paper>
      </Stack>
    </Box>
  );
}

export default WidgetConversations;
