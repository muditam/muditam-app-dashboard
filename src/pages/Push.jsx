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
  InputAdornment,
  Paper,
  MenuItem,
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
import CancelScheduleSendIcon from "@mui/icons-material/CancelScheduleSend";
import DevicesIcon from "@mui/icons-material/Devices";
import EditIcon from "@mui/icons-material/Edit";
import HistoryIcon from "@mui/icons-material/History";
import LinkIcon from "@mui/icons-material/Link";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import ScheduleIcon from "@mui/icons-material/Schedule";
import SendIcon from "@mui/icons-material/Send";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityIcon from "@mui/icons-material/Visibility";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV
    ? "http://localhost:3001"
    : "https://muditam-app-backend-ca1c8b03db09.herokuapp.com");

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
  { key: "failedCount", label: "Failed campaigns", icon: CampaignIcon },
];

const quickLinks = [
  { label: "Open Home", value: "/home" },
  { label: "Products", value: "/products" },
  { label: "Buy Kit", value: "/buykit" },
  { label: "Videos", value: "/videos" },
  { label: "Support", value: "/me" },
];

export default function Push() {
  const [adminToken] = useState("");
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
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [campaignSearch, setCampaignSearch] = useState("");
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [campaignActionLoading, setCampaignActionLoading] = useState(false);
  const [audiencePreview, setAudiencePreview] = useState(null);
  const [selectedCampaign, setSelectedCampaign] = useState(null);
  const [testPhonesText, setTestPhonesText] = useState("");
  const [editForm, setEditForm] = useState({
    title: "",
    message: "",
    url: "",
    audienceType: "phones",
    phoneNumbersText: "",
    scheduledAt: "",
  });
  const [stats, setStats] = useState({
    totalDevices: 0,
    scheduledCount: 0,
    sentCount: 0,
    failedCount: 0,
    latestCampaignAt: null,
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
  const testPhoneNumbers = useMemo(
    () => testPhonesText.split(/[\s,;]+/).map(normalizePhone).filter(Boolean),
    [testPhonesText]
  );

  const audienceLabel =
    audienceType === "all"
      ? `${stats.totalDevices || 0} registered devices`
      : `${phoneNumbers.length} selected phone${phoneNumbers.length === 1 ? "" : "s"}`;

  const previewTitle = title || "Notification title";
  const previewBody = message || "Your notification message will appear here.";
  const sendButtonLabel = sending
    ? "Processing..."
    : sendOption === "schedule"
      ? "Schedule Campaign"
      : "Send Campaign";
  const sendHelperText = sendOption === "schedule"
    ? (scheduledAt ? `Will queue for ${formatDateTime(toISO(scheduledAt))}` : "Choose a future date and time")
    : "Campaign will be delivered immediately after confirmation";
  const filteredCampaigns = useMemo(() => {
    const query = campaignSearch.trim().toLowerCase();
    return campaigns.filter((campaign) => {
      if (campaignFilter !== "all" && campaign.status !== campaignFilter) return false;
      if (!query) return true;
      const haystack = [
        campaign.title,
        campaign.message,
        campaign.status,
        campaign.url,
        campaign.audienceType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
  }, [campaignFilter, campaignSearch, campaigns]);

  const openSnackbar = (type, messageText) =>
    setSnackbar({ open: true, type, message: messageText });

  const toDateTimeLocalValue = (value) => {
    if (!value) return "";
    const date = new Date(value);
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
  };

  const authenticatedFetch = async (path, options = {}, token = adminToken) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });

    if (response.status === 401 || response.status === 403) {
      throw new Error(response.status === 403 ? "This action is currently unavailable" : "Authentication failed");
    }

    return response;
  };

  const loadPushMeta = async (token = adminToken) => {
    try {
      setLoadingMeta(true);
      const [statsRes, campaignsRes] = await Promise.all([
        authenticatedFetch("/api/push/stats", {}, token),
        authenticatedFetch("/api/push/campaigns", {}, token),
      ]);

      if (statsRes.ok) setStats(await statsRes.json());
      if (campaignsRes.ok) {
        const data = await campaignsRes.json();
        setCampaigns(data.campaigns || []);
      }
    } catch (error) {
      if (token) openSnackbar("error", error.message || "Could not load push campaigns");
    } finally {
      setLoadingMeta(false);
    }
  };

  useEffect(() => {
    loadPushMeta(adminToken);
    // Temporary open access for dashboard notifications.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminToken]);

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
      const res = await authenticatedFetch("/api/push/send", {
        method: "POST",
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

  const buildCampaignPayload = () => ({
    title: title.trim(),
    message: message.trim(),
    url: notificationLink || undefined,
    audienceType,
    phoneNumbers,
    scheduleOption: sendOption,
    scheduledAt: sendOption === "schedule" ? toISO(scheduledAt) : null,
  });

  const handlePreviewAudience = async () => {
    try {
      setPreviewLoading(true);
      const res = await authenticatedFetch("/api/push/preview", {
        method: "POST",
        body: JSON.stringify(buildCampaignPayload()),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to preview audience");
      setAudiencePreview(data);
      setPreviewDialogOpen(true);
    } catch (err) {
      openSnackbar("error", err.message || "Could not preview audience");
    } finally {
      setPreviewLoading(false);
    }
  };

  const loadCampaignDetail = async (campaignId) => {
    try {
      setDetailLoading(true);
      const res = await authenticatedFetch(`/api/push/campaigns/${campaignId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load campaign");
      setSelectedCampaign(data.campaign);
      setDetailDialogOpen(true);
    } catch (err) {
      openSnackbar("error", err.message || "Could not load campaign");
    } finally {
      setDetailLoading(false);
    }
  };

  const openEditCampaign = (campaign) => {
    setSelectedCampaign(campaign);
    setEditForm({
      title: campaign.title || "",
      message: campaign.message || "",
      url: campaign.url || "",
      audienceType: campaign.audienceType || "phones",
      phoneNumbersText: Array.isArray(campaign.phoneNumbers) ? campaign.phoneNumbers.join(", ") : "",
      scheduledAt: toDateTimeLocalValue(campaign.scheduledAt),
    });
    setEditDialogOpen(true);
  };

  const handleUpdateScheduledCampaign = async () => {
    if (!selectedCampaign?._id) return;

    const editedPhoneNumbers = editForm.phoneNumbersText
      .split(/[\s,;]+/)
      .map(normalizePhone)
      .filter(Boolean);

    if (!editForm.title.trim() || !editForm.message.trim()) {
      openSnackbar("error", "Title and message are required");
      return;
    }
    if (editForm.audienceType === "phones" && !editedPhoneNumbers.length) {
      openSnackbar("error", "Enter at least one valid phone number");
      return;
    }
    if (!editForm.scheduledAt) {
      openSnackbar("error", "Choose a future schedule time");
      return;
    }

    try {
      setCampaignActionLoading(true);
      const res = await authenticatedFetch(`/api/push/campaigns/${selectedCampaign._id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: editForm.title.trim(),
          message: editForm.message.trim(),
          url: editForm.url.trim(),
          audienceType: editForm.audienceType,
          phoneNumbers: editedPhoneNumbers,
          scheduleOption: "schedule",
          scheduledAt: toISO(editForm.scheduledAt),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to update campaign");
      setEditDialogOpen(false);
      setSelectedCampaign(data.campaign);
      openSnackbar("success", "Scheduled campaign updated");
      loadPushMeta();
    } catch (err) {
      openSnackbar("error", err.message || "Could not update campaign");
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const handleCancelCampaign = async (campaign) => {
    try {
      setCampaignActionLoading(true);
      const res = await authenticatedFetch(`/api/push/campaigns/${campaign._id}/cancel`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to cancel campaign");
      if (selectedCampaign?._id === campaign._id) {
        setSelectedCampaign(data.campaign);
      }
      setEditDialogOpen(false);
      openSnackbar("success", "Scheduled campaign cancelled");
      loadPushMeta();
    } catch (err) {
      openSnackbar("error", err.message || "Could not cancel campaign");
    } finally {
      setCampaignActionLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!title.trim() || !message.trim()) {
      openSnackbar("error", "Add a title and message before sending a test");
      return;
    }
    if (!testPhoneNumbers.length) {
      openSnackbar("error", "Enter at least one valid test phone number");
      return;
    }

    try {
      setTestSending(true);
      const res = await authenticatedFetch("/api/push/test", {
        method: "POST",
        body: JSON.stringify({
          title: title.trim(),
          message: message.trim(),
          url: notificationLink || undefined,
          phoneNumbers: testPhoneNumbers,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send test notification");
      openSnackbar("success", `Test sent to ${data.sent || 0} devices`);
    } catch (err) {
      openSnackbar("error", err.message || "Could not send test notification");
    } finally {
      setTestSending(false);
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
                <Stack direction="row" gap={1} flexWrap="wrap" mt={1.75}>
                  <Chip
                    size="small"
                    label="Open access enabled"
                    sx={{
                      bgcolor: "rgba(34, 197, 94, 0.18)",
                      color: "#fff",
                      fontWeight: 800,
                    }}
                  />
                  {stats.latestCampaignAt && (
                    <Chip
                      size="small"
                      label={`Last activity ${formatDateTime(stats.latestCampaignAt)}`}
                      sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 800 }}
                    />
                  )}
                </Stack>
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

              <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} mt={1.5}>
                <Button
                  variant="outlined"
                  startIcon={<VisibilityIcon />}
                  onClick={handlePreviewAudience}
                  disabled={previewLoading}
                >
                  {previewLoading ? "Previewing..." : "Preview audience"}
                </Button>
                <TextField
                  fullWidth
                  size="small"
                  label="Test phone numbers"
                  placeholder="Send only to test devices"
                  value={testPhonesText}
                  onChange={(event) => setTestPhonesText(event.target.value)}
                  helperText={`${testPhoneNumbers.length} valid test phone${testPhoneNumbers.length === 1 ? "" : "s"}`}
                />
                <Button
                  variant="contained"
                  onClick={handleSendTest}
                  disabled={testSending}
                  sx={{ minWidth: 150, bgcolor: "#101828", "&:hover": { bgcolor: "#182230" }, fontWeight: 800 }}
                >
                  {testSending ? "Sending..." : "Send test"}
                </Button>
              </Stack>

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
                <Stack sx={{ mt: 1.5, maxWidth: 360 }} gap={1}>
                  <TextField
                    type="datetime-local"
                    fullWidth
                    value={scheduledAt}
                    onChange={(event) => setScheduledAt(event.target.value)}
                  />
                  <Typography fontSize={12} color="text.secondary">
                    All scheduled times are interpreted in your browser time zone.
                  </Typography>
                </Stack>
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
                  {sendButtonLabel}
                </Button>
              </Stack>
              <Typography color="text.secondary" fontSize={12} sx={{ mt: 1.25 }}>
                {sendHelperText}
              </Typography>
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
                  <Button size="small" onClick={loadPushMeta} disabled={loadingMeta}>
                    {loadingMeta ? "Refreshing..." : "Refresh"}
                  </Button>
                </Stack>
                <Stack direction={{ xs: "column", sm: "row" }} gap={1.25} mb={2}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Search title, message, route, or status"
                    value={campaignSearch}
                    onChange={(event) => setCampaignSearch(event.target.value)}
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon fontSize="small" />
                        </InputAdornment>
                      ),
                    }}
                  />
                  <TextField
                    size="small"
                    select
                    value={campaignFilter}
                    onChange={(event) => setCampaignFilter(event.target.value)}
                    sx={{ minWidth: 170 }}
                  >
                    <MenuItem value="all">All statuses</MenuItem>
                    <MenuItem value="scheduled">Scheduled</MenuItem>
                    <MenuItem value="sent">Sent</MenuItem>
                    <MenuItem value="failed">Failed</MenuItem>
                    <MenuItem value="sending">Sending</MenuItem>
                  </TextField>
                </Stack>

                {!filteredCampaigns.length ? (
                  <Typography color="text.secondary" fontSize={14}>No push campaigns yet.</Typography>
                ) : (
                  <Stack gap={1}>
                    {filteredCampaigns.slice(0, 8).map((campaign) => (
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
                        {campaign.failed ? (
                          <Typography color="error.main" fontSize={12} fontWeight={700}>
                            Failed: {campaign.failed}
                          </Typography>
                        ) : null}
                        {campaign.url ? (
                          <Chip
                            size="small"
                            icon={<LinkIcon />}
                            label={campaign.url}
                            sx={{ mt: 1, maxWidth: "100%" }}
                          />
                        ) : null}
                        <Stack direction="row" gap={1} mt={1.25} flexWrap="wrap">
                          <Button
                            size="small"
                            variant="outlined"
                            startIcon={<VisibilityIcon />}
                            onClick={() => loadCampaignDetail(campaign._id)}
                            disabled={detailLoading}
                          >
                            Details
                          </Button>
                          {campaign.status === "scheduled" ? (
                            <>
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<EditIcon />}
                                onClick={() => openEditCampaign(campaign)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="small"
                                color="error"
                                variant="outlined"
                                startIcon={<CancelScheduleSendIcon />}
                                onClick={() => handleCancelCampaign(campaign)}
                                disabled={campaignActionLoading}
                              >
                                Cancel
                              </Button>
                            </>
                          ) : null}
                        </Stack>
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

      <Dialog open={previewDialogOpen} onClose={() => setPreviewDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Audience preview</DialogTitle>
        <DialogContent>
          <Stack gap={1.5} mt={0.5}>
            <Alert severity="info">
              {audiencePreview?.audienceType === "all" ? "Campaign targets all registered users." : "Campaign targets only the selected phone numbers."}
            </Alert>
            <Grid container spacing={1.25}>
              {[
                ["Matched users", audiencePreview?.totalUsers || 0],
                ["Users with tokens", audiencePreview?.usersWithTokens || 0],
                ["Valid devices", audiencePreview?.validDeviceCount || 0],
                ["Invalid tokens", audiencePreview?.invalidTokenCount || 0],
              ].map(([label, value]) => (
                <Grid item xs={6} key={label}>
                  <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                    <Typography color="text.secondary" fontSize={12} fontWeight={800}>{label}</Typography>
                    <Typography fontSize={24} fontWeight={900}>{value}</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
            <Box>
              <Typography fontWeight={800} mb={1}>Sample recipients</Typography>
              <Stack direction="row" gap={1} flexWrap="wrap">
                {(audiencePreview?.samplePhones || []).length ? (
                  audiencePreview.samplePhones.map((phone) => (
                    <Chip key={phone} label={phone} sx={{ fontWeight: 700 }} />
                  ))
                ) : (
                  <Typography color="text.secondary" fontSize={14}>No matching users found.</Typography>
                )}
              </Stack>
            </Box>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={detailDialogOpen} onClose={() => setDetailDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Campaign details</DialogTitle>
        <DialogContent>
          {!selectedCampaign ? (
            <Typography color="text.secondary">No campaign selected.</Typography>
          ) : (
            <Stack gap={1.5} mt={0.5}>
              <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                <Box>
                  <Typography variant="h6" fontWeight={900}>{selectedCampaign.title}</Typography>
                  <Typography color="text.secondary" sx={{ whiteSpace: "pre-wrap" }}>{selectedCampaign.message}</Typography>
                </Box>
                <Chip
                  size="small"
                  label={selectedCampaign.status}
                  color={selectedCampaign.status === "failed" ? "error" : selectedCampaign.status === "scheduled" ? "warning" : selectedCampaign.status === "cancelled" ? "default" : "success"}
                  sx={{ fontWeight: 800 }}
                />
              </Stack>
              <Grid container spacing={1.25}>
                {[
                  ["Audience", selectedCampaign.audienceType === "all" ? "All users" : `${selectedCampaign.phoneNumbers?.length || 0} phones`],
                  ["Sent", selectedCampaign.sent || 0],
                  ["Failed", selectedCampaign.failed || 0],
                  ["Created", formatDateTime(selectedCampaign.createdAt)],
                  ["Scheduled", selectedCampaign.scheduledAt ? formatDateTime(selectedCampaign.scheduledAt) : "Not scheduled"],
                  ["Delivered", selectedCampaign.sentAt ? formatDateTime(selectedCampaign.sentAt) : "Not delivered"],
                ].map(([label, value]) => (
                  <Grid item xs={6} key={label}>
                    <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5, height: "100%" }}>
                      <Typography color="text.secondary" fontSize={12} fontWeight={800}>{label}</Typography>
                      <Typography fontSize={14} fontWeight={800}>{value}</Typography>
                    </Paper>
                  </Grid>
                ))}
              </Grid>
              {selectedCampaign.url ? (
                <Chip icon={<LinkIcon />} label={selectedCampaign.url} sx={{ alignSelf: "flex-start" }} />
              ) : null}
              {selectedCampaign.error ? (
                <Alert severity="error">{selectedCampaign.error}</Alert>
              ) : null}
              {selectedCampaign.audienceSnapshot ? (
                <Paper variant="outlined" sx={{ p: 1.5, borderRadius: 2.5 }}>
                  <Typography fontWeight={900} mb={1}>Audience snapshot</Typography>
                  <Typography fontSize={14} color="text.secondary">
                    {selectedCampaign.audienceSnapshot.totalUsers || 0} matched users, {selectedCampaign.audienceSnapshot.usersWithTokens || 0} users with tokens, {selectedCampaign.audienceSnapshot.validDeviceCount || 0} valid devices.
                  </Typography>
                </Paper>
              ) : null}
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDetailDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle sx={{ fontWeight: 900 }}>Edit scheduled campaign</DialogTitle>
        <DialogContent>
          <Stack gap={2} mt={0.5}>
            <TextField
              fullWidth
              label="Title"
              value={editForm.title}
              onChange={(event) => setEditForm((current) => ({ ...current, title: event.target.value.slice(0, maxTitleLen) }))}
              helperText={`${editForm.title.length}/${maxTitleLen}`}
            />
            <TextField
              fullWidth
              multiline
              minRows={4}
              label="Message"
              value={editForm.message}
              onChange={(event) => setEditForm((current) => ({ ...current, message: event.target.value.slice(0, maxMsgLen) }))}
              helperText={`${editForm.message.length}/${maxMsgLen}`}
            />
            <TextField
              fullWidth
              label="Deep link / URL"
              value={editForm.url}
              onChange={(event) => setEditForm((current) => ({ ...current, url: event.target.value }))}
            />
            <TextField
              select
              fullWidth
              label="Audience"
              value={editForm.audienceType}
              onChange={(event) => setEditForm((current) => ({ ...current, audienceType: event.target.value }))}
            >
              <MenuItem value="phones">Specific customers</MenuItem>
              <MenuItem value="all">All registered devices</MenuItem>
            </TextField>
            {editForm.audienceType === "phones" ? (
              <TextField
                fullWidth
                multiline
                minRows={3}
                label="Phone numbers"
                value={editForm.phoneNumbersText}
                onChange={(event) => setEditForm((current) => ({ ...current, phoneNumbersText: event.target.value }))}
              />
            ) : null}
            <TextField
              type="datetime-local"
              fullWidth
              label="Scheduled at"
              InputLabelProps={{ shrink: true }}
              value={editForm.scheduledAt}
              onChange={(event) => setEditForm((current) => ({ ...current, scheduledAt: event.target.value }))}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ justifyContent: "space-between", px: 3, pb: 3 }}>
          <Button
            color="error"
            startIcon={<CancelScheduleSendIcon />}
            onClick={() => selectedCampaign && handleCancelCampaign(selectedCampaign)}
            disabled={campaignActionLoading}
          >
            Cancel campaign
          </Button>
          <Stack direction="row" gap={1}>
            <Button onClick={() => setEditDialogOpen(false)}>Close</Button>
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={handleUpdateScheduledCampaign}
              disabled={campaignActionLoading}
              sx={{ bgcolor: "#543287", "&:hover": { bgcolor: "#43256f" }, fontWeight: 900 }}
            >
              {campaignActionLoading ? "Saving..." : "Save changes"}
            </Button>
          </Stack>
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
