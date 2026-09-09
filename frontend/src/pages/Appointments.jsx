import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  ButtonGroup,
  Card,
  CardContent,
  Chip,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  CalendarMonth,
  Close,
  Engineering,
  LocationOn,
  Person,
  Refresh,
  Schedule,
  Search,
  ViewAgenda,
  TableRows,
  CheckCircle,
} from "@mui/icons-material";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import useApi from "../hooks/useApi";
import { getAppointments } from "../services/api";

function formatLabel(value) {
  if (!value) return "Confirmed";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function Appointments() {
  const {
    data: appointmentData,
    loading,
    error,
    execute: loadAppointments,
  } = useApi(getAppointments);

  const appointments = appointmentData || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "table"
  const [selectedAppointment, setSelectedAppointment] = useState(null);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const technicians = useMemo(() => {
    return [
      ...new Map(
        appointments
          .filter((a) => a.technician)
          .map((a) => [a.technician.id, a.technician])
      ).values(),
    ].sort((a, b) => a.name.localeCompare(b.name));
  }, [appointments]);

  const statuses = useMemo(() => {
    return [...new Set(appointments.map((a) => a.status).filter(Boolean))].sort();
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    const term = search.trim().toLowerCase();

    return appointments
      .filter((app) => {
        const matchesStatus = statusFilter === "all" || app.status === statusFilter;
        const matchesTechnician =
          technicianFilter === "all" ||
          String(app.technician?.id) === String(technicianFilter);

        const matchesSearch =
          !term ||
          String(app.id).includes(term) ||
          String(app.service_request_id).includes(term) ||
          (app.appointment_date || "").includes(term) ||
          (app.technician?.name || "").toLowerCase().includes(term);

        return matchesStatus && matchesTechnician && matchesSearch;
      })
      .sort((a, b) => {
        const first = `${a.appointment_date} ${a.start_time}`;
        const second = `${b.appointment_date} ${b.start_time}`;
        return first.localeCompare(second);
      });
  }, [appointments, statusFilter, technicianFilter, search]);

  return (
    <Box>
      <PageHeader
        title="Dispatch & Appointments"
        description="Monitor scheduled field visits, arrival windows, and assigned technicians."
        badge={
          <Chip
            size="small"
            label={`${filteredAppointments.length} Scheduled`}
            sx={{ fontWeight: 750, backgroundColor: "rgba(13, 148, 136, 0.1)", color: "#0F766E" }}
          />
        }
        action={
          <Stack direction="row" spacing={1.5} alignItems="center">
            {/* View Mode Toggle */}
            <ButtonGroup size="small" sx={{ backgroundColor: "#FFFFFF", borderRadius: "10px" }}>
              <Button
                variant={viewMode === "grid" ? "contained" : "outlined"}
                onClick={() => setViewMode("grid")}
                startIcon={<ViewAgenda />}
                sx={{ borderRadius: "10px 0 0 10px" }}
              >
                Schedule Cards
              </Button>
              <Button
                variant={viewMode === "table" ? "contained" : "outlined"}
                onClick={() => setViewMode("table")}
                startIcon={<TableRows />}
                sx={{ borderRadius: "0 10px 10px 0" }}
              >
                Table View
              </Button>
            </ButtonGroup>

            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={loadAppointments}
              sx={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
            >
              Refresh
            </Button>
          </Stack>
        }
      />

      {error && <ErrorState message={error} onRetry={loadAppointments} />}

      {/* Filter Toolbar */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: "18px" }}>
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, md: 5 }}>
            <TextField
              fullWidth
              placeholder="Search appointments by technician, date, or request #..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="tech-filter-label">Assigned Technician</InputLabel>
              <Select
                labelId="tech-filter-label"
                label="Assigned Technician"
                value={technicianFilter}
                onChange={(e) => setTechnicianFilter(e.target.value)}
                sx={{ borderRadius: "12px" }}
              >
                <MenuItem value="all">All Technicians</MenuItem>
                {technicians.map((t) => (
                  <MenuItem key={t.id} value={String(t.id)}>
                    {t.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3.5 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Appointment Status</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Appointment Status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                sx={{ borderRadius: "12px" }}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {statuses.map((st) => (
                  <MenuItem key={st} value={st}>
                    {formatLabel(st)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Content Rendering: Grid vs Table */}
      {loading && appointments.length === 0 ? (
        <LoadingState />
      ) : filteredAppointments.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 6, textAlign: "center", borderRadius: "18px" }}>
          <EmptyState
            title="No appointments match your filter"
            description="Clear search terms or select another technician filter."
          />
        </Paper>
      ) : viewMode === "grid" ? (
        /* Schedule Cards View */
        <Grid container spacing={2.5}>
          {filteredAppointments.map((app) => (
            <Grid key={app.id} size={{ xs: 12, sm: 6, lg: 4 }}>
              <Card
                onClick={() => setSelectedAppointment(app)}
                sx={{
                  cursor: "pointer",
                  p: 1,
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  borderRadius: "18px",
                  transition: "all 0.2s ease",
                  "&:hover": {
                    borderColor: "#3B82F6",
                    boxShadow: "0 10px 25px -5px rgba(37, 99, 235, 0.12)",
                    transform: "translateY(-2px)",
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  {/* Top Bar: Date & Status */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarMonth sx={{ fontSize: 18, color: "#2563EB" }} />
                      <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                        {app.appointment_date}
                      </Typography>
                    </Stack>
                    <StatusChip status={app.status || "confirmed"} size="small" />
                  </Box>

                  {/* Arrival Window Time Box */}
                  <Box
                    sx={{
                      p: 1.5,
                      borderRadius: "12px",
                      backgroundColor: "rgba(37, 99, 235, 0.05)",
                      border: "1px solid rgba(37, 99, 235, 0.12)",
                      display: "flex",
                      alignItems: "center",
                      gap: 1.5,
                      mb: 2,
                    }}
                  >
                    <Schedule sx={{ color: "#2563EB", fontSize: 20 }} />
                    <Box>
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Service Arrival Window
                      </Typography>
                      <Typography variant="body1" fontWeight={800} color="#0F172A">
                        {app.start_time} – {app.end_time}
                      </Typography>
                    </Box>
                  </Box>

                  {/* Technician Info */}
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 36,
                        height: 36,
                        borderRadius: "10px",
                        background: "linear-gradient(135deg, #2563EB, #0D9488)",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 750,
                        fontSize: "0.85rem",
                      }}
                    >
                      {app.technician?.name?.charAt(0) || "T"}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                        {app.technician?.name || "Assigned Technician"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Technician ID #{app.technician?.id}
                      </Typography>
                    </Box>
                  </Stack>

                  <Divider sx={{ my: 1.5 }} />

                  {/* Linked Request Info */}
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="caption" color="text.secondary">
                      Linked to Request #{app.service_request_id || app.request_id || app.id}
                    </Typography>
                    <Button
                      size="small"
                      variant="text"
                      onClick={() => setSelectedAppointment(app)}
                      sx={{ fontWeight: 700, fontSize: "0.75rem", p: 0 }}
                    >
                      Inspect Details →
                    </Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        /* Table View */
        <Paper variant="outlined" sx={{ borderRadius: "18px", overflow: "hidden" }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Appt #</TableCell>
                  <TableCell>Date & Window</TableCell>
                  <TableCell>Technician</TableCell>
                  <TableCell>Request ID</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredAppointments.map((app) => (
                  <TableRow
                    key={app.id}
                    hover
                    onClick={() => setSelectedAppointment(app)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell>
                      <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                        #{app.id}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Typography variant="body2" fontWeight={750} color="#0F172A">
                        {app.appointment_date}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {app.start_time} – {app.end_time}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Box
                          sx={{
                            width: 28,
                            height: 28,
                            borderRadius: "8px",
                            backgroundColor: "rgba(37, 99, 235, 0.1)",
                            color: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 750,
                            fontSize: "0.75rem",
                          }}
                        >
                          {app.technician?.name?.charAt(0) || "T"}
                        </Box>
                        <Typography variant="body2" fontWeight={650} color="#0F172A">
                          {app.technician?.name}
                        </Typography>
                      </Stack>
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={`Req #${app.service_request_id || app.request_id || app.id}`}
                        size="small"
                        sx={{ fontWeight: 650, height: 24, fontSize: "0.75rem" }}
                      />
                    </TableCell>

                    <TableCell>
                      <StatusChip status={app.status || "confirmed"} />
                    </TableCell>

                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedAppointment(app);
                        }}
                        sx={{ minWidth: 32, px: 1.25, py: 0.4, borderRadius: "8px", fontSize: "0.75rem" }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Appointment Details Slide-Out Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedAppointment)}
        onClose={() => setSelectedAppointment(null)}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 500 },
              boxSizing: "border-box",
              borderLeft: "1px solid #E2E8F0",
              boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.2)",
            },
          },
        }}
      >
        {selectedAppointment && (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={850} color="#0F172A">
                    Appointment #{selectedAppointment.id}
                  </Typography>
                  <StatusChip status={selectedAppointment.status || "confirmed"} size="small" />
                </Stack>
                <IconButton size="small" onClick={() => setSelectedAppointment(null)}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary">
                Linked Service Request #{selectedAppointment.service_request_id || selectedAppointment.request_id || selectedAppointment.id}
              </Typography>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
              <Stack spacing={3}>
                {/* Date & Time Window */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                    Schedule Window
                  </Typography>
                  <Stack spacing={1.5}>
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <CalendarMonth sx={{ color: "#2563EB" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Date
                        </Typography>
                        <Typography variant="body1" fontWeight={750} color="#0F172A">
                          {selectedAppointment.appointment_date}
                        </Typography>
                      </Box>
                    </Stack>

                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Schedule sx={{ color: "#0D9488" }} />
                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Arrival Window
                        </Typography>
                        <Typography variant="body1" fontWeight={750} color="#0F172A">
                          {selectedAppointment.start_time} – {selectedAppointment.end_time}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Technician Profile Card */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                    Assigned Specialist
                  </Typography>
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
                        fontSize: "1.1rem",
                      }}
                    >
                      {selectedAppointment.technician?.name?.charAt(0) || "T"}
                    </Box>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={750} color="#0F172A">
                        {selectedAppointment.technician?.name || "Technician"}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Specialist ID #{selectedAppointment.technician_id} • Certified Plumber
                      </Typography>
                    </Box>
                  </Stack>
                </Paper>

                {/* Dispatch Note */}
                <Box sx={{ p: 2, borderRadius: "14px", backgroundColor: "rgba(16, 185, 129, 0.05)", border: "1px solid rgba(16, 185, 129, 0.15)" }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                    <CheckCircle sx={{ fontSize: 18, color: "#10B981" }} />
                    <Typography variant="caption" fontWeight={750} color="#047857">
                      Calendar Confirmed & Synchronized
                    </Typography>
                  </Stack>
                  <Typography variant="caption" color="text.secondary">
                    Technician has received the dispatch manifest. Work order status is synchronized with the live availability engine.
                  </Typography>
                </Box>
              </Stack>
            </Box>
          </Box>
        )}
      </Drawer>
    </Box>
  );
}

export default Appointments;