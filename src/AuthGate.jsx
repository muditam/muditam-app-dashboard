import React, { useEffect, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { getSession, hasDashboardAccess, redirectToLogin } from "./auth";

export default function AuthGate({ children }) {
  const [state, setState] = useState({ status: "checking", user: null });

  useEffect(() => {
    let mounted = true;
    getSession()
      .then((user) => {
        if (!mounted) return;
        if (!user) {
          setState({ status: "redirecting", user: null });
          redirectToLogin();
          return;
        }
        setState({ status: hasDashboardAccess(user) ? "allowed" : "forbidden", user });
      })
      .catch(() => {
        if (!mounted) return;
        setState({ status: "redirecting", user: null });
        redirectToLogin();
      });
    return () => { mounted = false; };
  }, []);

  if (state.status === "allowed") return typeof children === "function" ? children(state.user) : children;

  if (state.status === "forbidden") {
    return (
      <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f7f6f8", p: 3 }}>
        <Paper elevation={0} sx={{ width: "min(430px, 100%)", p: 4, borderRadius: 3, border: "1px solid #e7e1eb", textAlign: "center" }}>
          <Typography sx={{ fontSize: 11, fontWeight: 900, letterSpacing: ".14em", color: "#70408f" }}>ACCESS REQUIRED</Typography>
          <Typography variant="h5" sx={{ mt: 1, fontWeight: 900 }}>Chat Dashboard is not enabled for this account.</Typography>
          <Typography sx={{ mt: 1, color: "text.secondary", fontSize: 13 }}>Ask a superadmin to add Chat Dashboard access from Admin access.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center", bgcolor: "#f7f6f8", color: "text.secondary", fontWeight: 800 }}>
      Checking secure session...
    </Box>
  );
}
