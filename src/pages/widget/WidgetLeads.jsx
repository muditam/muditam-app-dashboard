import React, { useEffect, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Link, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { DateRangeFilter } from "./DateRangeFilter";
import { theme } from "./theme";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}

function WidgetLeads() {
  const [leads, setLeads] = useState([]);
  const [dateRange, setDateRange] = useState(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    commerceWidgetApi.getLeads({
      from: dateRange?.from ? dateRange.from.toISOString() : undefined,
      to: dateRange?.to ? dateRange.to.toISOString() : undefined,
      limit: 200,
    })
      .then((data) => setLeads(data.leads || []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [dateRange]);

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="flex-end" gap={2} sx={{ mb: 2.5 }}>
        <Stack direction="row" gap={1} alignItems="center">
          <DateRangeFilter value={dateRange} onChange={setDateRange} />
          <Button startIcon={<RefreshRoundedIcon />} variant="outlined" onClick={load} sx={{ textTransform: "none", borderRadius: 2 }}>
            Refresh
          </Button>
        </Stack>
      </Stack>
      {error ? <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert> : null}
      <TableContainer component={Paper} sx={{ borderRadius: `${theme.radius}px`, border: `1px solid ${theme.border}`, boxShadow: theme.shadowSoft }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Customer</TableCell>
              <TableCell>Query</TableCell>
              <TableCell>Session</TableCell>
              <TableCell>Context</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {leads.map((lead) => (
              <TableRow key={lead.leadId || lead.conversationId}>
                <TableCell>
                  <Typography fontWeight={750}>{lead.name || "Name pending"}</Typography>
                  <Link href={`tel:${lead.phone}`} underline="hover" sx={{ fontWeight: 650 }}>{lead.phone}</Link>
                </TableCell>
                <TableCell sx={{ maxWidth: 420 }}>
                  <Typography sx={{ whiteSpace: "normal" }}>{lead.query || "—"}</Typography>
                </TableCell>
                <TableCell>
                  <Typography fontSize={12} sx={{ fontFamily: "monospace", color: theme.faint }}>{lead.conversationId || lead.leadId || "—"}</Typography>
                </TableCell>
                <TableCell>
                  <Stack gap={0.6} alignItems="flex-start">
                    {lead.productContext ? <Chip size="small" label={lead.productContext} /> : null}
                    {lead.pageUrl ? <Link href={lead.pageUrl} target="_blank" rel="noreferrer" underline="hover" fontSize={12}>Source page</Link> : <Typography fontSize={12} color="text.secondary">No page</Typography>}
                  </Stack>
                </TableCell>
                <TableCell><Chip size="small" color={lead.status === "new" ? "success" : "default"} label={lead.status || "new"} /></TableCell>
                <TableCell>{formatDate(lead.createdAt)}</TableCell>
              </TableRow>
            ))}
            {!loading && !leads.length ? (
              <TableRow><TableCell colSpan={6}><Box sx={{ py: 6, textAlign: "center", color: theme.faint, fontWeight: 650 }}>No support leads yet</Box></TableCell></TableRow>
            ) : null}
          </TableBody>
        </Table>
        {loading ? <Box sx={{ p: 5, textAlign: "center" }}><CircularProgress /></Box> : null}
      </TableContainer>
    </Box>
  );
}

export default WidgetLeads;
