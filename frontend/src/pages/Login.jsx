import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  AutoAwesome,
  FlashOn,
  LockOutlined,
  OpenInNew,
  WaterDrop,
  Engineering,
  CalendarMonth,
} from "@mui/icons-material";

import { login } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    if (event) event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(username, password);
      navigate("/overview", { replace: true });
    } catch (err) {
      const message = err?.message || "Unable to sign in.";

      if (message.toLowerCase().includes("inactive")) {
        setError("This account is inactive. Please contact an administrator.");
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: { xs: 2, sm: 4 },
        backgroundColor: "#0F172A", // Deep sleek navy background
        backgroundImage: "radial-gradient(at 0% 0%, rgba(37, 99, 235, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(13, 148, 136, 0.15) 0px, transparent 50%)",
      }}
    >
      <Box
        sx={{
          width: "100%",
          maxWidth: 960,
          borderRadius: "28px",
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.1fr 0.9fr" },
          backgroundColor: "#FFFFFF",
          boxShadow: "0 25px 70px -15px rgba(0, 0, 0, 0.4)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {/* Left Side: Brand & Feature Highlights */}
        <Box
          sx={{
            p: { xs: 3, sm: 5 },
            backgroundColor: "#0B1120",
            color: "#FFFFFF",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
          }}
        >
          <Box>
            {/* Logo */}
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 4 }}>
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #2563EB, #0D9488)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 8px 20px rgba(37, 99, 235, 0.4)",
                }}
              >
                <WaterDrop sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={850} sx={{ letterSpacing: "-0.03em", color: "#FFFFFF" }}>
                  FlowFix
                </Typography>
                <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 600 }}>
                  AI Operations & Dispatch Platform
                </Typography>
              </Box>
            </Stack>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{ letterSpacing: "-0.03em", lineHeight: 1.2, mb: 2, color: "#F8FAFC" }}
            >
              Intelligent Service Operations, Automated.
            </Typography>

            <Typography variant="body2" sx={{ color: "#94A3B8", mb: 4, lineHeight: 1.6 }}>
              FlowFix pairs customer natural language plumbing requests with live technician availability, diagnostic triage, and instant appointment confirmation.
            </Typography>

            {/* Feature Bullets */}
            <Stack spacing={2}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <FlashOn sx={{ fontSize: 16 }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#E2E8F0", fontWeight: 550 }}>
                  Emergency Triage & Issue Severity Classification
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: "rgba(37, 99, 235, 0.15)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Engineering sx={{ fontSize: 16 }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#E2E8F0", fontWeight: 550 }}>
                  Certified Specialist Matching & Workload Metering
                </Typography>
              </Stack>

              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box sx={{ width: 28, height: 28, borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.15)", color: "#34D399", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <AutoAwesome sx={{ fontSize: 16 }} />
                </Box>
                <Typography variant="body2" sx={{ color: "#E2E8F0", fontWeight: 550 }}>
                  FlowFix AI Copilot with Real-Time Database Query Tools
                </Typography>
              </Stack>
            </Stack>
          </Box>

          <Box sx={{ mt: 4, pt: 3, borderTop: "1px solid rgba(255, 255, 255, 0.1)" }}>
            <Button
              size="small"
              variant="text"
              endIcon={<OpenInNew sx={{ fontSize: "14px !important" }} />}
              onClick={() => navigate("/customer-portal")}
              sx={{ color: "#94A3B8", p: 0, fontWeight: 600, "&:hover": { color: "#60A5FA" } }}
            >
              Looking to book a service? Visit Customer Portal
            </Button>
          </Box>
        </Box>

        {/* Right Side: Sign In Form */}
        <Box sx={{ p: { xs: 3, sm: 5 }, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#0F172A" sx={{ letterSpacing: "-0.02em" }}>
                Admin Sign In
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Enter your credentials to manage operations.
              </Typography>
            </Box>

            {error && <Alert severity="error">{error}</Alert>}

            <Box component="form" onSubmit={handleSubmit}>
              <Stack spacing={2}>
                <TextField
                  fullWidth
                  label="Username"
                  placeholder="e.g. admin"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                />

                <TextField
                  fullWidth
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />

                <Button
                  type="submit"
                  variant="outlined"
                  size="large"
                  disabled={loading || !username || !password}
                  sx={{
                    minHeight: 48,
                    borderRadius: "12px",
                    fontWeight: 700,
                  }}
                >
                  {loading ? <CircularProgress size={22} color="inherit" /> : "Sign In with Credentials"}
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Box>
    </Box>
  );
}

export default Login;