import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert, Box, Button, Chip, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, LinearProgress, MenuItem, Paper, Stack, TextField, Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import VideoCallRoundedIcon from "@mui/icons-material/VideoCallRounded";
import UploadFileRoundedIcon from "@mui/icons-material/UploadFileRounded";

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
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [recordingFile, setRecordingFile] = useState(null);
  const [uploadForm, setUploadForm] = useState({ title: "Customer consultation recording", classSessionId: "", durationMinutes: 30, recordedAt: new Date().toISOString().slice(0, 16) });
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

  const uploadToWasabi = (url, file, headers) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", url);
    Object.entries(headers || {}).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) setUploadProgress(Math.round((event.loaded / event.total) * 100));
    };
    xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Wasabi upload failed (${xhr.status})`)));
    xhr.onerror = () => reject(new Error("Wasabi upload failed. Check the bucket CORS configuration and try again."));
    xhr.send(file);
  });

  const uploadRecording = async () => {
    if (!customerId) { setError("Select a customer before uploading a recording."); return; }
    if (!recordingFile) { setError("Select an MP4, WebM, or MOV recording."); return; }
    setUploading(true); setUploadProgress(0); setError(""); setNotice("");
    let pendingRecordingId = "";
    try {
      const init = await request("/api/program/admin/recordings/manual-upload", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          classSessionId: uploadForm.classSessionId || undefined,
          title: uploadForm.title,
          instructorName: "Muditam expert",
          durationMinutes: Number(uploadForm.durationMinutes || 0),
          recordedAt: new Date(uploadForm.recordedAt).toISOString(),
          mimeType: recordingFile.type || (recordingFile.name.toLowerCase().endsWith(".webm") ? "video/webm" : recordingFile.name.toLowerCase().endsWith(".mov") ? "video/quicktime" : "video/mp4"),
          sizeBytes: recordingFile.size,
        }),
      });
      pendingRecordingId = init.recording.id;
      await uploadToWasabi(init.uploadUrl, recordingFile, init.requiredHeaders);
      await request(`/api/program/admin/recordings/${init.recording.id}/manual-upload/complete`, {
        method: "POST",
        body: JSON.stringify({ published: true }),
      });
      setUploadProgress(100);
      setUploadOpen(false);
      setRecordingFile(null);
      setUploadForm({ title: "Customer consultation recording", classSessionId: "", durationMinutes: 30, recordedAt: new Date().toISOString().slice(0, 16) });
      setNotice("Recording uploaded privately to Wasabi and published to the customer.");
      await load();
    } catch (uploadError) {
      if (pendingRecordingId) request(`/api/program/admin/recordings/${pendingRecordingId}`, { method: "DELETE" }).catch(() => {});
      setError(uploadError.message);
    } finally {
      setUploading(false);
    }
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

        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems={{ sm: "center" }} gap={1} sx={{ mt: 3, mb: 1.5 }}>
          <Box><Typography variant="h5" fontWeight={950}>Customer recordings</Typography><Typography color="text.secondary" fontSize={13}>Upload Zoom computer recordings privately to Wasabi.</Typography></Box>
          <Button disabled={!customerId || !config?.recordingStorageConfigured} variant="contained" startIcon={<UploadFileRoundedIcon />} onClick={() => setUploadOpen(true)}>Upload recording</Button>
        </Stack>
        <Stack gap={1.25}>
          {recordings.map((recording) => <Paper key={recording.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: "#e7e0f3" }}><Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}><Box><Typography fontWeight={900}>{recording.customerName} · {recording.title}</Typography><Typography fontSize={13} color="text.secondary">{recording.customerPhone} · {formatDateTime(recording.recordedAt)} · {recording.durationMinutes || 0} min</Typography><Chip size="small" label={recording.status} color={recording.status === "ready" ? "success" : recording.status === "failed" ? "error" : "info"} sx={{ mt: .75 }} /></Box>{recording.status === "ready" ? <Button variant="contained" startIcon={<PlayCircleRoundedIcon />} onClick={() => playRecording(recording.id)}>View recording</Button> : null}</Stack></Paper>)}
          {!recordings.length ? <Paper variant="outlined" sx={{ p: 4, borderRadius: 2.5, textAlign: "center" }}><Typography fontWeight={900}>No customer recordings yet</Typography><Typography color="text.secondary">Select a customer and upload their Zoom computer recording.</Typography></Paper> : null}
        </Stack>
      </>}
      <Dialog open={uploadOpen} onClose={() => !uploading && setUploadOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={900}>Upload customer recording</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <Stack gap={2}>
            <Alert severity="info">The video uploads directly to private Wasabi storage. Maximum size: 2 GB.</Alert>
            <TextField label="Customer" value={selectedCustomer ? `${selectedCustomer.name} · ${selectedCustomer.phone}` : "Select a customer"} disabled />
            <TextField select label="Related meeting (optional)" value={uploadForm.classSessionId} onChange={(event) => setUploadForm({ ...uploadForm, classSessionId: event.target.value })}>
              <MenuItem value="">No related meeting</MenuItem>
              {meetings.map((meeting) => <MenuItem key={meeting.id} value={meeting.id}>{meeting.title} · {formatDateTime(meeting.startsAt)}</MenuItem>)}
            </TextField>
            <TextField label="Recording title" value={uploadForm.title} onChange={(event) => setUploadForm({ ...uploadForm, title: event.target.value })} />
            <Stack direction={{ xs: "column", sm: "row" }} gap={2}>
              <TextField fullWidth type="datetime-local" label="Recorded at" InputLabelProps={{ shrink: true }} value={uploadForm.recordedAt} onChange={(event) => setUploadForm({ ...uploadForm, recordedAt: event.target.value })} />
              <TextField fullWidth type="number" label="Duration (minutes)" value={uploadForm.durationMinutes} onChange={(event) => setUploadForm({ ...uploadForm, durationMinutes: event.target.value })} />
            </Stack>
            <Button component="label" variant="outlined" startIcon={<UploadFileRoundedIcon />} disabled={uploading}>
              {recordingFile ? recordingFile.name : "Choose MP4, WebM, or MOV"}
              <input hidden type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" onChange={(event) => setRecordingFile(event.target.files?.[0] || null)} />
            </Button>
            {recordingFile ? <Typography color="text.secondary" fontSize={13}>{(recordingFile.size / 1024 / 1024).toFixed(1)} MB</Typography> : null}
            {uploading ? <Box><LinearProgress variant="determinate" value={uploadProgress} /><Typography fontSize={12} sx={{ mt: .5 }}>{uploadProgress}% uploaded</Typography></Box> : null}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}><Button disabled={uploading} onClick={() => setUploadOpen(false)}>Cancel</Button><Button disabled={uploading || !recordingFile || !uploadForm.title.trim()} variant="contained" onClick={uploadRecording}>{uploading ? "Uploading…" : "Upload & publish"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
