import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? "http://localhost:3001" : "https://muditam-app-backend-ca1c8b03db09.herokuapp.com");
const DASHBOARD_KEY = import.meta.env.VITE_DASHBOARD_API_KEY || "";
const dateKey = (date) => date.toISOString().slice(0, 10);
const defaultStart = () => {
  const date = new Date(Date.now() + 24 * 60 * 60 * 1000);
  date.setHours(11, 0, 0, 0);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const formatDateTime = (value) => value ? new Intl.DateTimeFormat("en-IN", {
  day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit",
}).format(new Date(value)) : "—";

export default function ZoomMeetings() {
  const [customers, setCustomers] = useState([]);
  const [customerId, setCustomerId] = useState("");
  const [meetings, setMeetings] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ topic: "Muditam customer consultation", startsAt: defaultStart(), durationMinutes: 30 });

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...(DASHBOARD_KEY ? { "x-dashboard-key": DASHBOARD_KEY } : {}), ...options.headers },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || `Zoom request failed (${response.status})`);
    return data;
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const from = new Date(); from.setDate(from.getDate() - 30);
      const to = new Date(); to.setDate(to.getDate() + 90);
      const suffix = customerId ? `&customerId=${encodeURIComponent(customerId)}` : "";
      const recordingSuffix = customerId ? `?customerId=${encodeURIComponent(customerId)}` : "";
      const [customerData, meetingData, recordingData, configData] = await Promise.all([
        request("/api/program/admin/customers"),
        request(`/api/program/admin/classes?from=${dateKey(from)}&to=${dateKey(to)}${suffix}`),
        request(`/api/program/admin/recordings${recordingSuffix}`),
        request("/api/program/admin/classes/config"),
      ]);
      setCustomers(customerData.customers || []);
      setMeetings((meetingData.classes || []).filter((item) => item.customerId));
      setRecordings((recordingData.recordings || []).filter((item) => item.customerId));
      setConfig(configData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [customerId, request]);

  useEffect(() => { load(); }, [load]);
  const selectedCustomer = useMemo(() => customers.find((item) => item.id === customerId), [customers, customerId]);

  const schedule = async () => {
    if (!customerId) { setError("Select a customer before scheduling a meeting."); return; }
    setSaving(true); setError(""); setNotice("");
    try {
      await request("/api/program/admin/classes", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          title: form.topic,
          instructorName: "Muditam expert",
          category: "consultation",
          startsAt: new Date(form.startsAt).toISOString(),
          durationMinutes: Number(form.durationMinutes),
          points: 0,
          agenda: `Private Muditam consultation for ${selectedCustomer?.name || "customer"}`,
        }),
      });
      setNotice("Customer Zoom meeting created.");
      setForm((current) => ({ ...current, startsAt: defaultStart() }));
      await load();
    } catch (saveError) { setError(saveError.message); } finally { setSaving(false); }
  };

  const copyJoinLink = async (meeting) => {
    await navigator.clipboard.writeText(meeting.webJoinUrl || "");
    setNotice(`Customer join link copied for ${meeting.customerName}.`);
  };

  const updateStatus = async (meetingId, status) => {
    try {
      await request(`/api/program/admin/classes/${meetingId}`, { method: "PATCH", body: JSON.stringify({ status }) });
      await load();
    } catch (statusError) { setError(statusError.message); }
  };

  const playRecording = async (recordingId) => {
    try {
      const data = await request(`/api/program/admin/recordings/${recordingId}/playback`, { method: "POST" });
      window.open(data.playbackUrl, "_blank", "noopener,noreferrer");
    } catch (playError) { setError(playError.message); }
  };

  return (
    <Box sx={{ maxWidth: 1320, mx: "auto" }}>
      <Paper elevation={0} sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, color: "#fff", background: "linear-gradient(135deg,#102a43,#543287 65%,#805ad5)", mb: 2.5 }}>
        <Typography fontSize={13} fontWeight={850} sx={{ opacity: .72, textTransform: "uppercase" }}>Customer care</Typography>
        <Typography variant="h4" fontWeight={950}>Customer Zoom meetings</Typography>
        <Typography sx={{ mt: .75, opacity: .8 }}>Schedule, join, and review recordings customer by customer.</Typography>
      </Paper>
      {config && !config.zoomConfigured ? <Alert severity="warning" sx={{ mb: 2 }}>Zoom credentials are not ready on the backend.</Alert> : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      {notice ? <Alert severity="success" onClose={() => setNotice("")} sx={{ mb: 2 }}>{notice}</Alert> : null}

      <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: "1px solid #e7e0f3", mb: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} gap={1.5} alignItems={{ md: "center" }}>
          <TextField select fullWidth label="Customer" value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
            <MenuItem value="">All customers</MenuItem>
            {customers.map((customer) => <MenuItem key={customer.id} value={customer.id}>{customer.name} · {customer.phone}</MenuItem>)}
          </TextField>
          <TextField fullWidth label="Meeting title" value={form.topic} onChange={(event) => setForm({ ...form, topic: event.target.value })} />
          <TextField fullWidth type="datetime-local" label="Start time" InputLabelProps={{ shrink: true }} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
          <TextField sx={{ minWidth: 130 }} type="number" label="Minutes" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: event.target.value })} />
          <Button disabled={saving || !customerId || !config?.zoomConfigured} variant="contained" startIcon={<AddRoundedIcon />} onClick={schedule} sx={{ minWidth: 160, minHeight: 54 }}>{saving ? "Creating…" : "Schedule Zoom"}</Button>
          <Button onClick={load} startIcon={<RefreshRoundedIcon />}>Refresh</Button>
        </Stack>
      </Paper>

      {loading ? <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : <>
        <Typography variant="h5" fontWeight={950} sx={{ mb: 1.5 }}>Meetings</Typography>
        <Stack gap={1.25}>
          {meetings.map((meeting) => <Paper key={meeting.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#e7e0f3" }}>
            <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
              <Stack direction="row" gap={1.5}><Box sx={{ width: 46, height: 46, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "#f2ebff", color: "#7047c5" }}><VideoCallRoundedIcon /></Box><Box><Typography fontWeight={900}>{meeting.customerName} · {meeting.title}</Typography><Typography fontSize={13} color="text.secondary">{meeting.customerPhone} · {formatDateTime(meeting.startsAt)} · {meeting.durationMinutes} min</Typography><Chip size="small" label={meeting.status} sx={{ mt: .75, textTransform: "capitalize", fontWeight: 800 }} /></Box></Stack>
              <Stack direction="row" gap={1} alignItems="center" flexWrap="wrap">
                {meeting.hostStartUrl ? <Button variant="contained" startIcon={<LaunchRoundedIcon />} onClick={() => window.open(meeting.hostStartUrl, "_blank", "noopener,noreferrer")}>Join as host</Button> : null}
                {meeting.webJoinUrl ? <Button variant="outlined" startIcon={<ContentCopyRoundedIcon />} onClick={() => copyJoinLink(meeting)}>Copy customer link</Button> : null}
                {meeting.status === "scheduled" ? <Button color="success" onClick={() => updateStatus(meeting.id, "live")}>Mark live</Button> : null}
                {meeting.status === "live" ? <Button onClick={() => updateStatus(meeting.id, "completed")}>Complete</Button> : null}
              </Stack>
            </Stack>
          </Paper>)}
          {!meetings.length ? <Paper variant="outlined" sx={{ p: 4, borderRadius: 2.5, textAlign: "center" }}><Typography fontWeight={900}>No customer meetings found</Typography><Typography color="text.secondary">Select a customer and schedule their first Zoom session.</Typography></Paper> : null}
        </Stack>

        <Typography variant="h5" fontWeight={950} sx={{ mt: 3, mb: 1.5 }}>Customer recordings</Typography>
        <Stack gap={1.25}>
          {recordings.map((recording) => <Paper key={recording.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#e7e0f3" }}><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}><Box><Typography fontWeight={900}>{recording.customerName} · {recording.title}</Typography><Typography fontSize={13} color="text.secondary">{recording.customerPhone} · {formatDateTime(recording.recordedAt)} · {recording.durationMinutes || 0} min</Typography><Chip size="small" label={recording.status} color={recording.status === "ready" ? "success" : recording.status === "failed" ? "error" : "info"} sx={{ mt: .75 }} /></Box>{recording.status === "ready" ? <Button variant="contained" startIcon={<PlayCircleRoundedIcon />} onClick={() => playRecording(recording.id)}>View recording</Button> : null}</Stack></Paper>)}
          {!recordings.length ? <Paper variant="outlined" sx={{ p: 4, borderRadius: 2.5, textAlign: "center" }}><Typography fontWeight={900}>No customer recordings yet</Typography><Typography color="text.secondary">Completed cloud recordings will be linked to the matching customer automatically.</Typography></Paper> : null}
        </Stack>
      </>}
    </Box>
  );
}
