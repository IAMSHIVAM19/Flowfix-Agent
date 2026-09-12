import { useState, useEffect } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Container,
  Divider,
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
import { technicianLogin, getActiveTechniciansList } from "../services/api";

function TechnicianLogin() {
  const navigate = useNavigate();
  const [techList, setTechList] = useState([]);
  const [selectedTech, setSelectedTech] = useState("Alex");
  const [pin, setPin] = useState("1234");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTechs() {
      try {
        const list = await getActiveTechniciansList();
        if (list && list.length > 0) {
          setTechList(list);
        }
      } catch (err) {
        console.error("Failed to load technician directory:", err);
      }
    }
    loadTechs();
  }, []);

  async function handleLogin(techName, pinCode) {
    const targetName = techName || selectedTech;
    const targetPin = pinCode || pin;

    if (!targetName.trim()) {
      setError("Please enter or select a technician name.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await technicianLogin(targetName, targetPin);
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
        backgroundColor: "#0B1120", // Deep slate navy
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

            {/* Quick 1-Click Demo Specialists */}
            <Box sx={{ mb: 3 }}>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#64748B",
                  fontWeight: 750,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                  mb: 1.5,
                  fontSize: "0.7rem",
                }}
              >
                Quick Demo Specialist Login (1-Click)
              </Typography>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: "repeat(2, 1fr)",
                  gap: 1.25,
                }}
              >
                {[
                  { name: "Alex", skills: "Hot Water, Burst Pipe" },
                  { name: "John", skills: "Blocked Drains, Toilets" },
                  { name: "Sarah", skills: "Leak Investigation, Roof" },
                  { name: "Ben", skills: "Gas Fitting, Heating" },
                ].map((tech) => (
                  <Button
                    key={tech.name}
                    fullWidth
                    variant="outlined"
                    onClick={() => {
                      setSelectedTech(tech.name);
                      handleLogin(tech.name, "1234");
                    }}
                    sx={{
                      p: 1.25,
                      borderRadius: "14px",
                      borderColor: selectedTech === tech.name ? "#3B82F6" : "rgba(255, 255, 255, 0.12)",
                      backgroundColor: selectedTech === tech.name ? "rgba(37, 99, 235, 0.15)" : "rgba(255, 255, 255, 0.03)",
                      textAlign: "left",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        borderColor: "#60A5FA",
                        backgroundColor: "rgba(37, 99, 235, 0.2)",
                        transform: "translateY(-1px)",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
                      <Box
                        sx={{
                          width: 22,
                          height: 22,
                          borderRadius: "50%",
                          backgroundColor: "rgba(37, 99, 235, 0.25)",
                          color: "#60A5FA",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.72rem",
                          fontWeight: 800,
                        }}
                      >
                        {tech.name.charAt(0)}
                      </Box>
                      <Typography variant="body2" fontWeight={750} sx={{ color: "#F8FAFC" }}>
                        {tech.name}
                      </Typography>
                    </Stack>
                    <Typography
                      variant="caption"
                      sx={{
                        color: "#94A3B8",
                        fontSize: "0.68rem",
                        mt: 0.5,
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        width: "100%",
                      }}
                    >
                      {tech.skills}
                    </Typography>
                  </Button>
                ))}
              </Box>
            </Box>

            <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 2.5 }} />

            {/* Custom Technician Credentials Form */}
            <Stack spacing={2} component="form" onSubmit={(e) => { e.preventDefault(); handleLogin(); }}>
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
                placeholder="Default PIN: 1234"
                helperText="Default field testing PIN is 1234"
                FormHelperTextProps={{ sx: { color: "#64748B" } }}
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
                {loading ? "Authenticating..." : `Sign In as ${selectedTech || "Technician"}`}
              </Button>
            </Stack>

            {/* Link back to Admin & Customer Portal */}
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
                onClick={() => navigate("/customer-portal")}
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
