import React, { useEffect, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Link, Pagination, Paper, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@mui/material";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import { commerceWidgetApi } from "../../lib/commerceWidgetApi";
import { DateRangeFilter } from "./DateRangeFilter";
import { widgetDateRangeParams } from "../../lib/widgetDateRange";
import { theme } from "./theme";

const LEADS_PAGE_SIZE = 50;

function formatDate(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "numeric", minute: "2-digit" });
}

function WidgetLeads() {
  const [leads, setLeads] = useState([]);
  const [dateRange, setDateRange] = useState(undefined);
  const [page, setPage] = useState(1);
  const [totalLeads, setTotalLeads] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const latestRequest = useRef(0);

  const load = () => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    setLoading(true);
    setError("");
    setLeads([]);
    setTotalLeads(0);
    commerceWidgetApi.getLeads({
      ...widgetDateRangeParams(dateRange),
      limit: LEADS_PAGE_SIZE,
      page,
    })
      .then((data) => {
        if (latestRequest.current === requestId) {
          setLeads(data.leads || []);
          setTotalLeads(data.total ?? data.leads?.length ?? 0);
        }
      })
      .catch((err) => {
        if (latestRequest.current === requestId) setError(err.message);
      })
      .finally(() => {
        if (latestRequest.current === requestId) setLoading(false);
      });
  };

  useEffect(() => {
    load();
    return () => { latestRequest.current += 1; };
  }, [dateRange, page]);

  return (
    <Box>
      <Stack direction={{ xs: "column", md: "row" }} justifyContent="flex-end" gap={2} sx={{ mb: 2.5 }}>
        <Stack direction="row" gap={1} alignItems="center">
          <DateRangeFilter range={dateRange} onChange={(range) => { setPage(1); setDateRange(range); }} />
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
      <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" alignItems="center" gap={1.5} sx={{ mt: 2 }}>
        <Typography sx={{ fontSize: 13, color: theme.muted }}>
          Showing {totalLeads ? ((page - 1) * LEADS_PAGE_SIZE) + 1 : 0}
          –{Math.min(page * LEADS_PAGE_SIZE, totalLeads)} of {totalLeads} leads
        </Typography>
        <Pagination
          count={Math.max(Math.ceil(totalLeads / LEADS_PAGE_SIZE), 1)}
          page={page}
          onChange={(_, nextPage) => setPage(nextPage)}
          disabled={loading || totalLeads <= LEADS_PAGE_SIZE}
          color="primary"
          shape="rounded"
        />
      </Stack>
    </Box>
  );
}

export default WidgetLeads;
