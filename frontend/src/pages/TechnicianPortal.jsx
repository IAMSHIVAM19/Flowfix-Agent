import { useEffect, useState, useMemo, useCallback } from "react";
import {
  Alert,
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  CircularProgress,
  ThemeProvider,
} from "@mui/material";
import technicianTheme from "../theme/technicianTheme";
import {
  Engineering,
  Phone,
  Navigation,
  CheckCircle,
  Cancel,
  DirectionsCar,
  TaskAlt,
  CalendarMonth,
  LocationOn,
  Build,
  AccessTime,
  Refresh,
  Logout,
  OpenInNew,
  Speed,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

import StatusChip from "../components/StatusChip";
import {
  getTechnicianMe,
  getTechnicianBookings,
  updateTechnicianBookingStatus,
  getTechnicianSchedule,
  getActiveTechniciansList,
  technicianLogin,
  clearTechnicianToken,
} from "../services/api";

const MotionCard = motion.create(Card);

function formatTime(timeStr) {
  if (!timeStr) return "";
  const [h, m] = timeStr.split(":");
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit" }).format(d);
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(`${dateStr}T00:00:00`);
  return new Intl.DateTimeFormat("en-AU", {
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(d);
}

function TechnicianPortal() {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [bookings, setBookings] = useState({ up_next: null, today: [], upcoming: [], completed: [] });
  const [schedule, setSchedule] = useState([]);
  const [techList, setTechList] = useState([]);
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ open: false, message: "", severity: "success" });

  // Modals state
  const [declineModal, setDeclineModal] = useState({ open: false, booking: null, reason: "", customNote: "" });
  const [completeModal, setCompleteModal] = useState({ open: false, booking: null, notes: "" });

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [profData, bookData, schedData, listData] = await Promise.all([
        getTechnicianMe(),
        getTechnicianBookings(),
        getTechnicianSchedule(),
        getActiveTechniciansList(),
      ]);

      setProfile(profData);
      setBookings(bookData);
      setSchedule(schedData || []);
      setTechList(listData || []);
    } catch (err) {
      console.error("Failed to load technician portal data:", err);
      if (err.message && err.message.includes("401")) {
        navigate("/technician/login");
        return;
      }
      setError(err.message || "Failed to load technician manifest.");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Quick switch technician for demo purposes
  async function handleSwitchTechnician(techName) {
    if (!techName || techName === profile?.name) return;
    try {
      setLoading(true);
      await technicianLogin(techName, "1234");
      await loadData();
      setToast({
        open: true,
        message: `Switched active specialist profile to ${techName}`,
        severity: "info",
      });
    } catch (err) {
      setError(`Failed to switch to ${techName}: ${err.message}`);
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    clearTechnicianToken();
    navigate("/technician/login");
  }

  // Action handlers
  async function handleStatusChange(bookingId, status, reason = null, notes = null) {
    try {
      setActionLoading(true);
      await updateTechnicianBookingStatus(bookingId, status, reason, notes);

      // Re-load bookings
      const newBookings = await getTechnicianBookings();
      setBookings(newBookings);

      let successMsg = `Booking #${bookingId} marked as ${status.replace("_", " ")}.`;
      if (status === "accepted") successMsg = `Accepted Booking #${bookingId}! Operations team notified.`;
      if (status === "declined") successMsg = `Declined Booking #${bookingId}. Dispatch alerted for reassignment.`;
      if (status === "en_route") successMsg = `Status updated: On My Way / En Route to customer.`;
      if (status === "completed") successMsg = `Job #${bookingId} marked completed! Great work.`;

      setToast({
        open: true,
        message: successMsg,
        severity: status === "declined" ? "warning" : "success",
      });
    } catch (err) {
      setToast({
        open: true,
        message: err.message || `Failed to update status to ${status}`,
        severity: "error",
      });
    } finally {
      setActionLoading(false);
    }
  }

  function openDeclineDialog(booking) {
    setDeclineModal({
      open: true,
      booking,
      reason: "Previous emergency job overrun / running late",
      customNote: "",
    });
  }

  function submitDecline() {
    if (!declineModal.booking) return;
    const finalReason = declineModal.customNote.trim()
      ? `${declineModal.reason}: ${declineModal.customNote.trim()}`
      : declineModal.reason;

    handleStatusChange(declineModal.booking.id, "declined", finalReason);
    setDeclineModal({ open: false, booking: null, reason: "", customNote: "" });
  }

  function openCompleteDialog(booking) {
    setCompleteModal({
      open: true,
      booking,
      notes: "Diagnosed issue on-site, replaced worn seals and fittings. Tested line pressure to 500kPa with zero leaks.",
    });
  }

  function submitComplete() {
    if (!completeModal.booking) return;
    handleStatusChange(completeModal.booking.id, "completed", null, completeModal.notes);
    setCompleteModal({ open: false, booking: null, notes: "" });
  }

  const upNext = bookings.up_next;

  return (
    <ThemeProvider theme={technicianTheme}>
      <Box sx={{ minHeight: "100vh", backgroundColor: "#0F172A", color: "#F8FAFC", pb: 6 }}>
      {/* Top Field Tech Navigation Header */}
      <Box
        sx={{
          backgroundColor: "#1E293B",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          py: 1.5,
          px: { xs: 2, sm: 3, md: 5 },
          position: "sticky",
          top: 0,
          zIndex: 100,
          backdropFilter: "blur(12px)",
        }}
      >
        <Box
          sx={{
            maxWidth: 1300,
            mx: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: 1.5,
          }}
        >
          {/* Logo & Status */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: "12px",
                background: "linear-gradient(135deg, #2563EB, #0D9488)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#FFFFFF",
                boxShadow: "0 4px 14px rgba(37, 99, 235, 0.35)",
              }}
            >
              <Engineering sx={{ fontSize: 22 }} />
            </Box>
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="h6" fontWeight={850} sx={{ color: "#FFFFFF", fontSize: "1.1rem", letterSpacing: "-0.02em" }}>
                  FlowFix Tech
                </Typography>
                <Chip
                  label="FIELD PORTAL"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.62rem",
                    fontWeight: 800,
                    backgroundColor: "rgba(37, 99, 235, 0.25)",
                    color: "#60A5FA",
                    border: "1px solid rgba(96, 165, 250, 0.3)",
                  }}
                />
              </Stack>
              <Stack direction="row" spacing={0.75} alignItems="center">
                <Box
                  sx={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    backgroundColor: "#10B981",
                    boxShadow: "0 0 8px #10B981",
                  }}
                />
                <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 650, fontSize: "0.72rem" }}>
                  ON DUTY • LIVE MANIFEST
                </Typography>
              </Stack>
            </Box>
          </Stack>

          {/* Right Action Tools & Demo Switcher */}
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* Quick Demo Switcher */}
            {techList.length > 0 && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography variant="caption" sx={{ color: "#64748B", display: { xs: "none", sm: "block" } }}>
                  Active Specialist:
                </Typography>
                <Select
                  size="small"
                  value={profile?.name || "Alex"}
                  onChange={(e) => handleSwitchTechnician(e.target.value)}
                  MenuProps={{
                    slotProps: {
                      paper: {
                        sx: {
                          backgroundColor: "#1E293B !important",
                          color: "#F8FAFC",
                          borderRadius: "12px",
                          border: "1px solid rgba(255, 255, 255, 0.15)",
                          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
                          backgroundImage: "none",
                        },
                      },
                    },
                    PaperProps: {
                      sx: {
                        backgroundColor: "#1E293B !important",
                        color: "#F8FAFC",
                        borderRadius: "12px",
                        border: "1px solid rgba(255, 255, 255, 0.15)",
                        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
                        backgroundImage: "none",
                      },
                    },
                  }}
                  sx={{
                    height: 36,
                    borderRadius: "10px",
                    backgroundColor: "rgba(255, 255, 255, 0.05)",
                    color: "#F8FAFC",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    "& .MuiSelect-select": {
                      color: "#F8FAFC",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.15)",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255, 255, 255, 0.3)",
                    },
                    "& .MuiSvgIcon-root": { color: "#94A3B8" },
                  }}
                >
                  {techList.map((t) => (
                    <MenuItem key={t.id} value={t.name} sx={{ fontSize: "0.85rem", fontWeight: 600 }}>
                      {t.name} ({t.services.slice(0, 2).join(", ")})
                    </MenuItem>
                  ))}
                </Select>
              </Box>
            )}

            <Tooltip title="Refresh Manifest">
              <IconButton onClick={loadData} sx={{ color: "#94A3B8", backgroundColor: "rgba(255, 255, 255, 0.04)" }}>
                <Refresh fontSize="small" />
              </IconButton>
            </Tooltip>

            <Button
              size="small"
              variant="outlined"
              endIcon={<OpenInNew sx={{ fontSize: "14px !important" }} />}
              onClick={() => window.open("/appointments", "_blank")}
              sx={{
                borderRadius: "10px",
                borderColor: "rgba(255, 255, 255, 0.18)",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#E2E8F0",
                fontWeight: 650,
                fontSize: "0.78rem",
                textTransform: "none",
                display: { xs: "none", md: "inline-flex" },
                "&:hover": {
                  borderColor: "rgba(56, 189, 248, 0.4)",
                  backgroundColor: "rgba(56, 189, 248, 0.1)",
                  color: "#38BDF8",
                },
              }}
            >
              Dispatch Command
            </Button>

            <Button
              size="small"
              variant="contained"
              startIcon={<Logout sx={{ fontSize: "14px !important" }} />}
              onClick={handleLogout}
              sx={{
                borderRadius: "10px",
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                color: "#F87171",
                fontWeight: 700,
                fontSize: "0.78rem",
                textTransform: "none",
                boxShadow: "none",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                "&:hover": {
                  backgroundColor: "rgba(239, 68, 68, 0.25)",
                  color: "#EF4444",
                },
              }}
            >
              Sign Out
            </Button>
          </Stack>
        </Box>
      </Box>

      {/* Main Container */}
      <Container maxWidth="lg" sx={{ mt: 3, px: { xs: 2, sm: 3 } }}>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: "14px" }} onClose={() => setError("")}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ py: 10, textAlign: "center" }}>
            <CircularProgress size={48} sx={{ color: "#3B82F6" }} />
            <Typography variant="body2" sx={{ color: "#94A3B8", mt: 2 }}>
              Loading technician dispatch manifest...
            </Typography>
          </Box>
        ) : (
          <Stack spacing={3.5}>
            {/* KPI Stat Cards */}
            <Grid container spacing={2}>
              <Grid size={{ xs: 6, sm: 3 }}>
                <Card
                  sx={{
                    borderRadius: "20px",
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    p: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                    Today's Workload
                  </Typography>
                  <Typography variant="h4" fontWeight={850} sx={{ color: "#F8FAFC", mt: 0.5 }}>
                    {profile?.today_jobs_count || 0} <Typography component="span" variant="body2" color="text.secondary">jobs</Typography>
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Card
                  sx={{
                    borderRadius: "20px",
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    p: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                    Upcoming Bookings
                  </Typography>
                  <Typography variant="h4" fontWeight={850} sx={{ color: "#38BDF8", mt: 0.5 }}>
                    {profile?.upcoming_jobs_count || 0}
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Card
                  sx={{
                    borderRadius: "20px",
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    p: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                    Completed Repairs
                  </Typography>
                  <Typography variant="h4" fontWeight={850} sx={{ color: "#34D399", mt: 0.5 }}>
                    {profile?.completed_jobs_count || 0}
                  </Typography>
                </Card>
              </Grid>

              <Grid size={{ xs: 6, sm: 3 }}>
                <Card
                  sx={{
                    borderRadius: "20px",
                    backgroundColor: "rgba(30, 41, 59, 0.7)",
                    border: "1px solid rgba(255, 255, 255, 0.07)",
                    p: 2,
                  }}
                >
                  <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                    Certified Skills
                  </Typography>
                  <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, mt: 0.75 }}>
                    {(profile?.services || []).slice(0, 3).map((s) => (
                      <Chip
                        key={s}
                        label={s}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          backgroundColor: "rgba(37, 99, 235, 0.15)",
                          color: "#60A5FA",
                          fontWeight: 700,
                        }}
                      />
                    ))}
                    {(profile?.services || []).length > 3 && (
                      <Chip
                        label={`+${profile.services.length - 3}`}
                        size="small"
                        sx={{
                          height: 20,
                          fontSize: "0.65rem",
                          backgroundColor: "rgba(255, 255, 255, 0.08)",
                          color: "#94A3B8",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>
                </Card>
              </Grid>
            </Grid>

            {/* HERO CARD: "UP NEXT" JOB */}
            <Box>
              <Typography
                variant="h6"
                fontWeight={800}
                sx={{
                  color: "#F8FAFC",
                  mb: 1.5,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  letterSpacing: "-0.02em",
                }}
              >
                <Speed sx={{ color: "#38BDF8" }} /> Next Immediate Assignment
              </Typography>

              {upNext ? (
                <MotionCard
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  sx={{
                    borderRadius: "24px",
                    backgroundColor: "rgba(30, 41, 59, 0.85)",
                    backdropFilter: "blur(20px)",
                    border: "1px solid rgba(56, 189, 248, 0.3)",
                    boxShadow: "0 20px 50px -10px rgba(15, 23, 42, 0.7), 0 0 30px rgba(56, 189, 248, 0.1)",
                    p: { xs: 2.5, sm: 3.5 },
                  }}
                >
                  <CardContent sx={{ p: 0 }}>
                    {/* Header: Date, Shift, Status */}
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        flexWrap: "wrap",
                        gap: 1.5,
                        mb: 2.5,
                      }}
                    >
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            p: 1,
                            px: 1.5,
                            borderRadius: "12px",
                            background: "linear-gradient(135deg, #0284C7, #2563EB)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            gap: 1,
                            boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                          }}
                        >
                          <AccessTime sx={{ fontSize: 18 }} />
                          <Typography variant="body2" fontWeight={800}>
                            {formatDate(upNext.appointment_date)} • {formatTime(upNext.start_time)} – {formatTime(upNext.end_time)}
                          </Typography>
                        </Box>

                        <Chip
                          label={upNext.urgency === "high" ? "Emergency Priority" : "Standard Dispatch"}
                          size="small"
                          sx={{
                            fontWeight: 800,
                            fontSize: "0.72rem",
                            backgroundColor: upNext.urgency === "high" ? "rgba(239, 68, 68, 0.2)" : "rgba(100, 116, 139, 0.15)",
                            color: upNext.urgency === "high" ? "#F87171" : "#94A3B8",
                            border: upNext.urgency === "high" ? "1px solid rgba(239, 68, 68, 0.4)" : "1px solid rgba(100, 116, 139, 0.2)",
                          }}
                        />
                      </Stack>

                      <StatusChip status={upNext.status} size="medium" />
                    </Box>

                    {/* Customer Info & Direct Actions */}
                    <Grid container spacing={3} sx={{ mb: 3 }}>
                      {/* Left: Customer & Address */}
                      <Grid size={{ xs: 12, md: 7 }}>
                        <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 700, textTransform: "uppercase" }}>
                          Customer Contact & Worksite Location
                        </Typography>

                        <Typography variant="h5" fontWeight={850} sx={{ color: "#F8FAFC", mt: 0.5, mb: 0.5 }}>
                          {upNext.customer_name}
                        </Typography>

                        <Stack direction="row" spacing={1} alignItems="center" sx={{ color: "#94A3B8", mb: 1.5 }}>
                          <LocationOn sx={{ fontSize: 18, color: "#38BDF8", flexShrink: 0 }} />
                          <Typography variant="body2" fontWeight={600} sx={{ color: "#E2E8F0" }}>
                            {upNext.customer_address}
                          </Typography>
                        </Stack>

                        <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                          <Button
                            variant="contained"
                            size="small"
                            startIcon={<Navigation />}
                            onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(upNext.customer_address)}`, "_blank")}
                            sx={{
                              borderRadius: "12px",
                              backgroundColor: "#0284C7",
                              fontWeight: 750,
                              textTransform: "none",
                              boxShadow: "0 4px 12px rgba(2, 132, 199, 0.3)",
                              "&:hover": { backgroundColor: "#0369A1" },
                            }}
                          >
                            Navigate (Google Maps)
                          </Button>

                          {(() => {
                            const hasPhone = Boolean(
                              upNext.customer_phone &&
                              upNext.customer_phone !== "N/A" &&
                              upNext.customer_phone.trim() !== ""
                            );

                            return (
                              <Button
                                variant="outlined"
                                size="small"
                                disabled={!hasPhone}
                                startIcon={
                                  <Phone
                                    sx={{
                                      fontSize: "18px !important",
                                      color: hasPhone ? "#38BDF8" : "rgba(255, 255, 255, 0.35)",
                                    }}
                                  />
                                }
                                onClick={() => {
                                  if (hasPhone) {
                                    window.open(`tel:${upNext.customer_phone}`, "_self");
                                  }
                                }}
                                sx={{
                                  borderRadius: "12px",
                                  borderColor: hasPhone
                                    ? "rgba(56, 189, 248, 0.4)"
                                    : "rgba(255, 255, 255, 0.15)",
                                  backgroundColor: hasPhone
                                    ? "rgba(56, 189, 248, 0.1)"
                                    : "rgba(255, 255, 255, 0.04)",
                                  color: hasPhone ? "#F8FAFC" : "rgba(255, 255, 255, 0.45)",
                                  fontWeight: 750,
                                  textTransform: "none",
                                  px: 2,
                                  transition: "all 0.18s ease-in-out",
                                  "&:hover": {
                                    borderColor: "#38BDF8",
                                    backgroundColor: "rgba(56, 189, 248, 0.2)",
                                    color: "#FFFFFF",
                                    boxShadow: "0 0 16px rgba(56, 189, 248, 0.25)",
                                  },
                                  "&.Mui-disabled": {
                                    color: "rgba(255, 255, 255, 0.4)",
                                    borderColor: "rgba(255, 255, 255, 0.1)",
                                    backgroundColor: "rgba(255, 255, 255, 0.03)",
                                  },
                                }}
                              >
                                {hasPhone ? `Call ${upNext.customer_phone}` : "Call (No Phone)"}
                              </Button>
                            );
                          })()}
                        </Stack>
                      </Grid>

                      {/* Right: Diagnosed Service & Quote Estimate */}
                      <Grid size={{ xs: 12, md: 5 }}>
                        <Box
                          sx={{
                            p: 2,
                            borderRadius: "18px",
                            backgroundColor: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                          }}
                        >
                          <Box>
                            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                              <Build sx={{ fontSize: 16, color: "#F59E0B" }} />
                              <Typography variant="caption" sx={{ color: "#F59E0B", fontWeight: 800, textTransform: "uppercase" }}>
                                {upNext.service}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" sx={{ color: "#CBD5E1", fontStyle: "italic", mb: 2 }}>
                              "{upNext.issue}"
                            </Typography>
                          </Box>

                          {upNext.quote_estimate && (
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: "12px",
                                backgroundColor: "rgba(16, 185, 129, 0.08)",
                                border: "1px solid rgba(16, 185, 129, 0.2)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                              }}
                            >
                              <Box>
                                <Typography variant="caption" sx={{ color: "#34D399", fontWeight: 750, display: "block" }}>
                                  Estimated Job Value
                                </Typography>
                                <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.68rem" }}>
                                  Includes ${upNext.quote_estimate.callout_fee} call-out
                                </Typography>
                              </Box>
                              <Typography variant="h6" fontWeight={850} sx={{ color: "#34D399" }}>
                                ${upNext.quote_estimate.estimated_min}–${upNext.quote_estimate.estimated_max} AUD
                              </Typography>
                            </Box>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", my: 2.5 }} />

                    {/* Primary Action Buttons based on status */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", justifyContent: "space-between" }}>
                      <Typography variant="caption" sx={{ color: "#94A3B8", fontWeight: 650 }}>
                        Work Order Action Control:
                      </Typography>

                      <Stack direction="row" spacing={1.5} sx={{ flexWrap: "wrap", gap: 1 }}>
                        {/* If confirmed or received: Show Accept and Decline */}
                        {(upNext.status === "confirmed" || upNext.status === "received" || upNext.status === "scheduled") && (
                          <>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              disabled={actionLoading}
                              onClick={() => openDeclineDialog(upNext)}
                              sx={{
                                borderRadius: "12px",
                                fontWeight: 750,
                                textTransform: "none",
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                borderColor: "rgba(239, 68, 68, 0.35)",
                                color: "#F87171",
                                "&:hover": {
                                  borderColor: "#EF4444",
                                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                                  color: "#EF4444",
                                },
                              }}
                            >
                              Decline Job
                            </Button>

                            <Button
                              variant="contained"
                              color="success"
                              startIcon={<CheckCircle />}
                              disabled={actionLoading}
                              onClick={() => handleStatusChange(upNext.id, "accepted")}
                              sx={{
                                borderRadius: "12px",
                                fontWeight: 800,
                                textTransform: "none",
                                px: 3,
                                backgroundColor: "#059669",
                                boxShadow: "0 4px 14px rgba(5, 150, 105, 0.35)",
                                "&:hover": { backgroundColor: "#047857" },
                              }}
                            >
                              Accept Booking
                            </Button>
                          </>
                        )}

                        {/* If accepted: Show En Route and Decline */}
                        {upNext.status === "accepted" && (
                          <>
                            <Button
                              variant="outlined"
                              color="error"
                              startIcon={<Cancel />}
                              disabled={actionLoading}
                              onClick={() => openDeclineDialog(upNext)}
                              sx={{
                                borderRadius: "12px",
                                fontWeight: 750,
                                textTransform: "none",
                                backgroundColor: "rgba(239, 68, 68, 0.1)",
                                borderColor: "rgba(239, 68, 68, 0.35)",
                                color: "#F87171",
                                "&:hover": {
                                  borderColor: "#EF4444",
                                  backgroundColor: "rgba(239, 68, 68, 0.2)",
                                  color: "#EF4444",
                                },
                              }}
                            >
                              Decline / Reassign
                            </Button>

                            <Button
                              variant="contained"
                              startIcon={<DirectionsCar />}
                              disabled={actionLoading}
                              onClick={() => handleStatusChange(upNext.id, "en_route")}
                              sx={{
                                borderRadius: "12px",
                                fontWeight: 800,
                                textTransform: "none",
                                px: 3,
                                background: "linear-gradient(135deg, #0284C7, #0D9488)",
                                boxShadow: "0 4px 14px rgba(2, 132, 199, 0.35)",
                              }}
                            >
                              Start Travel / On My Way
                            </Button>
                          </>
                        )}

                        {/* If en_route: Show Complete Job */}
                        {(upNext.status === "en_route" || upNext.status === "in_progress") && (
                          <Button
                            variant="contained"
                            color="success"
                            startIcon={<TaskAlt />}
                            disabled={actionLoading}
                            onClick={() => openCompleteDialog(upNext)}
                            sx={{
                              borderRadius: "12px",
                              fontWeight: 800,
                              textTransform: "none",
                              px: 3,
                              background: "linear-gradient(135deg, #10B981, #059669)",
                              boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                            }}
                          >
                            Mark Job Completed
                          </Button>
                        )}
                      </Stack>
                    </Box>
                  </CardContent>
                </MotionCard>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{
                    p: 4,
                    borderRadius: "20px",
                    textAlign: "center",
                    backgroundColor: "rgba(30, 41, 59, 0.4)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                  }}
                >
                  <TaskAlt sx={{ fontSize: 44, color: "#10B981", mb: 1 }} />
                  <Typography variant="h6" fontWeight={750} sx={{ color: "#F8FAFC" }}>
                    No Active Jobs Pending Action
                  </Typography>
                  <Typography variant="body2" sx={{ color: "#94A3B8" }}>
                    You are caught up! Check the upcoming schedule tab below for upcoming shifts.
                  </Typography>
                </Paper>
              )}
            </Box>

            {/* TABBED SCHEDULE & WORK ORDERS */}
            <Box>
              <Tabs
                value={activeTab}
                onChange={(_, val) => setActiveTab(val)}
                sx={{
                  borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                  "& .MuiTab-root": {
                    color: "#94A3B8",
                    fontWeight: 750,
                    textTransform: "none",
                    fontSize: "0.92rem",
                    "&.Mui-selected": { color: "#38BDF8" },
                  },
                  "& .MuiTabs-indicator": { backgroundColor: "#38BDF8", height: 3 },
                }}
              >
                <Tab label={`Today's Jobs (${bookings.today.length})`} />
                <Tab label={`Upcoming (${bookings.upcoming.length})`} />
                <Tab label={`Completed History (${bookings.completed.length})`} />
                <Tab label={`My Shift Blocks (${schedule.length})`} />
              </Tabs>

              {/* Tab 0: Today's Jobs */}
              {activeTab === 0 && (
                <Box sx={{ mt: 2.5 }}>
                  {bookings.today.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "#94A3B8", py: 3, textAlign: "center" }}>
                      No more appointments scheduled for today.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {bookings.today.map((item) => (
                        <BookingRow
                          key={item.id}
                          item={item}
                          onAccept={() => handleStatusChange(item.id, "accepted")}
                          onDecline={() => openDeclineDialog(item)}
                          onEnRoute={() => handleStatusChange(item.id, "en_route")}
                          onComplete={() => openCompleteDialog(item)}
                          actionLoading={actionLoading}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {/* Tab 1: Upcoming Bookings */}
              {activeTab === 1 && (
                <Box sx={{ mt: 2.5 }}>
                  {bookings.upcoming.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "#94A3B8", py: 3, textAlign: "center" }}>
                      No future appointments allocated yet.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {bookings.upcoming.map((item) => (
                        <BookingRow
                          key={item.id}
                          item={item}
                          onAccept={() => handleStatusChange(item.id, "accepted")}
                          onDecline={() => openDeclineDialog(item)}
                          onEnRoute={() => handleStatusChange(item.id, "en_route")}
                          onComplete={() => openCompleteDialog(item)}
                          actionLoading={actionLoading}
                        />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {/* Tab 2: Completed History */}
              {activeTab === 2 && (
                <Box sx={{ mt: 2.5 }}>
                  {bookings.completed.length === 0 ? (
                    <Typography variant="body2" sx={{ color: "#94A3B8", py: 3, textAlign: "center" }}>
                      No completed repairs recorded in this period.
                    </Typography>
                  ) : (
                    <Stack spacing={2}>
                      {bookings.completed.map((item) => (
                        <BookingRow key={item.id} item={item} isCompleted />
                      ))}
                    </Stack>
                  )}
                </Box>
              )}

              {/* Tab 3: Shift Blocks */}
              {activeTab === 3 && (
                <Box sx={{ mt: 2.5 }}>
                  <Grid container spacing={2}>
                    {schedule.map((slot) => (
                      <Grid key={slot.id} size={{ xs: 12, sm: 6, md: 4 }}>
                        <Card
                          sx={{
                            borderRadius: "16px",
                            backgroundColor: "rgba(30, 41, 59, 0.6)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            p: 2,
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 36,
                                height: 36,
                                borderRadius: "10px",
                                backgroundColor: slot.start_time === "09:00" ? "rgba(245, 158, 11, 0.15)" : "rgba(37, 99, 235, 0.15)",
                                color: slot.start_time === "09:00" ? "#F59E0B" : "#60A5FA",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              <CalendarMonth fontSize="small" />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={750} sx={{ color: "#F8FAFC" }}>
                                {formatDate(slot.date)}
                              </Typography>
                              <Typography variant="caption" sx={{ color: "#94A3B8" }}>
                                {slot.slot_name} ({slot.start_time} – {slot.end_time})
                              </Typography>
                            </Box>
                          </Stack>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </Box>
          </Stack>
        )}
      </Container>

      {/* DECLINE JOB MODAL */}
      <Dialog
        open={declineModal.open}
        onClose={() => setDeclineModal({ open: false, booking: null, reason: "", customNote: "" })}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              backgroundColor: "#1E293B !important",
              color: "#F8FAFC !important",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              backgroundImage: "none !important",
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            backgroundColor: "#1E293B !important",
            color: "#F8FAFC !important",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            backgroundImage: "none !important",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#F87171", fontSize: "1.25rem" }}>
          Decline Booking #{declineModal.booking?.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#CBD5E1", mb: 2.5 }}>
            Please select the reason for declining this booking. The operations dispatcher will be immediately alerted so the customer can be reallocated to another qualified specialist.
          </Typography>

          <FormControl fullWidth sx={{ mb: 2.5 }}>
            <InputLabel
              id="decline-reason-select-label"
              sx={{
                color: "#94A3B8",
                "&.Mui-focused": { color: "#38BDF8" },
              }}
            >
              Reason Code
            </InputLabel>
            <Select
              labelId="decline-reason-select-label"
              id="decline-reason-select"
              value={declineModal.reason}
              label="Reason Code"
              onChange={(e) => setDeclineModal((prev) => ({ ...prev, reason: e.target.value }))}
              MenuProps={{
                slotProps: {
                  paper: {
                    sx: {
                      backgroundColor: "#1E293B !important",
                      color: "#F8FAFC",
                      borderRadius: "14px",
                      border: "1px solid rgba(255, 255, 255, 0.15)",
                      boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
                      backgroundImage: "none",
                    },
                  },
                },
                PaperProps: {
                  sx: {
                    backgroundColor: "#1E293B !important",
                    color: "#F8FAFC",
                    borderRadius: "14px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
                    backgroundImage: "none",
                  },
                },
              }}
              sx={{
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#F8FAFC",
                "& .MuiSelect-select": {
                  color: "#F8FAFC",
                  fontWeight: 650,
                  fontSize: "0.9rem",
                },
                "& .MuiSvgIcon-root": { color: "#94A3B8" },
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.35)" },
                "&.Mui-focused fieldset": { borderColor: "#38BDF8" },
              }}
            >
              <MenuItem value="Previous emergency job overrun / running late" sx={{ color: "#F8FAFC" }}>
                Previous emergency job overrun / running late
              </MenuItem>
              <MenuItem value="Missing specialized plumbing parts / equipment" sx={{ color: "#F8FAFC" }}>
                Missing specialized plumbing parts / equipment
              </MenuItem>
              <MenuItem value="Outside service territory / excessive travel time" sx={{ color: "#F8FAFC" }}>
                Outside service territory / excessive travel time
              </MenuItem>
              <MenuItem value="Vehicle breakdown / transit mechanical issue" sx={{ color: "#F8FAFC" }}>
                Vehicle breakdown / transit mechanical issue
              </MenuItem>
              <MenuItem value="Personal emergency / illness" sx={{ color: "#F8FAFC" }}>
                Personal emergency / illness
              </MenuItem>
              <MenuItem value="Other operational constraint" sx={{ color: "#F8FAFC" }}>
                Other operational constraint
              </MenuItem>
            </Select>
          </FormControl>

          <TextField
            fullWidth
            multiline
            rows={2}
            label="Additional Notes for Dispatcher (Optional)"
            value={declineModal.customNote}
            onChange={(e) => setDeclineModal((prev) => ({ ...prev, customNote: e.target.value }))}
            placeholder="e.g. Expected finish on Current St site is 11:30 AM"
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#F8FAFC",
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.35)" },
                "&.Mui-focused fieldset": { borderColor: "#38BDF8" },
              },
              "& .MuiInputLabel-root": {
                color: "#94A3B8",
                "&.Mui-focused": { color: "#38BDF8" },
              },
              "& .MuiOutlinedInput-input": {
                color: "#F8FAFC",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setDeclineModal({ open: false, booking: null, reason: "", customNote: "" })}
            sx={{ color: "#94A3B8", textTransform: "none", fontWeight: 700, "&:hover": { color: "#F8FAFC" } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="error"
            onClick={submitDecline}
            sx={{ borderRadius: "12px", fontWeight: 750, px: 2.5, textTransform: "none" }}
          >
            Confirm & Alert Dispatch
          </Button>
        </DialogActions>
      </Dialog>

      {/* COMPLETE JOB MODAL */}
      <Dialog
        open={completeModal.open}
        onClose={() => setCompleteModal({ open: false, booking: null, notes: "" })}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              backgroundColor: "#1E293B !important",
              color: "#F8FAFC !important",
              border: "1px solid rgba(16, 185, 129, 0.4)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
              backgroundImage: "none !important",
            },
          },
        }}
        PaperProps={{
          sx: {
            borderRadius: "20px",
            backgroundColor: "#1E293B !important",
            color: "#F8FAFC !important",
            border: "1px solid rgba(16, 185, 129, 0.4)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8)",
            backgroundImage: "none !important",
          },
        }}
      >
        <DialogTitle sx={{ fontWeight: 800, color: "#34D399", fontSize: "1.25rem" }}>
          Complete Booking #{completeModal.booking?.id}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ color: "#CBD5E1", mb: 2.5 }}>
            Record on-site resolution notes before closing the work order manifest.
          </Typography>

          <TextField
            fullWidth
            multiline
            rows={3}
            label="Resolution & Service Notes"
            value={completeModal.notes}
            onChange={(e) => setCompleteModal((prev) => ({ ...prev, notes: e.target.value }))}
            sx={{
              "& .MuiOutlinedInput-root": {
                borderRadius: "12px",
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                color: "#F8FAFC",
                "& fieldset": { borderColor: "rgba(255, 255, 255, 0.2)" },
                "&:hover fieldset": { borderColor: "rgba(255, 255, 255, 0.35)" },
                "&.Mui-focused fieldset": { borderColor: "#10B981" },
              },
              "& .MuiInputLabel-root": {
                color: "#94A3B8",
                "&.Mui-focused": { color: "#10B981" },
              },
              "& .MuiOutlinedInput-input": {
                color: "#F8FAFC",
              },
            }}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button
            onClick={() => setCompleteModal({ open: false, booking: null, notes: "" })}
            sx={{ color: "#94A3B8", textTransform: "none", fontWeight: 700, "&:hover": { color: "#F8FAFC" } }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={submitComplete}
            sx={{ borderRadius: "12px", fontWeight: 750, px: 3, backgroundColor: "#059669", textTransform: "none" }}
          >
            Finalize Work Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action Toast Snackbar */}
      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={toast.severity}
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          sx={{ borderRadius: "12px", fontWeight: 650 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
      </Box>
    </ThemeProvider>
  );
}

// Sub-component for individual booking rows
function BookingRow({ item, onAccept, onDecline, onEnRoute, onComplete, isCompleted, actionLoading }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2.25,
        borderRadius: "18px",
        backgroundColor: "rgba(30, 41, 59, 0.6)",
        border: "1px solid rgba(255, 255, 255, 0.07)",
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", md: "center" },
        gap: 2,
      }}
    >
      {/* Details */}
      <Box sx={{ flexGrow: 1 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 0.75 }}>
          <Typography variant="caption" sx={{ color: "#38BDF8", fontWeight: 800 }}>
            {formatDate(item.appointment_date)} • {formatTime(item.start_time)} – {formatTime(item.end_time)}
          </Typography>
          <StatusChip status={item.status} size="small" />
          {item.quote_estimate && (
            <Chip
              label={`$${item.quote_estimate.estimated_min}–$${item.quote_estimate.estimated_max} AUD`}
              size="small"
              sx={{
                height: 20,
                fontSize: "0.68rem",
                fontWeight: 750,
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#34D399",
              }}
            />
          )}
        </Stack>

        <Typography variant="subtitle1" fontWeight={800} sx={{ color: "#F8FAFC" }}>
          {item.customer_name} • <Typography component="span" variant="body2" sx={{ color: "#F59E0B", fontWeight: 700 }}>{item.service}</Typography>
        </Typography>

        <Typography variant="body2" sx={{ color: "#94A3B8", mb: 0.5 }}>
          {item.customer_address}
        </Typography>

        <Typography variant="caption" sx={{ color: "#64748B", fontStyle: "italic", display: "block" }}>
          "{item.issue}"
        </Typography>

        {item.technician_notes && (
          <Box sx={{ mt: 1, p: 1, borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.18)" }}>
            <Typography variant="caption" sx={{ color: "#34D399", fontWeight: 700 }}>
              Resolution Notes: {item.technician_notes}
            </Typography>
          </Box>
        )}

        {item.declined_reason && (
          <Box sx={{ mt: 1, p: 1, borderRadius: "8px", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.18)" }}>
            <Typography variant="caption" sx={{ color: "#F87171", fontWeight: 700 }}>
              Decline Reason: {item.declined_reason}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Action buttons */}
      {!isCompleted && (
        <Stack direction="row" spacing={1} sx={{ alignSelf: { xs: "stretch", md: "auto" } }}>
          {(() => {
            const hasPhone = Boolean(
              item.customer_phone &&
              item.customer_phone !== "N/A" &&
              item.customer_phone.trim() !== ""
            );

            return (
              <Button
                size="small"
                variant="outlined"
                disabled={!hasPhone}
                startIcon={
                  <Phone
                    sx={{
                      fontSize: "14px !important",
                      color: hasPhone ? "#38BDF8" : "rgba(255, 255, 255, 0.35)",
                    }}
                  />
                }
                onClick={() => {
                  if (hasPhone) {
                    window.open(`tel:${item.customer_phone}`, "_self");
                  }
                }}
                sx={{
                  borderRadius: "10px",
                  borderColor: hasPhone
                    ? "rgba(56, 189, 248, 0.35)"
                    : "rgba(255, 255, 255, 0.12)",
                  backgroundColor: hasPhone
                    ? "rgba(56, 189, 248, 0.08)"
                    : "rgba(255, 255, 255, 0.03)",
                  color: hasPhone ? "#F8FAFC" : "rgba(255, 255, 255, 0.4)",
                  fontSize: "0.78rem",
                  fontWeight: 700,
                  textTransform: "none",
                  transition: "all 0.18s ease-in-out",
                  "&:hover": {
                    borderColor: "#38BDF8",
                    backgroundColor: "rgba(56, 189, 248, 0.18)",
                    color: "#FFFFFF",
                  },
                  "&.Mui-disabled": {
                    color: "rgba(255, 255, 255, 0.35)",
                    borderColor: "rgba(255, 255, 255, 0.08)",
                    backgroundColor: "transparent",
                  },
                }}
              >
                Call
              </Button>
            );
          })()}

          {(item.status === "confirmed" || item.status === "received" || item.status === "scheduled") && (
            <>
              <Button
                size="small"
                variant="outlined"
                color="error"
                disabled={actionLoading}
                onClick={onDecline}
                sx={{
                  borderRadius: "10px",
                  fontSize: "0.75rem",
                  fontWeight: 700,
                  textTransform: "none",
                  backgroundColor: "rgba(239, 68, 68, 0.1)",
                  borderColor: "rgba(239, 68, 68, 0.35)",
                  color: "#F87171",
                  "&:hover": {
                    borderColor: "#EF4444",
                    backgroundColor: "rgba(239, 68, 68, 0.2)",
                    color: "#EF4444",
                  },
                }}
              >
                Decline
              </Button>
              <Button
                size="small"
                variant="contained"
                color="success"
                disabled={actionLoading}
                onClick={onAccept}
                sx={{ borderRadius: "10px", fontSize: "0.75rem", fontWeight: 750, textTransform: "none", backgroundColor: "#059669" }}
              >
                Accept
              </Button>
            </>
          )}

          {item.status === "accepted" && (
            <Button
              size="small"
              variant="contained"
              startIcon={<DirectionsCar sx={{ fontSize: "14px !important" }} />}
              disabled={actionLoading}
              onClick={onEnRoute}
              sx={{ borderRadius: "10px", fontSize: "0.75rem", fontWeight: 750, textTransform: "none", backgroundColor: "#0284C7" }}
            >
              En Route
            </Button>
          )}

          {(item.status === "en_route" || item.status === "in_progress") && (
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<TaskAlt sx={{ fontSize: "14px !important" }} />}
              disabled={actionLoading}
              onClick={onComplete}
              sx={{ borderRadius: "10px", fontSize: "0.75rem", fontWeight: 750, textTransform: "none", backgroundColor: "#059669" }}
            >
              Complete
            </Button>
          )}
        </Stack>
      )}
    </Paper>
  );
}

export default TechnicianPortal;
