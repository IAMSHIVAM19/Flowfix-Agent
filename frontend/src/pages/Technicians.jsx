import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Grid,
  IconButton,
  LinearProgress,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  Add,
  ArrowForward,
  CalendarMonth,
  CheckCircle,
  Close,
  Engineering,
  FlashOn,
  InfoOutlined,
  LocalFireDepartment,
  Plumbing,
  Refresh,
  Roofing,
  Search,
  Security,
  Shower,
  WaterDrop,
  Wc,
  Whatshot,
} from "@mui/icons-material";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useApi from "../hooks/useApi";
import {
  getTechnicians,
  getTechnicianServices,
  createTechnician,
  getTechnicianAvailability,
} from "../services/api";

function formatLabel(value) {
  if (!value) return "";
  return value
    .replace(/_/g, " ")
    .split(" ")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const formatServiceName = formatLabel;

function getSkillIcon(skill) {
  const s = (skill || "").toLowerCase();
  if (s.includes("tap")) return <WaterDrop sx={{ fontSize: 14, color: "#2563EB" }} />;
  if (s.includes("shower")) return <Shower sx={{ fontSize: 14, color: "#0D9488" }} />;
  if (s.includes("toilet")) return <Wc sx={{ fontSize: 14, color: "#6366F1" }} />;
  if (s.includes("hot water") || s.includes("heater")) return <Whatshot sx={{ fontSize: 14, color: "#EA580C" }} />;
  if (s.includes("drain") || s.includes("sewer")) return <Plumbing sx={{ fontSize: 14, color: "#0284C7" }} />;
  if (s.includes("burst") || s.includes("broken pipe")) return <FlashOn sx={{ fontSize: 14, color: "#DC2626" }} />;
  if (s.includes("gas")) return <LocalFireDepartment sx={{ fontSize: 14, color: "#E11D48" }} />;
  if (s.includes("roof") || s.includes("gutter")) return <Roofing sx={{ fontSize: 14, color: "#7C3AED" }} />;
  if (s.includes("backflow")) return <Security sx={{ fontSize: 14, color: "#059669" }} />;
  if (s.includes("leak")) return <Search sx={{ fontSize: 14, color: "#D97706" }} />;
  return <Engineering sx={{ fontSize: 14, color: "#64748B" }} />;
}

function Technicians() {
  const {
    data: technicianData,
    loading,
    error,
    execute: loadTechnicians,
  } = useApi(getTechnicians);

  const technicians = technicianData || [];

  const [selectedTechnician, setSelectedTechnician] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availabilityError, setAvailabilityError] = useState("");

  // Add Technician dialog state
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [techName, setTechName] = useState("");
  const [selectedServices, setSelectedServices] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createError, setCreateError] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  useEffect(() => {
    async function loadServices() {
      try {
        setLoadingServices(true);
        const data = await getTechnicianServices();
        setAvailableServices(data || []);
      } catch (err) {
        console.error("Failed to load technician services", err);
      } finally {
        setLoadingServices(false);
      }
    }
    loadServices();
  }, []);

  function toggleService(serviceId) {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  }

  async function handleCreateTechnician(e) {
    if (e) e.preventDefault();
    if (!techName.trim()) {
      setCreateError("Technician name is required.");
      return;
    }
    if (selectedServices.length === 0) {
      setCreateError("Please select at least one certified specialty.");
      return;
    }

    try {
      setSubmitting(true);
      setCreateError("");
      const created = await createTechnician({
        name: techName.trim(),
        service_ids: selectedServices,
      });

      setSnackbarMessage(`Specialist "${created.name}" successfully added to the fleet.`);
      setSnackbarOpen(true);
      setAddDialogOpen(false);
      setTechName("");
      setSelectedServices([]);
      await loadTechnicians();
    } catch (err) {
      setCreateError(err.message || "Failed to add technician.");
    } finally {
      setSubmitting(false);
    }
  }

  async function openTechnician(technician) {
    try {
      setAvailabilityError("");
      setLoadingAvailability(true);
      setSelectedTechnician(technician);

      const data = await getTechnicianAvailability(technician.id);
      setAvailability(data.availability || []);
    } catch (err) {
      setAvailabilityError(err.message || "Failed to load technician availability calendar.");
      setAvailability([]);
    } finally {
      setLoadingAvailability(false);
    }
  }

  function closeDrawer() {
    setSelectedTechnician(null);
    setAvailability([]);
    setAvailabilityError("");
  }

  const totalAppointments = useMemo(() => {
    return technicians.reduce((acc, t) => acc + (t.appointments?.length || 0), 0);
  }, [technicians]);

  return (
    <Box>
      <PageHeader
        title="Technician Fleet Management"
        description="Monitor field specialists, certified capabilities, live workloads, and availability."
        badge={
          <Chip
            size="small"
            label={`${technicians.length} Active Specialists`}
            sx={{ fontWeight: 750, backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}
          />
        }
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={loadTechnicians}
              sx={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
            >
              Refresh Fleet
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<Add />}
              onClick={() => {
                setCreateError("");
                setAddDialogOpen(true);
              }}
              sx={{
                borderRadius: "10px",
                background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                fontWeight: 700,
                textTransform: "none",
                px: 2,
              }}
            >
              Add Technician
            </Button>
          </Stack>
        }
      />

      {error && <ErrorState message={error} onRetry={loadTechnicians} />}

      {/* Fleet Summary Stats Banner */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Total Field Plumbers
            </Typography>
            <Typography variant="h3" fontWeight={850} color="#0F172A" sx={{ mt: 0.5 }}>
              {technicians.length}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Licensed & background-checked
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Active Dispatched Jobs
            </Typography>
            <Typography variant="h3" fontWeight={850} color="#2563EB" sx={{ mt: 0.5 }}>
              {totalAppointments}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Confirmed on dispatch schedule
            </Typography>
          </Paper>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Fleet Availability Status
            </Typography>
            <Typography variant="h3" fontWeight={850} color="#059669" sx={{ mt: 0.5 }}>
              100%
            </Typography>
            <Typography variant="caption" color="text.secondary">
              All specialists online in system
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Technicians Grid */}
      {loading && technicians.length === 0 ? (
        <LoadingState />
      ) : (
        <Grid container spacing={3}>
          {technicians.map((tech) => {
            const bookedCount = tech.appointments?.length || 0;
            const maxCap = Math.max(5, bookedCount);
            const loadPercent = Math.min(Math.round((bookedCount / maxCap) * 100), 100);
            const isHeavy = loadPercent >= 80;

            return (
              <Grid key={tech.id} size={{ xs: 12, md: 6, lg: 4 }}>
                <Card
                  onClick={() => openTechnician(tech)}
                  sx={{
                    cursor: "pointer",
                    borderRadius: "20px",
                    p: 1,
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    transition: "all 0.2s ease",
                    "&:hover": {
                      borderColor: "#3B82F6",
                      boxShadow: "0 12px 28px -5px rgba(37, 99, 235, 0.12)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2.5 }}>
                    {/* Header */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: "14px",
                            background: "linear-gradient(135deg, #2563EB, #0D9488)",
                            color: "#FFFFFF",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 800,
                            fontSize: "1.2rem",
                            boxShadow: "0 6px 16px rgba(37, 99, 235, 0.2)",
                          }}
                        >
                          {tech.name.charAt(0)}
                        </Box>
                        <Box>
                          <Typography variant="h6" fontWeight={800} color="#0F172A">
                            {tech.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Technician ID #{tech.id} • Active
                          </Typography>
                        </Box>
                      </Stack>

                      <Chip
                        label={isHeavy ? "High Load" : "Ready"}
                        size="small"
                        sx={{
                          height: 22,
                          fontSize: "0.7rem",
                          fontWeight: 750,
                          backgroundColor: isHeavy ? "rgba(245, 158, 11, 0.12)" : "rgba(16, 185, 129, 0.12)",
                          color: isHeavy ? "#B45309" : "#047857",
                        }}
                      />
                    </Box>

                    {/* Workload Progress Bar */}
                    <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0", mb: 2 }}>
                      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.75 }}>
                        <Typography variant="caption" fontWeight={650} color="#475569">
                          Current Shift Utilization
                        </Typography>
                        <Typography variant="caption" fontWeight={800} color="#0F172A">
                          {bookedCount} / {maxCap} Jobs ({loadPercent}%)
                        </Typography>
                      </Box>
                      <LinearProgress
                        variant="determinate"
                        value={loadPercent}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#E2E8F0",
                          "& .MuiLinearProgress-bar": {
                            borderRadius: 3,
                            backgroundColor: isHeavy ? "#F59E0B" : "#2563EB",
                          },
                        }}
                      />
                    </Box>

                    {/* Certified Skills */}
                    <Box sx={{ mb: 2.5 }}>
                      <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}>
                        Certified Specialties:
                      </Typography>
                      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.75, alignItems: "center" }}>
                        {(tech.services || []).map((srv) => (
                          <Chip
                            key={srv}
                            icon={getSkillIcon(srv)}
                            label={formatLabel(srv)}
                            size="small"
                            sx={{
                              height: 24,
                              fontSize: "0.72rem",
                              fontWeight: 650,
                              backgroundColor: "#FFFFFF",
                              border: "1px solid #E2E8F0",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>

                    <Divider sx={{ my: 1.5 }} />

                    {/* Footer Button */}
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Typography variant="caption" color="text.secondary">
                        {tech.appointments?.length || 0} scheduled jobs
                      </Typography>
                      <Button
                        size="small"
                        variant="text"
                        endIcon={<ArrowForward sx={{ fontSize: "14px !important" }} />}
                        sx={{ fontWeight: 750, fontSize: "0.78rem" }}
                      >
                        Inspect Calendar
                      </Button>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Technician Availability & Dispatch Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedTechnician)}
        onClose={closeDrawer}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 540 },
              boxSizing: "border-box",
              borderLeft: "1px solid #E2E8F0",
              boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.2)",
            },
          },
        }}
      >
        {selectedTechnician && (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Header */}
            <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Box
                    sx={{
                      width: 44,
                      height: 44,
                      borderRadius: "12px",
                      background: "linear-gradient(135deg, #2563EB, #0D9488)",
                      color: "#FFFFFF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 800,
                      fontSize: "1.15rem",
                    }}
                  >
                    {selectedTechnician.name.charAt(0)}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={850} color="#0F172A">
                      {selectedTechnician.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Certified Field Specialist • ID #{selectedTechnician.id}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={closeDrawer}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            {/* Content */}
            <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
              <Stack spacing={3}>
                {availabilityError && <ErrorState message={availabilityError} />}

                {/* Working Availability Windows */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                    Configured Working Shifts
                  </Typography>

                  {loadingAvailability ? (
                    <Box sx={{ py: 3, textAlign: "center" }}>
                      <CircularProgress size={24} />
                      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                        Querying technician availability table...
                      </Typography>
                    </Box>
                  ) : availability.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No availability windows defined in calendar.
                    </Typography>
                  ) : (
                    <Stack spacing={1}>
                      {availability.map((slot, idx) => (
                        <Box
                          key={slot.id || idx}
                          sx={{
                            p: 1.75,
                            borderRadius: "12px",
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <CalendarMonth sx={{ fontSize: 18, color: "#2563EB" }} />
                            <Typography variant="body2" fontWeight={700} color="#0F172A">
                              {slot.available_date}
                            </Typography>
                          </Stack>
                          <Chip
                            label={`${slot.start_time} – ${slot.end_time}`}
                            size="small"
                            sx={{ fontWeight: 700, backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>

                {/* Booked Appointments */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                    Assigned Appointments ({selectedTechnician.appointments?.length || 0})
                  </Typography>

                  {(!selectedTechnician.appointments || selectedTechnician.appointments.length === 0) ? (
                    <Typography variant="body2" color="text.secondary">
                      No appointments assigned yet today.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {selectedTechnician.appointments.map((app) => (
                        <Box
                          key={app.id}
                          sx={{
                            p: 2,
                            borderRadius: "12px",
                            backgroundColor: "rgba(16, 185, 129, 0.04)",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                              Appt #{app.id} • Request #{app.service_request_id}
                            </Typography>
                            <StatusChip status={app.status} size="small" />
                          </Box>
                          <Typography variant="body2" color="#0F172A" fontWeight={600}>
                            {app.appointment_date} ({app.start_time} – {app.end_time})
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Add Technician Dialog */}
      <Dialog
        open={addDialogOpen}
        onClose={() => {
          if (!submitting) {
            setAddDialogOpen(false);
            setCreateError("");
          }
        }}
        maxWidth="sm"
        fullWidth
        slotProps={{
          paper: {
            sx: {
              borderRadius: "20px",
              boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
              p: 1,
            },
          },
        }}
      >
        <DialogTitle sx={{ pb: 1, pt: 2, px: 2.5 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <Box
                sx={{
                  width: 42,
                  height: 42,
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                }}
              >
                <Engineering sx={{ fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0F172A">
                  Add Field Specialist
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Register technician & configure approved dispatch skills
                </Typography>
              </Box>
            </Stack>
            <IconButton
              size="small"
              onClick={() => setAddDialogOpen(false)}
              disabled={submitting}
              sx={{ color: "text.secondary" }}
            >
              <Close fontSize="small" />
            </IconButton>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ px: 2.5, py: 1.5 }}>
          <Stack spacing={2.5}>
            {createError && (
              <Alert severity="error" sx={{ borderRadius: "12px" }}>
                {createError}
              </Alert>
            )}

            <Box>
              <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 0.75 }}>
                Technician Full Name *
              </Typography>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Liam Parker"
                value={techName}
                onChange={(e) => setTechName(e.target.value)}
                disabled={submitting}
                autoFocus
                sx={{
                  "& .MuiOutlinedInput-root": {
                    borderRadius: "12px",
                  },
                }}
              />
            </Box>

            <Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.75 }}>
                <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Certified Capabilities * ({selectedServices.length} selected)
                </Typography>
                {availableServices.length > 0 && (
                  <Button
                    size="small"
                    variant="text"
                    onClick={() => {
                      if (selectedServices.length === availableServices.length) {
                        setSelectedServices([]);
                      } else {
                        setSelectedServices(availableServices.map((s) => s.id));
                      }
                    }}
                    sx={{ fontSize: "0.72rem", py: 0, textTransform: "none", fontWeight: 700 }}
                  >
                    {selectedServices.length === availableServices.length ? "Deselect All" : "Select All"}
                  </Button>
                )}
              </Box>

              {loadingServices ? (
                <Box sx={{ py: 2, textAlign: "center" }}>
                  <CircularProgress size={20} />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Loading certified skill categories...
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={1.5}>
                  {availableServices.map((srv) => {
                    const isSelected = selectedServices.includes(srv.id);
                    return (
                      <Grid key={srv.id} size={{ xs: 12, sm: 6 }}>
                        <Box
                          onClick={() => !submitting && toggleService(srv.id)}
                          sx={{
                            p: 1.5,
                            borderRadius: "12px",
                            border: `1.5px solid ${isSelected ? "#2563EB" : "#E2E8F0"}`,
                            backgroundColor: isSelected ? "rgba(37, 99, 235, 0.05)" : "#FFFFFF",
                            cursor: submitting ? "default" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            transition: "all 0.15s ease",
                            "&:hover": {
                              borderColor: isSelected ? "#1D4ED8" : "#94A3B8",
                              backgroundColor: isSelected ? "rgba(37, 99, 235, 0.08)" : "#F8FAFC",
                            },
                          }}
                        >
                          <Stack direction="row" spacing={1.25} alignItems="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                backgroundColor: isSelected ? "rgba(37, 99, 235, 0.12)" : "#F1F5F9",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {getSkillIcon(srv.name)}
                            </Box>
                            <Typography variant="body2" fontWeight={700} color={isSelected ? "#1D4ED8" : "#1E293B"}>
                              {formatLabel(srv.name)}
                            </Typography>
                          </Stack>
                          {isSelected ? (
                            <CheckCircle sx={{ fontSize: 20, color: "#2563EB" }} />
                          ) : (
                            <Box
                              sx={{
                                width: 18,
                                height: 18,
                                borderRadius: "50%",
                                border: "1.5px solid #CBD5E1",
                              }}
                            />
                          )}
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>

            {/* Shift Provisioning Notice */}
            <Box
              sx={{
                p: 2,
                borderRadius: "12px",
                backgroundColor: "#F8FAFC",
                border: "1px solid #E2E8F0",
                display: "flex",
                gap: 1.5,
                alignItems: "flex-start",
              }}
            >
              <InfoOutlined sx={{ color: "#2563EB", fontSize: 20, mt: 0.2 }} />
              <Box>
                <Typography variant="caption" fontWeight={750} color="#0F172A" sx={{ display: "block" }}>
                  Automated Shift Availability Provisioning
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.4 }}>
                  Upon registration, a standard rolling 35-day dispatch shift (Morning 09:00–12:00 & Afternoon 13:00–17:00) is instantly provisioned so this technician is immediately assignable in the booking system.
                </Typography>
              </Box>
            </Box>
          </Stack>
        </DialogContent>

        <DialogActions sx={{ px: 2.5, pb: 2, pt: 1, justifyContent: "flex-end", gap: 1 }}>
          <Button
            variant="outlined"
            onClick={() => setAddDialogOpen(false)}
            disabled={submitting}
            sx={{ borderRadius: "10px", borderColor: "#E2E8F0", color: "#64748B" }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCreateTechnician}
            disabled={submitting || !techName.trim() || selectedServices.length === 0}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Add />}
            sx={{
              borderRadius: "10px",
              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
              fontWeight: 700,
              textTransform: "none",
              px: 2.5,
            }}
          >
            {submitting ? "Adding..." : "Add Technician"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Feedback Toast */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4500}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          variant="filled"
          sx={{ borderRadius: "10px", fontWeight: 650, boxShadow: "0 10px 25px -5px rgba(16, 185, 129, 0.3)" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}

export default Technicians;