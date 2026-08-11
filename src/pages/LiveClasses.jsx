import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import LaunchRoundedIcon from "@mui/icons-material/LaunchRounded";
import CloudDoneRoundedIcon from "@mui/icons-material/CloudDoneRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import OndemandVideoRoundedIcon from "@mui/icons-material/OndemandVideoRounded";
import PlayCircleRoundedIcon from "@mui/icons-material/PlayCircleRounded";
import ReplayRoundedIcon from "@mui/icons-material/ReplayRounded";
import StopCircleRoundedIcon from "@mui/icons-material/StopCircleRounded";
import VideoCameraFrontRoundedIcon from "@mui/icons-material/VideoCameraFrontRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL
  || (import.meta.env.DEV ? "http://localhost:3001" : "https://muditam-app-backend-ca1c8b03db09.herokuapp.com");
const DASHBOARD_KEY = import.meta.env.VITE_DASHBOARD_API_KEY || "";

const dateKey = (date) => date.toISOString().slice(0, 10);
const defaultStart = () => {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(8, 0, 0, 0);
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};
const formatDateTime = (value) => new Intl.DateTimeFormat("en-IN", {
  weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit",
}).format(new Date(value));

const statusColor = { live: "success", scheduled: "info", completed: "default", cancelled: "error" };

