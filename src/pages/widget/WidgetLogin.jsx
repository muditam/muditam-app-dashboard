import React, { useState } from "react";
import { Box, Stack, Typography, TextField, Button, IconButton, InputAdornment } from "@mui/material";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import { theme } from "./theme";
import { login } from "./widgetAuth";

const ERROR_MESSAGES = {
  invalid_credentials: "Incorrect username or password.",
  widget_admin_not_configured: "Login isn't configured on the server yet.",
};

function WidgetLogin({ onSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(username, password);
      setError("");
      onSuccess();
    } catch (err) {
      setError(ERROR_MESSAGES[err.message] || "Couldn't sign in. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: theme.canvas,
        display: "grid",
        placeItems: "center",
        px: 2,
      }}
    >
      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          width: "100%",
          maxWidth: 360,
          p: 4,
          borderRadius: `${theme.radius}px`,
          border: `1px solid ${theme.border}`,
          bgcolor: theme.surface,
        }}
      >
        <Typography sx={{ fontSize: 12.5, fontWeight: 650, color: theme.faint, letterSpacing: "0.01em", mb: 0.5 }}>
          Muditam AI
        </Typography>
        <Typography sx={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.02em", color: theme.ink, mb: 3 }}>
          Sign in to continue
        </Typography>

        <Stack gap={2}>
          <TextField
            label="Username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            size="small"
            autoFocus
            fullWidth
          />
          <TextField
            label="Password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            size="small"
            fullWidth
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword((value) => !value)}
                      edge="end"
                      size="small"
                      aria-label={showPassword ? "Hide password" : "Show password"}
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <VisibilityOffRoundedIcon sx={{ fontSize: 18, color: theme.muted }} />
                      ) : (
                        <VisibilityRoundedIcon sx={{ fontSize: 18, color: theme.muted }} />
                      )}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          {error && (
            <Typography sx={{ fontSize: 12.5, color: theme.danger }}>
              {error}
            </Typography>
          )}
          <Button
            type="submit"
            variant="contained"
            disableElevation
            disabled={submitting}
            sx={{
              mt: 1,
              bgcolor: theme.accent,
              textTransform: "none",
              fontWeight: 650,
              borderRadius: `${theme.radiusSmall}px`,
              "&:hover": { bgcolor: theme.accent },
            }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </Stack>
      </Box>
    </Box>
  );
}

export default WidgetLogin;
