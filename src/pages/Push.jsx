import React, { createElement, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  Paper,
  Radio,
  RadioGroup,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import CampaignIcon from "@mui/icons-material/Campaign";
import DevicesIcon from "@mui/icons-material/Devices";
import HistoryIcon from "@mui/icons-material/History";
import LinkIcon from "@mui/icons-material/Link";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendIcon from "@mui/icons-material/Send";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3001";

const normalizePhone = (value = "") => value.replace(/\D/g, "").slice(-10);
const toISO = (value) => (value ? new Date(value).toISOString() : null);

const formatDateTime = (value) => {
  if (!value) return "Not set";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

const statCards = [
  { key: "totalDevices", label: "Registered devices", icon: DevicesIcon },
  { key: "scheduledCount", label: "Scheduled campaigns", icon: ScheduleIcon },
  { key: "sentCount", label: "Sent campaigns", icon: HistoryIcon },
];

const quickLinks = [
  { label: "Open Home", value: "/home" },
  { label: "Products", value: "/products" },
  { label: "Buy Kit", value: "/buykit" },
  { label: "Videos", value: "/videos" },
  { label: "Support", value: "/me" },
];

export default function Push() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationLink, setNotificationLink] = useState("");
  const [audienceType, setAudienceType] = useState("phones");
  const [phonesText, setPhonesText] = useState("");
  const [sendOption, setSendOption] = useState("now");
  const [scheduledAt, setScheduledAt] = useState("");
  const [sending, setSending] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [tempLink, setTempLink] = useState("");
  const [platformTab, setPlatformTab] = useState(0);
  const [stats, setStats] = useState({
    totalDevices: 0,
    scheduledCount: 0,
    sentCount: 0,
  });
  const [campaigns, setCampaigns] = useState([]);
  const [snackbar, setSnackbar] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const maxTitleLen = 75;
  const maxMsgLen = 200;

  const phoneNumbers = useMemo(
    () => phonesText.split(/[\s,;]+/).map(normalizePhone).filter(Boolean),
    [phonesText]
  );

  const audienceLabel =
    audienceType === "all"
      ? `${stats.totalDevices || 0} registered devices`
      : `${phoneNumbers.length} selected phone${phoneNumbers.length === 1 ? "" : "s"}`;

  const previewTitle = title || "Notification title";
  const previewBody = message || "Your notification message will appear here.";

  const openSnackbar = (type, messageText) =>
    setSnackbar({ open: true, type, message: messageText });

  const loadPushMeta = async () => {
    try {
      const [statsRes, campaignsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/push/stats`),
        fetch(`${API_BASE_URL}/api/push/campaigns`),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
    } catch {
      // Metadata is secondary; composing/sending should remain usable.
    }
  };

  useEffect(() => {
    loadPushMeta();
  }, []);

  const validateCampaign = () => {
    if (!title.trim()) return "Title is required";
    if (!message.trim()) return "Message is required";
    if (audienceType === "phones" && !phoneNumbers.length) return "Enter at least one valid phone number";
    if (sendOption === "schedule" && !scheduledAt) return "Please select scheduled time";
    return "";
  };

  const resetForm = () => {
    setTitle("");
    setMessage("");
    setNotificationLink("");
    setPhonesText("");
    setAudienceType("phones");
    setSendOption("now");
    setScheduledAt("");
  };

  const handleSend = async () => {
    const validationError = validateCampaign();
    if (validationError) {
      openSnackbar("error", validationError);
      return;
    }

    try {
      setSending(true);
      const res = await fetch(`${API_BASE_URL}/api/push/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: notificationLink || undefined,
          audienceType,
          phoneNumbers,
          scheduleOption: sendOption,
          scheduledAt: sendOption === "schedule" ? toISO(scheduledAt) : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send notification");

      openSnackbar(
        "success",
        data.scheduled ? "Campaign scheduled successfully" : `Sent to ${data.sent || 0} devices`
      );
      resetForm();
      loadPushMeta();
    } catch (err) {
      openSnackbar("error", err.message || "Something went wrong");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <Box sx={{ maxWidth: 1360, mx: "auto", p: { xs: 1.5, sm: 2, md: 3 } }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 2, md: 3 },
            mb: 2.5,
            borderRadius: 4,
            color: "#fff",
            background: "linear-gradient(135deg, #241239 0%, #543287 52%, #9D57FF 100%)",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box sx={{ position: "relative", zIndex: 1 }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
              <Box>
                <Stack direction="row" alignItems="center" gap={1} mb={1}>
                  <NotificationsActiveIcon />
                  <Typography fontSize={13} fontWeight={800} sx={{ opacity: 0.82, textTransform: "uppercase" }}>
                    Campaign Control
                  </Typography>
                </Stack>
                <Typography variant="h4" fontWeight={900} letterSpacing={0}>
                  Push Notification Studio
                </Typography>
                <Typography sx={{ opacity: 0.78, mt: 0.75, maxWidth: 660 }}>
                  Compose, target, preview, send, and schedule customer notifications from one dashboard.
                </Typography>
              </Box>
              <Stack direction="row" gap={1} flexWrap="wrap" alignItems="flex-start">
                <Chip label={`${stats.totalDevices || 0} devices ready`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 800 }} />
                <Chip label={sendOption === "schedule" ? "Scheduled send" : "Immediate send"} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 800 }} />
              </Stack>
            </Stack>
          </Box>
        </Paper>

        <Grid container spacing={2} sx={{ mb: 2.5 }}>
          {statCards.map(({ key, label, icon: Icon }) => (
            <Grid item xs={12} md={4} key={key}>
              <Paper elevation={0} sx={{ p: 2, border: "1px solid #e4e7ec", borderRadius: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Box>
                    <Typography color="text.secondary" fontSize={12} fontWeight={800} textTransform="uppercase">
                      {label}
                    </Typography>
                    <Typography fontSize={30} fontWeight={900} color="#182230">
                      {stats[key] || 0}
                    </Typography>
                  </Box>
                  <Box sx={{ width: 44, height: 44, borderRadius: 2.5, bgcolor: "#f3edf9", color: "#543287", display: "grid", placeItems: "center" }}>
                    {createElement(Icon)}
                  </Box>
                </Stack>
              </Paper>
            </Grid>
          ))}
        </Grid>

        <Grid container spacing={2.5}>
          <Grid item xs={12} lg={7}>
            <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e4e7ec", borderRadius: 4 }}>
              <Stack direction="row" alignItems="center" gap={1} mb={2}>
                <CampaignIcon sx={{ color: "#543287" }} />
                <Typography variant="h6" fontWeight={900}>Campaign details</Typography>
              </Stack>

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Notification title"
                    value={title}
                    onChange={(event) => setTitle(event.target.value.slice(0, maxTitleLen))}
                    helperText={`${title.length}/${maxTitleLen}`}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={4}
                    label="Notification message"
                    value={message}
                    onChange={(event) => setMessage(event.target.value.slice(0, maxMsgLen))}
                    helperText={`${message.length}/${maxMsgLen}`}
                  />
                </Grid>
              </Grid>

              <Divider sx={{ my: 3 }} />

              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <PeopleAltIcon sx={{ color: "#543287" }} />
                <Typography fontWeight={900}>Audience</Typography>
                <Chip size="small" label={audienceLabel} sx={{ ml: "auto", fontWeight: 800, borderRadius: 999 }} />
              </Stack>

              <RadioGroup row value={audienceType} onChange={(event) => setAudienceType(event.target.value)}>
                <FormControlLabel value="phones" control={<Radio />} label="Specific customers" />
                <FormControlLabel value="all" control={<Radio />} label="All registered devices" />
              </RadioGroup>

              {audienceType === "phones" && (
                <TextField
                  fullWidth
                  multiline
                  minRows={3}
                  label="Phone numbers"
                  placeholder="Paste phone numbers separated by comma, space, or new line"
                  value={phonesText}
                  onChange={(event) => setPhonesText(event.target.value)}
                  helperText={`${phoneNumbers.length} valid phone number${phoneNumbers.length === 1 ? "" : "s"} detected`}
                  sx={{ mt: 1.5 }}
                />
              )}

              <Divider sx={{ my: 3 }} />

              <Stack direction="row" alignItems="center" gap={1} mb={1.5}>
                <ScheduleIcon sx={{ color: "#543287" }} />
                <Typography fontWeight={900}>Delivery</Typography>
              </Stack>

              <RadioGroup row value={sendOption} onChange={(event) => setSendOption(event.target.value)}>
                <FormControlLabel value="now" control={<Radio />} label="Send now" />
                <FormControlLabel value="schedule" control={<Radio />} label="Schedule for later" />
              </RadioGroup>

              {sendOption === "schedule" && (
                <TextField
                  type="datetime-local"
                  fullWidth
                  value={scheduledAt}
                  onChange={(event) => setScheduledAt(event.target.value)}
                  sx={{ mt: 1.5, maxWidth: 360 }}
                />
              )}

              <Divider sx={{ my: 3 }} />

              <Stack direction={{ xs: "column", sm: "row" }} gap={1.5} justifyContent="space-between">
                <Button
                  variant="outlined"
                  startIcon={<LinkIcon />}
                  onClick={() => {
                    setTempLink(notificationLink);
                    setLinkDialogOpen(true);
                  }}
                >
                  {notificationLink ? "Edit deep link" : "Add deep link"}
                </Button>
                <Button
                  variant="contained"
                  size="large"
                  startIcon={<SendIcon />}
                  disabled={sending}
                  onClick={handleSend}
                  sx={{ bgcolor: "#543287", "&:hover": { bgcolor: "#43256f" }, fontWeight: 900 }}
                >
                  {sending ? "Processing..." : sendOption === "schedule" ? "Schedule Campaign" : "Send Campaign"}
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={5}>
            <Stack gap={2.5}>
              <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e4e7ec", borderRadius: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" fontWeight={900}>Live preview</Typography>
                  <Tabs value={platformTab} onChange={(_, value) => setPlatformTab(value)}>
                    <Tab label="iOS" />
                    <Tab label="Android" />
                  </Tabs>
                </Stack>

                <Box
                  sx={{
                    borderRadius: 6,
                    p: 2,
                    minHeight: 330,
                    background: platformTab === 0
                      ? "linear-gradient(180deg, #101828 0%, #344054 100%)"
                      : "linear-gradient(180deg, #edf2f7 0%, #dbe5ef 100%)",
                    display: "flex",
                    alignItems: platformTab === 0 ? "flex-start" : "center",
                    justifyContent: "center",
                  }}
                >
                  <Box
                    sx={{
                      mt: platformTab === 0 ? 3 : 0,
                      width: "100%",
                      maxWidth: 390,
                      p: 1.5,
                      borderRadius: platformTab === 0 ? 4 : 2.5,
                      bgcolor: platformTab === 0 ? "rgba(255,255,255,0.92)" : "#fff",
                      boxShadow: "0 18px 45px rgba(16, 24, 40, 0.22)",
                    }}
                  >
                    <Stack direction="row" alignItems="center" gap={1} mb={1}>
                      <Box sx={{ width: 34, height: 34, borderRadius: 2, bgcolor: "#543287", color: "#fff", display: "grid", placeItems: "center" }}>
                        <NotificationsActiveIcon fontSize="small" />
                      </Box>
                      <Box minWidth={0}>
                        <Typography fontSize={12} fontWeight={900} color="#475467">Muditam Ayurveda</Typography>
                        <Typography fontSize={11} color="text.secondary">{sendOption === "schedule" ? "Scheduled campaign" : "now"}</Typography>
                      </Box>
                    </Stack>
                    <Typography fontWeight={900} color="#101828" sx={{ overflowWrap: "anywhere" }}>
                      {previewTitle}
                    </Typography>
                    <Typography fontSize={14} color="#475467" sx={{ overflowWrap: "anywhere", mt: 0.5 }}>
                      {previewBody}
                    </Typography>
                    {notificationLink && (
                      <Chip size="small" icon={<LinkIcon />} label={notificationLink} sx={{ mt: 1, maxWidth: "100%" }} />
                    )}
                  </Box>
                </Box>
              </Paper>

              <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, border: "1px solid #e4e7ec", borderRadius: 4 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="h6" fontWeight={900}>Recent campaigns</Typography>
                  <Button size="small" onClick={loadPushMeta}>Refresh</Button>
                </Stack>

                {!campaigns.length ? (
                  <Typography color="text.secondary" fontSize={14}>No push campaigns yet.</Typography>
                ) : (
                  <Stack gap={1}>
                    {campaigns.slice(0, 6).map((campaign) => (
                      <Box key={campaign._id} sx={{ p: 1.25, border: "1px solid #eef0f4", borderRadius: 2.5, bgcolor: "#fbfcff" }}>
                        <Stack direction="row" justifyContent="space-between" gap={1}>
                          <Typography fontWeight={900} fontSize={14} noWrap>{campaign.title}</Typography>
                          <Chip
                            size="small"
                            label={campaign.status}
                            color={campaign.status === "failed" ? "error" : campaign.status === "scheduled" ? "warning" : "success"}
                            sx={{ fontWeight: 800, borderRadius: 999 }}
                          />
                        </Stack>
                        <Typography color="text.secondary" fontSize={12} noWrap>
                          {campaign.scheduleOption === "schedule"
                            ? `Scheduled: ${formatDateTime(campaign.scheduledAt)}`
                            : `Sent: ${formatDateTime(campaign.sentAt || campaign.createdAt)}`}
                        </Typography>
                        <Typography color="text.secondary" fontSize={12}>
                          {campaign.audienceType === "all" ? "All users" : `${campaign.phoneNumbers?.length || 0} phones`} · Delivered: {campaign.sent || 0}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Paper>
            </Stack>
          </Grid>
        </Grid>
      </Box>

      <Dialog open={linkDialogOpen} onClose={() => setLinkDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add notification destination</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary" fontSize={14} mb={1.5}>
            Use an in-app route like /products or a full URL.
          </Typography>
          <Stack direction="row" gap={1} flexWrap="wrap" mb={2}>
            {quickLinks.map((link) => (
              <Chip
                key={link.value}
                clickable
                label={link.label}
                onClick={() => setTempLink(link.value)}
                sx={{ fontWeight: 700 }}
              />
            ))}
          </Stack>
          <TextField
            fullWidth
            label="Destination"
            value={tempLink}
            onChange={(event) => setTempLink(event.target.value)}
            placeholder="/products"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setNotificationLink(tempLink.trim());
              setLinkDialogOpen(false);
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar((current) => ({ ...current, open: false }))}
      >
        <Alert severity={snackbar.type} variant="filled">{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
