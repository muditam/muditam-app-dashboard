import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://muditam-app-backend-ca1c8b03db09.herokuapp.com";

const formatDate = (value) => {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(new Date(value));
};

const formatStatus = (value) =>
  String(value || "unknown")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());

export default function Bookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filters, setFilters] = useState({
    booking_id: "",
    booking_date: "",
    collection_date: "",
    booking_status: "confirmed",
    package_code: "",
    phone: "",
  });

  const hasActiveFilters = (nextFilters) =>
    Boolean(
      nextFilters.booking_id ||
        nextFilters.booking_date ||
        nextFilters.collection_date ||
        nextFilters.booking_status ||
        nextFilters.package_code ||
        nextFilters.phone
    );

  const loadBookings = async (nextFilters = filters) => {
    if (!hasActiveFilters(nextFilters)) {
      setBookings([]);
      setMessage("Add at least one filter to load bookings.");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setMessage("");
      const search = new URLSearchParams();
      if (nextFilters.booking_id) search.set("booking_id", nextFilters.booking_id);
      if (nextFilters.booking_date) search.set("booking_date", nextFilters.booking_date);
      if (nextFilters.collection_date) search.set("collection_date", nextFilters.collection_date);
      if (nextFilters.booking_status) search.set("booking_status", nextFilters.booking_status);
      if (nextFilters.package_code) search.set("package_code", nextFilters.package_code);
      if (nextFilters.phone) search.set("phone", nextFilters.phone);

      const res = await fetch(`${API_BASE_URL}/api/redcliffe/bookings?${search.toString()}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to load bookings");
      setBookings(data.bookings || []);
    } catch (error) {
      setMessage(error.message || "Failed to load bookings");
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings(filters);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const counts = useMemo(() => {
    const total = bookings.length;
    const confirmed = bookings.filter((item) => ["confirmed", "order booked"].includes(String(item.status || "").toLowerCase())).length;
    const pending = bookings.filter((item) => String(item.status || "").toLowerCase() === "pending").length;
    const reportsReady = bookings.filter((item) => String(item.raw?.report_status || "").toLowerCase() === "ready").length;
    return { total, confirmed, pending, reportsReady };
  }, [bookings]);

  return (
    <Box sx={{ maxWidth: 1360, mx: "auto", p: { xs: 1.5, sm: 2, md: 3 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 3 },
          mb: 2.5,
          borderRadius: 4,
          color: "#fff",
          background: "linear-gradient(135deg, #17312b 0%, #205446 52%, #4d8c78 100%)",
        }}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2}>
          <Box>
            <Typography fontSize={13} fontWeight={800} sx={{ opacity: 0.82, textTransform: "uppercase" }}>
              Bookings
            </Typography>
            <Typography variant="h4" fontWeight={900}>
              Redcliffe Bookings
            </Typography>
            <Typography sx={{ opacity: 0.8, mt: 0.75, maxWidth: 720 }}>
              Live bookings created through the Redcliffe flow appear here for operations review.
            </Typography>
          </Box>
          <Stack direction="row" gap={1} flexWrap="wrap" alignItems="flex-start">
            <Chip label={`${counts.total} total`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 800 }} />
            <Chip label={`${counts.confirmed} accepted`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 800 }} />
            <Chip label={`${counts.pending} pending`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 800 }} />
            <Chip label={`${counts.reportsReady} reports ready`} sx={{ bgcolor: "rgba(255,255,255,0.14)", color: "#fff", fontWeight: 800 }} />
          </Stack>
        </Stack>
      </Paper>

      <Paper
        elevation={0}
        sx={{
          p: { xs: 2, md: 2.5 },
          borderRadius: 4,
          border: "1px solid rgba(16, 24, 40, 0.08)",
          boxShadow: "0 18px 48px rgba(16, 24, 40, 0.08)",
          mb: 2.5,
        }}
      >
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "repeat(4, minmax(0, 1fr))" },
            gap: 1.75,
          }}
        >
          <TextField
            label="Booking ID"
            placeholder="1385002"
            value={filters.booking_id}
            onChange={(event) => setFilters((current) => ({ ...current, booking_id: event.target.value }))}
          />
          <TextField
            type="date"
            label="Booking date"
            InputLabelProps={{ shrink: true }}
            value={filters.booking_date}
            onChange={(event) => setFilters((current) => ({ ...current, booking_date: event.target.value }))}
          />
          <TextField
            type="date"
            label="Collection date"
            InputLabelProps={{ shrink: true }}
            value={filters.collection_date}
            onChange={(event) => setFilters((current) => ({ ...current, collection_date: event.target.value }))}
          />
          <TextField
            label="Booking status"
            placeholder="confirmed / order booked"
            value={filters.booking_status}
            onChange={(event) => setFilters((current) => ({ ...current, booking_status: event.target.value }))}
          />
          <TextField
            label="Package code"
            placeholder="CAMP015"
            value={filters.package_code}
            onChange={(event) => setFilters((current) => ({ ...current, package_code: event.target.value.toUpperCase() }))}
          />
          <TextField
            label="Phone"
            placeholder="10-digit mobile"
            value={filters.phone}
            onChange={(event) => setFilters((current) => ({ ...current, phone: event.target.value }))}
          />
        </Box>
        <Stack direction="row" gap={1} sx={{ mt: 2 }}>
          <Button variant="contained" sx={{ bgcolor: "#182230" }} onClick={() => loadBookings(filters)}>
            Find bookings
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              const next = {
                booking_id: "",
                booking_date: "",
                collection_date: "",
                booking_status: "confirmed",
                package_code: "",
                phone: "",
              };
              setFilters(next);
              loadBookings(next);
            }}
          >
            Reset
          </Button>
        </Stack>
      </Paper>

      {message ? (
        <Alert severity="error" sx={{ mb: 2.5 }}>
          {message}
        </Alert>
      ) : null}

      <Paper
        elevation={0}
        sx={{
          p: 2.5,
          borderRadius: 3,
          border: "1px solid rgba(16, 24, 40, 0.08)",
          boxShadow: "0 18px 48px rgba(16, 24, 40, 0.08)",
          bgcolor: "#fff",
        }}
      >
        <Typography variant="h6" fontWeight={900} sx={{ mb: 2 }}>
          Booking queue
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Booking ID</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Packages</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Age / Gender</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Collection</TableCell>
                <TableCell>Booking date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {!loading && bookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9}>
                    <Typography color="text.secondary">No bookings found.</Typography>
                  </TableCell>
                </TableRow>
              ) : null}

              {bookings.map((item) => {
                const primaryPatient = item.patients?.find((patient) => patient.isPrimary) || item.patients?.[0] || {};
                return (
                  <TableRow key={item.bookingId} hover>
                    <TableCell>{item.bookingId || "—"}</TableCell>
                    <TableCell>{primaryPatient.name || "—"}</TableCell>
                    <TableCell>{item.packageCodes?.join(", ") || "—"}</TableCell>
                    <TableCell>{item.phone || "—"}</TableCell>
                    <TableCell>{[primaryPatient.age || "—", primaryPatient.gender || "—"].join(" / ")}</TableCell>
                    <TableCell>{item.locationLabel || item.address || "—"}</TableCell>
                    <TableCell>{[formatDate(item.collectionDate), item.collectionTimeLabel || "—"].join(" · ")}</TableCell>
                    <TableCell>{formatDate(item.bookingDate)}</TableCell>
                    <TableCell>{formatStatus(item.status)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
