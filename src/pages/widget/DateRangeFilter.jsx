import React, { useState } from "react";
import { Box, Button, Popover, Stack, Typography } from "@mui/material";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { theme } from "./theme";

export function formatDate(date) {
  if (!date) return "";
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${month}/${day}/${date.getFullYear()}`;
}

export function DateRangeFilter({ range, onChange }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const label = range?.from && range?.to
    ? `${formatDate(range.from)} - ${formatDate(range.to)}`
    : "Select date range";

  return (
    <>
      <Box
        onClick={(event) => setAnchorEl(event.currentTarget)}
        sx={{
          display: "flex", alignItems: "center", gap: 1,
          border: `1px solid ${theme.border}`, borderRadius: `${theme.radiusSmall}px`,
          px: 1.5, py: 1.15, cursor: "pointer",
          "&:hover": { borderColor: theme.borderStrong },
        }}
      >
        <CalendarTodayRoundedIcon sx={{ fontSize: 15, color: theme.muted }} />
        <Typography sx={{ fontSize: 13, color: range?.from ? theme.ink : theme.faint }}>
          {label}
        </Typography>
      </Box>
      <Popover
        open={Boolean(anchorEl)}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      >
        <Box
          sx={{
            p: 1.5,
            "--rdp-accent-color": theme.accent,
            "--rdp-range_start-color": "#fff",
            "--rdp-range_end-color": "#fff",
            "--rdp-range_middle-background-color": theme.accentSoft,
          }}
        >
          <DayPicker
            mode="range"
            selected={range}
            onSelect={onChange}
            defaultMonth={range?.to}
          />
          <Stack direction="row" justifyContent="space-between" sx={{ px: 1, pb: 0.5 }}>
            <Button size="small" sx={{ textTransform: "none", color: theme.muted }} onClick={() => onChange(undefined)}>
              Clear
            </Button>
            <Button
              size="small" variant="contained" disableElevation
              sx={{ textTransform: "none", bgcolor: theme.accent, "&:hover": { bgcolor: theme.accent } }}
              onClick={() => setAnchorEl(null)}
            >
              Done
            </Button>
          </Stack>
        </Box>
      </Popover>
    </>
  );
}
