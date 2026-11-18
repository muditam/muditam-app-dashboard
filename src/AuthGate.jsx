import React, { useEffect, useState } from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { getSession, hasDashboardAccess, invalidateDashboardToken } from "./auth";
import WidgetLogin from "./pages/widget/WidgetLogin";

export default function AuthGate({ children }) {
  const [state, setState] = useState({ status: "checking", user: null });

  const acceptUser = (user) => {
    setState({ status: !user ? "login" : hasDashboardAccess(user) ? "allowed" : "forbidden", user });
  };

  useEffect(() => {
    let mounted = true;
    const check = () => {
      invalidateDashboardToken();
      setState({ status: "checking", user: null });
      getSession().then((user) => {
        if (mounted) acceptUser(user);
      }).catch(() => {
        if (mounted) setState({ status: "error", user: null });
      });
    };
    check();
    window.addEventListener("muditam-widget-unauthorized", check);
    return () => {
      mounted = false;
      window.removeEventListener("muditam-widget-unauthorized", check);
    };
  }, []);

  if (state.status === "login") return <WidgetLogin onSuccess={acceptUser} />;
  if (state.status === "error") return (
    <Box sx={{ minHeight: "100vh", display: "grid", placeItems: "center" }}>
      <Box>Could not check your session. <Button onClick={() => window.location.reload()}>Try again</Button></Box>
    </Box>
  );

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
