import { useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Stack,
  TextField,
  Typography,
  CircularProgress,
  Alert,
  ThemeProvider,
} from "@mui/material";
import technicianTheme from "../theme/technicianTheme";
import {
  Engineering,
  ArrowForward,
  AdminPanelSettings,
  WaterDrop,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { technicianLogin } from "../services/api";

function TechnicianLogin() {
  const navigate = useNavigate();
  const [selectedTech, setSelectedTech] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleLogin(e) {
    if (e && e.preventDefault) e.preventDefault();

    if (!selectedTech.trim()) {
      setError("Please enter your technician name.");
      return;
    }
    if (!pin.trim()) {
      setError("Please enter your security PIN.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await technicianLogin(selectedTech.trim(), pin.trim());
      navigate("/technician-portal");
    } catch (err) {
      setError(err.message || "Failed to log in as field technician.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ThemeProvider theme={technicianTheme}>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#0B1120",
          position: "relative",
          overflow: "hidden",
          p: { xs: 2, sm: 4 },
        }}
      >
        {/* Background ambient lighting */}
        <Box
          sx={{
            position: "absolute",
            width: 500,
            height: 500,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(37, 99, 235, 0.18) 0%, transparent 70%)",
            top: "-10%",
            left: "20%",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />
        <Box
          sx={{
            position: "absolute",
            width: 450,
            height: 450,
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(13, 148, 136, 0.16) 0%, transparent 70%)",
            bottom: "-10%",
            right: "15%",
            filter: "blur(60px)",
            pointerEvents: "none",
          }}
        />

        <Container maxWidth="sm" sx={{ position: "relative", zIndex: 1 }}>
          <Card
            sx={{
              borderRadius: "28px",
              backgroundColor: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(24px)",
              border: "1px solid rgba(255, 255, 255, 0.10)",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.5)",
              p: { xs: 2.5, sm: 4 },
            }}
          >
            <CardContent sx={{ p: 0 }}>
              {/* Header */}
              <Box sx={{ textAlign: "center", mb: 3 }}>
                <Box
                  sx={{
                    width: 56,
                    height: 56,
                    borderRadius: "16px",
                    background: "linear-gradient(135deg, #2563EB, #0D9488)",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#FFFFFF",
                    boxShadow: "0 8px 24px -4px rgba(37, 99, 235, 0.4)",
                    mb: 2,
                  }}
                >
                  <Engineering sx={{ fontSize: 32 }} />
                </Box>

                <Typography
                  variant="h4"
                  fontWeight={850}
                  sx={{
                    color: "#F8FAFC",
                    letterSpacing: "-0.03em",
                    fontSize: { xs: "1.8rem", sm: "2.2rem" },
                  }}
                >
                  Technician Portal
                </Typography>
                <Typography
                  variant="body2"
                  sx={{ color: "#94A3B8", mt: 0.5, fontWeight: 500 }}
                >
                  Field Specialist Work Orders & Live Dispatch Manifest
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ mb: 3, borderRadius: "12px" }}>
                  {error}
                </Alert>
              )}

              {/* Technician Credentials Form */}
              <Stack spacing={2.5} component="form" onSubmit={handleLogin}>
                <TextField
                  fullWidth
                  label="Technician Name"
                  value={selectedTech}
                  onChange={(e) => setSelectedTech(e.target.value)}
                  placeholder="e.g. Alex, John, Sarah, Ben"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      color: "#F8FAFC",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                      "&.Mui-focused fieldset": { borderColor: "#3B82F6" },
                    },
                    "& .MuiInputLabel-root": { color: "#94A3B8" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#60A5FA" },
                  }}
                />

                <TextField
                  fullWidth
                  type="password"
                  label="Security PIN"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter your 4-digit PIN"
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      borderRadius: "14px",
                      backgroundColor: "rgba(255, 255, 255, 0.04)",
                      color: "#F8FAFC",
                      "& fieldset": { borderColor: "rgba(255, 255, 255, 0.15)" },
                      "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.3)" },
                      "&.Mui-focused fieldset": { borderColor: "#3B82F6" },
                    },
                    "& .MuiInputLabel-root": { color: "#94A3B8" },
                    "& .MuiInputLabel-root.Mui-focused": { color: "#60A5FA" },
                  }}
                />

                <Button
                  fullWidth
                  size="large"
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  endIcon={loading ? <CircularProgress size={18} color="inherit" /> : <ArrowForward />}
                  sx={{
                    borderRadius: "14px",
                    minHeight: 50,
                    fontWeight: 800,
                    fontSize: "0.95rem",
                    textTransform: "none",
                    background: "linear-gradient(135deg, #2563EB, #0D9488)",
                    boxShadow: "0 8px 24px -4px rgba(37, 99, 235, 0.4)",
                    "&:hover": {
                      background: "linear-gradient(135deg, #1D4ED8, #0F766E)",
                      boxShadow: "0 12px 28px -4px rgba(37, 99, 235, 0.6)",
                    },
                  }}
                >
                  {loading ? "Authenticating..." : (selectedTech ? `Sign In as ${selectedTech}` : "Sign In to Field Portal")}
                </Button>
              </Stack>

              {/* Navigation links */}
              <Box sx={{ mt: 3, pt: 2, borderTop: "1px solid rgba(255, 255, 255, 0.06)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Button
                  size="small"
                  startIcon={<AdminPanelSettings sx={{ fontSize: "16px !important" }} />}
                  onClick={() => navigate("/login")}
                  sx={{ color: "#94A3B8", textTransform: "none", fontSize: "0.78rem" }}
                >
                  Dispatch Command Login
                </Button>
                <Button
                  size="small"
                  startIcon={<WaterDrop sx={{ fontSize: "16px !important" }} />}
                  onClick={() => navigate("/")}
                  sx={{ color: "#94A3B8", textTransform: "none", fontSize: "0.78rem" }}
                >
                  Customer Portal
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default TechnicianLogin;