export default function LiveClasses() {
  const [classes, setClasses] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    title: "Morning Yoga Flow",
    instructorName: "Priya Nair",
    category: "yoga",
    startsAt: defaultStart(),
    durationMinutes: 30,
    points: 3,
    agenda: "Live guided yoga class for metabolic health",
  });

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(DASHBOARD_KEY ? { "x-dashboard-key": DASHBOARD_KEY } : {}),
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Live classes request failed");
    return data;
  }, []);

  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const from = new Date();
      from.setDate(from.getDate() - 1);
      const to = new Date();
      to.setDate(to.getDate() + 30);
      const [classData, configData, recordingData] = await Promise.all([
        request(`/api/program/admin/classes?from=${dateKey(from)}&to=${dateKey(to)}`),
        request("/api/program/admin/classes/config"),
        request("/api/program/admin/recordings"),
      ]);
      setClasses(classData.classes || []);
      setRecordings(recordingData.recordings || []);
      setConfig(configData);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => { loadClasses(); }, [loadClasses]);

  const counts = useMemo(() => ({
    scheduled: classes.filter((item) => item.status === "scheduled").length,
    live: classes.filter((item) => item.status === "live").length,
    completed: classes.filter((item) => item.status === "completed").length,
  }), [classes]);

  const recordingCounts = useMemo(() => ({
    ready: recordings.filter((item) => item.status === "ready").length,
    processing: recordings.filter((item) => item.status === "processing").length,
    failed: recordings.filter((item) => item.status === "failed").length,
  }), [recordings]);

  const createClass = async () => {
    setSaving(true);
    setError("");
    try {
      await request("/api/program/admin/classes", {
        method: "POST",
        body: JSON.stringify({ ...form, startsAt: new Date(form.startsAt).toISOString() }),
      });
      setDialogOpen(false);
      setForm((current) => ({ ...current, startsAt: defaultStart() }));
      await loadClasses();
    } catch (saveError) {
      setError(saveError.message);
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (classId, status) => {
    setError("");
    try {
      await request(`/api/program/admin/classes/${classId}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      await loadClasses();
    } catch (statusError) {
      setError(statusError.message);
    }
  };

  const cancelClass = async (classId) => {
    if (!window.confirm("Cancel this class and its Zoom meeting?")) return;
    setError("");
    try {
      await request(`/api/program/admin/classes/${classId}`, { method: "DELETE" });
      await loadClasses();
    } catch (cancelError) {
      setError(cancelError.message);
    }
  };

  const playRecording = async (recordingId) => {
    setError("");
    try {
      const data = await request(`/api/program/admin/recordings/${recordingId}/playback`, { method: "POST" });
      window.open(data.playbackUrl, "_blank", "noopener,noreferrer");
    } catch (playError) {
      setError(playError.message);
    }
  };

  const syncRecording = async (recordingId) => {
    setError("");
    try {
      await request(`/api/program/admin/recordings/${recordingId}/sync`, { method: "POST" });
      await loadClasses();
    } catch (syncError) {
      setError(syncError.message);
    }
  };

  const setRecordingPublished = async (recordingId, published) => {
    setError("");
    try {
      await request(`/api/program/admin/recordings/${recordingId}`, {
        method: "PATCH",
        body: JSON.stringify({ published }),
      });
      await loadClasses();
    } catch (publishError) {
      setError(publishError.message);
    }
  };

  const deleteRecording = async (recordingId) => {
    if (!window.confirm("Permanently delete this archived class recording?")) return;
    setError("");
    try {
      await request(`/api/program/admin/recordings/${recordingId}`, { method: "DELETE" });
      await loadClasses();
    } catch (deleteError) {
      setError(deleteError.message);
    }
  };

  return (
    <Box sx={{ maxWidth: 1320, mx: "auto" }}>
      <Paper elevation={0} sx={{ p: { xs: 2.25, md: 3 }, borderRadius: 3, color: "#fff", background: "linear-gradient(135deg, #241044 0%, #5632a5 62%, #7c59d1 100%)", mb: 2.5 }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography fontSize={13} fontWeight={850} sx={{ opacity: 0.72, textTransform: "uppercase" }}>Vital Program</Typography>
            <Typography variant="h4" fontWeight={950}>Live class studio</Typography>
            <Typography sx={{ mt: 0.75, opacity: 0.78 }}>Create Zoom classes, start the host room, and control what members can join.</Typography>
          </Box>
          <Stack direction="row" gap={1} alignItems="flex-start" flexWrap="wrap">
            <Chip label={`${counts.live} live`} sx={{ bgcolor: "#d1fadf", color: "#087a3d", fontWeight: 900 }} />
            <Chip label={`${counts.scheduled} scheduled`} sx={{ bgcolor: "rgba(255,255,255,.14)", color: "#fff", fontWeight: 850 }} />
            <Button startIcon={<AddRoundedIcon />} variant="contained" onClick={() => setDialogOpen(true)} sx={{ bgcolor: "#fff", color: "#452684", fontWeight: 900, "&:hover": { bgcolor: "#f5f0ff" } }}>Schedule class</Button>
          </Stack>
        </Stack>
      </Paper>

      {config && !config.zoomConfigured ? <Alert severity="warning" sx={{ mb: 2 }}>Zoom is not configured. Add the four ZOOM_* environment values to the backend before scheduling a class.</Alert> : null}
      {config && (!config.zoomWebhookConfigured || !config.recordingStorageConfigured) ? (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Recorded classes are not fully configured. Add the Zoom webhook secret and private Wasabi recording bucket to the backend.
        </Alert>
      ) : null}
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}

      {loading ? <Box sx={{ py: 8, display: "grid", placeItems: "center" }}><CircularProgress /></Box> : (
        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 2 }}>
          {classes.map((item) => (
            <Paper key={item.id} elevation={0} sx={{ p: 2.25, borderRadius: 3, border: "1px solid #e8e0f7", boxShadow: "0 14px 35px rgba(38, 22, 70, .07)" }}>
              <Stack direction="row" gap={1.5} alignItems="flex-start">
                <Box sx={{ width: 50, height: 50, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "#f2ebff", color: "#7047c5", flexShrink: 0 }}><VideoCameraFrontRoundedIcon /></Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" gap={1}>
                    <Typography fontSize={17} fontWeight={900}>{item.title}</Typography>
                    <Chip size="small" color={statusColor[item.status]} label={item.status} sx={{ fontWeight: 850, textTransform: "capitalize" }} />
                  </Stack>
                  <Typography color="text.secondary" fontSize={13}>{item.instructorName} · {item.durationMinutes} min · {item.points} points</Typography>
                  <Typography fontWeight={800} sx={{ mt: 1 }}>{formatDateTime(item.startsAt)}</Typography>
                  <Typography color="text.secondary" fontSize={12}>Zoom meeting {item.meetingId || "not provisioned"}</Typography>
                </Box>
              </Stack>
              <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mt: 2 }}>
                {item.hostStartUrl ? <Button size="small" startIcon={<LaunchRoundedIcon />} variant="contained" onClick={() => window.open(item.hostStartUrl, "_blank", "noopener,noreferrer")}>Start as host</Button> : null}
                {item.status === "scheduled" ? <Button size="small" startIcon={<PlayCircleRoundedIcon />} color="success" variant="outlined" onClick={() => updateStatus(item.id, "live")}>Mark live</Button> : null}
                {item.status === "live" ? <Button size="small" startIcon={<StopCircleRoundedIcon />} variant="outlined" onClick={() => updateStatus(item.id, "completed")}>Complete</Button> : null}
                {!['completed', 'cancelled'].includes(item.status) ? <Button size="small" color="error" onClick={() => cancelClass(item.id)}>Cancel</Button> : null}
              </Stack>
            </Paper>
          ))}
          {!classes.length ? <Paper elevation={0} sx={{ p: 5, borderRadius: 3, border: "1px dashed #d8caef", textAlign: "center" }}><Typography fontWeight={900}>No upcoming classes</Typography><Typography color="text.secondary">Schedule the first Zoom class for your members.</Typography></Paper> : null}
        </Box>
      )}

      <Paper elevation={0} sx={{ mt: 3, p: { xs: 2.25, md: 3 }, borderRadius: 3, border: "1px solid #e8e0f7" }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1.5} sx={{ mb: 2.25 }}>
          <Box>
            <Typography variant="h5" fontWeight={950}>Recorded sessions</Typography>
            <Typography color="text.secondary">Private Zoom recordings archived to Wasabi and published to members.</Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap">
            <Chip icon={<CloudDoneRoundedIcon />} label={`${recordingCounts.ready} ready`} color="success" variant="outlined" sx={{ fontWeight: 850 }} />
            <Chip label={`${recordingCounts.processing} processing`} color="info" variant="outlined" sx={{ fontWeight: 850 }} />
            {recordingCounts.failed ? <Chip label={`${recordingCounts.failed} failed`} color="error" sx={{ fontWeight: 850 }} /> : null}
          </Stack>
        </Stack>

        <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "repeat(2, minmax(0, 1fr))" }, gap: 1.5 }}>
          {recordings.map((recording) => (
            <Paper key={recording.id} variant="outlined" sx={{ p: 2, borderRadius: 2.5, borderColor: recording.status === "failed" ? "#f3b9b9" : "#e8e0f7" }}>
              <Stack direction="row" gap={1.5} alignItems="flex-start">
                <Box sx={{ width: 48, height: 48, borderRadius: 2, display: "grid", placeItems: "center", bgcolor: "#f2ebff", color: "#7047c5", flexShrink: 0 }}>
                  <OndemandVideoRoundedIcon />
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Stack direction="row" justifyContent="space-between" gap={1} alignItems="flex-start">
                    <Typography fontSize={16} fontWeight={900}>{recording.title}</Typography>
                    <Chip
                      size="small"
                      label={recording.status}
                      color={recording.status === "ready" ? "success" : recording.status === "failed" ? "error" : "info"}
                      sx={{ fontWeight: 850, textTransform: "capitalize" }}
                    />
                  </Stack>
                  <Typography color="text.secondary" fontSize={13}>
                    {recording.instructorName || "Muditam instructor"} · {recording.durationMinutes || 0} min
                  </Typography>
                  <Typography color="text.secondary" fontSize={12}>
                    {recording.recordedAt ? formatDateTime(recording.recordedAt) : "Recording date pending"}
                  </Typography>
                  {recording.status === "failed" ? <Typography color="error" fontSize={12} sx={{ mt: 0.75 }}>{recording.failureMessageSafe || "Archival failed. Retry after checking Zoom and Wasabi."}</Typography> : null}
                </Box>
              </Stack>
              <Stack direction="row" gap={0.75} flexWrap="wrap" sx={{ mt: 1.75 }}>
                {recording.status === "ready" ? <Button size="small" variant="contained" startIcon={<PlayCircleRoundedIcon />} onClick={() => playRecording(recording.id)}>Play</Button> : null}
                {recording.status === "failed" ? <Button size="small" variant="outlined" startIcon={<ReplayRoundedIcon />} onClick={() => syncRecording(recording.id)}>Retry archive</Button> : null}
                {recording.status === "ready" ? (
                  <Button
                    size="small"
                    variant="outlined"
                    startIcon={recording.published ? <VisibilityOffRoundedIcon /> : <VisibilityRoundedIcon />}
                    onClick={() => setRecordingPublished(recording.id, !recording.published)}
                  >
                    {recording.published ? "Unpublish" : "Publish"}
                  </Button>
                ) : null}
                <Button size="small" color="error" startIcon={<DeleteOutlineRoundedIcon />} onClick={() => deleteRecording(recording.id)}>Delete</Button>
              </Stack>
            </Paper>
          ))}
          {!recordings.length ? (
            <Box sx={{ gridColumn: "1 / -1", py: 4, textAlign: "center", bgcolor: "#fbf9ff", borderRadius: 2.5 }}>
              <OndemandVideoRoundedIcon sx={{ color: "#8a70bf", fontSize: 38 }} />
              <Typography fontWeight={900}>No recorded sessions yet</Typography>
              <Typography color="text.secondary" fontSize={13}>Completed Zoom cloud recordings will appear here automatically.</Typography>
            </Box>
          ) : null}
        </Box>
      </Paper>

      <Dialog open={dialogOpen} onClose={() => !saving && setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle fontWeight={900}>Schedule Zoom class</DialogTitle>
        <DialogContent sx={{ pt: "12px !important" }}>
          <Stack gap={2}>
            <TextField label="Class title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} />
            <TextField label="Instructor" value={form.instructorName} onChange={(event) => setForm({ ...form, instructorName: event.target.value })} />
            <TextField select label="Category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })}>
              <MenuItem value="yoga">Yoga</MenuItem><MenuItem value="strength">Strength</MenuItem><MenuItem value="running">Running</MenuItem><MenuItem value="breathwork">Breathwork</MenuItem>
            </TextField>
            <TextField type="datetime-local" label="Start time" InputLabelProps={{ shrink: true }} value={form.startsAt} onChange={(event) => setForm({ ...form, startsAt: event.target.value })} />
            <Stack direction="row" gap={2}>
              <TextField fullWidth type="number" label="Duration (minutes)" value={form.durationMinutes} onChange={(event) => setForm({ ...form, durationMinutes: Number(event.target.value) })} />
              <TextField fullWidth type="number" label="Guarantee points" value={form.points} onChange={(event) => setForm({ ...form, points: Number(event.target.value) })} />
            </Stack>
            <TextField multiline minRows={2} label="Class description" value={form.agenda} onChange={(event) => setForm({ ...form, agenda: event.target.value })} />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}><Button onClick={() => setDialogOpen(false)}>Cancel</Button><Button disabled={saving || !config?.zoomConfigured} variant="contained" onClick={createClass}>{saving ? "Creating Zoom meeting..." : "Create class"}</Button></DialogActions>
      </Dialog>
    </Box>
  );
}
