import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Assignment,
  CalendarMonth,
  CheckCircle,
  Engineering,
  Error,
  FlashOn,
  HourglassEmpty,
  OpenInNew,
  Refresh,
  SmartToy,
  WarningAmber,
  ArrowForward,
  AccessTime,
  Check,
} from "@mui/icons-material";
import { useNavigate } from "react-router-dom";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import useApi from "../hooks/useApi";

import {
  getDashboardSummary,
  getDashboardNotifications,
  updateNotificationStatus,
  getRequests,
  getAppointments,
  getTechnicians,
} from "../services/api";

function Overview() {
  const navigate = useNavigate();

  const {
    data: summaryData,
    loading: summaryLoading,
    error: summaryError,
    execute: loadSummary,
  } = useApi(getDashboardSummary);

  const {
    data: notificationData,
    loading: notificationsLoading,
    error: notificationsError,
    execute: loadNotifications,
  } = useApi(getDashboardNotifications);

  const [notifications, setNotifications] = useState([]);

  const {
    data: requestData,
    loading: requestsLoading,
    error: requestsError,
    execute: loadRequests,
  } = useApi(getRequests);

  const {
    data: appointmentData,
    loading: appointmentsLoading,
    error: appointmentsError,
    execute: loadAppointments,
  } = useApi(getAppointments);

  const {
    data: technicianData,
    loading: techniciansLoading,
    error: techniciansError,
    execute: loadTechnicians,
  } = useApi(getTechnicians);

  const summary = summaryData;
  const requests = requestData || [];
  const appointments = appointmentData || [];
  const technicians = technicianData || [];

  useEffect(() => {
    setNotifications(notificationData || []);
  }, [notificationData]);

  const loading =
    summaryLoading ||
    notificationsLoading ||
    requestsLoading ||
    appointmentsLoading ||
    techniciansLoading;

  const error =
    summaryError ||
    notificationsError ||
    requestsError ||
    appointmentsError ||
    techniciansError;

  async function loadOverview() {
    await Promise.allSettled([
      loadSummary(),
      loadNotifications(),
      loadRequests(),
      loadAppointments(),
      loadTechnicians(),
    ]);
  }

  useEffect(() => {
    loadOverview();
  }, [
    loadSummary,
    loadNotifications,
    loadRequests,
    loadAppointments,
    loadTechnicians,
  ]);

  async function handleAcknowledgeNotification(notificationId) {
    try {
      const updated = await updateNotificationStatus(
        notificationId,
        "acknowledged"
      );
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === updated.id ? updated : notification
        )
      );
    } catch (err) {
      console.error("Failed to acknowledge notification:", err);
    }
  }

  const recentRequests = useMemo(() => {
    return requests.slice(0, 6);
  }, [requests]);

  const highPriorityRequests = useMemo(() => {
    const actionableStatuses = new Set([
      "received",
      "awaiting_information",
      "awaiting_appointment_selection",
      "no_availability",
    ]);

    return requests.filter(
      (request) =>
        request.urgency === "high" && actionableStatuses.has(request.status)
    );
  }, [requests]);

  const highPriorityNotifications = useMemo(() => {
    return notifications.filter(
      (notification) =>
        notification.notification_type === "high_priority_request" &&
        notification.status !== "acknowledged"
    );
  }, [notifications]);

  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const first = `${a.appointment_date} ${a.start_time}`;
        const second = `${b.appointment_date} ${b.start_time}`;
        return first.localeCompare(second);
      })
      .slice(0, 6);
  }, [appointments]);

  if (
    loading &&
    !summary &&
    notifications.length === 0 &&
    requests.length === 0 &&
    appointments.length === 0 &&
    technicians.length === 0
  ) {
    return <LoadingState />;
  }

  // Calculate fleet capacity metrics
  const totalFleetSlots = technicians.reduce((acc, t) => acc + (t.appointments?.length || 0), 0);

  return (
    <Box>
      <PageHeader
        title="Operations Command Center"
        description="Real-time request dispatch, emergency alerts, and technician fleet status."
        badge={
          <Chip
            size="small"
            label="System Online"
            sx={{
              backgroundColor: "rgba(16, 185, 129, 0.1)",
              color: "#047857",
              border: "1px solid rgba(16, 185, 129, 0.25)",
              fontWeight: 700,
              fontSize: "0.72rem",
            }}
          />
        }
        action={
          <Stack direction="row" spacing={1.5}>
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={loadOverview}
              sx={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
            >
              Refresh Data
            </Button>
            <Button
              variant="contained"
              size="small"
              startIcon={<SmartToy />}
              onClick={() => navigate("/agent")}
              sx={{ borderRadius: "10px" }}
            >
              Ask AI Copilot
            </Button>
          </Stack>
        }
      />

      {error && <ErrorState message={error} onRetry={loadOverview} />}

      {/* Emergency High-Priority Triage Banner */}
      {highPriorityRequests.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            mb: 3.5,
            p: 3,
            borderRadius: "20px",
            borderColor: "rgba(239, 68, 68, 0.3)",
            backgroundColor: "rgba(254, 242, 242, 0.8)",
            boxShadow: "0 10px 25px -5px rgba(239, 68, 68, 0.12)",
          }}
        >
          <Stack spacing={2}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1.5 }}>
              <Stack direction="row" spacing={1.5} alignItems="center">
                <Box
                  sx={{
                    width: 36,
                    height: 36,
                    borderRadius: "10px",
                    backgroundColor: "#EF4444",
                    color: "#FFFFFF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 4px 12px rgba(239, 68, 68, 0.3)",
                  }}
                >
                  <FlashOn sx={{ fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#991B1B" sx={{ lineHeight: 1.1 }}>
                    Emergency Triage Required
                  </Typography>
                  <Typography variant="body2" color="#B91C1C">
                    {highPriorityRequests.length}{" "}
                    {highPriorityRequests.length === 1 ? "high-priority emergency request needs" : "high-priority emergency requests need"}{" "}
                    immediate dispatch.
                  </Typography>
                </Box>
              </Stack>

              <Button
                variant="contained"
                color="error"
                size="small"
                endIcon={<ArrowForward />}
                onClick={() => navigate("/requests?filter=high")}
                sx={{
                  borderRadius: "10px",
                  fontWeight: 700,
                  backgroundColor: "#DC2626",
                  "&:hover": { backgroundColor: "#B91C1C" },
                }}
              >
                Triage Emergency Queue
              </Button>
            </Box>

            {/* Quick List of top urgent request preview */}
            <Stack spacing={1} sx={{ mt: 1 }}>
              {highPriorityRequests.slice(0, 2).map((item) => (
                <Box
                  key={item.id}
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    backgroundColor: "#FFFFFF",
                    border: "1px solid rgba(239, 68, 68, 0.2)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: 1.5,
                  }}
                >
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Box component="span" className="pulse-dot-red" />
                      <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                        {item.issue || "Urgent Plumbing Incident"}
                      </Typography>
                      <Chip
                        label={`Req #${item.id}`}
                        size="small"
                        sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }}
                      />
                    </Stack>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                      {item.message}
                    </Typography>
                  </Box>

                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <StatusChip status={item.status} />
                    <Button
                      size="small"
                      variant="outlined"
                      color="error"
                      onClick={() => navigate(`/requests?id=${item.id}`)}
                      sx={{ borderRadius: "8px", py: 0.3 }}
                    >
                      Inspect & Dispatch
                    </Button>
                  </Stack>
                </Box>
              ))}
            </Stack>
          </Stack>
        </Paper>
      )}

      {/* KPI Command Metrics Row */}
      <Grid container spacing={2.5} sx={{ mb: 3.5 }}>
        {/* Total Requests */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card sx={{ height: "100%", p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Total Requests
                </Typography>
                <Box sx={{ p: 1, borderRadius: "10px", backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}>
                  <Assignment fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight={850} color="#0F172A">
                {summary?.total_requests ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Lifetime service inquiries
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* High Urgency Alerts */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card sx={{ height: "100%", p: 0.5, borderColor: highPriorityRequests.length > 0 ? "rgba(239, 68, 68, 0.3)" : "#E2E8F0" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Emergency Triage
                </Typography>
                <Box sx={{ p: 1, borderRadius: "10px", backgroundColor: "rgba(239, 68, 68, 0.08)", color: "#EF4444" }}>
                  <FlashOn fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight={850} color={highPriorityRequests.length > 0 ? "#EF4444" : "#0F172A"}>
                {highPriorityRequests.length}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Require priority response
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Awaiting Information */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card sx={{ height: "100%", p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Awaiting Details
                </Typography>
                <Box sx={{ p: 1, borderRadius: "10px", backgroundColor: "rgba(245, 158, 11, 0.08)", color: "#F59E0B" }}>
                  <HourglassEmpty fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight={850} color="#0F172A">
                {summary?.awaiting_information ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                AI asking follow-up context
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Ready to Book */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card sx={{ height: "100%", p: 0.5 }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Slot Selection
                </Typography>
                <Box sx={{ p: 1, borderRadius: "10px", backgroundColor: "rgba(13, 148, 136, 0.08)", color: "#0D9488" }}>
                  <CalendarMonth fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight={850} color="#0F172A">
                {summary?.awaiting_appointment_selection ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Customer reviewing windows
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        {/* Confirmed Bookings */}
        <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2.4 }}>
          <Card sx={{ height: "100%", p: 0.5, borderColor: "rgba(16, 185, 129, 0.3)" }}>
            <CardContent>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
                <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  Confirmed Jobs
                </Typography>
                <Box sx={{ p: 1, borderRadius: "10px", backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#10B981" }}>
                  <CheckCircle fontSize="small" />
                </Box>
              </Box>
              <Typography variant="h3" fontWeight={850} color="#059669">
                {summary?.confirmed ?? 0}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                Dispatched to technicians
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fleet Live Capacity Row */}
      <Paper variant="outlined" sx={{ p: 3, mb: 3.5, borderRadius: "20px" }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2.5 }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#0F172A" sx={{ letterSpacing: "-0.02em" }}>
              Technician Fleet Capacity
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active dispatch load across certified field technicians
            </Typography>
          </Box>
          <Button
            size="small"
            variant="text"
            endIcon={<ArrowForward />}
            onClick={() => navigate("/technicians")}
            sx={{ fontWeight: 700 }}
          >
            Manage Fleet
          </Button>
        </Box>

        <Grid container spacing={2}>
          {technicians.map((tech) => {
            const bookedCount = tech.appointments?.length || 0;
            const maxCapacity = Math.max(5, bookedCount);
            const percentage = Math.min(Math.round((bookedCount / maxCapacity) * 100), 100);
            const isFull = percentage >= 80;

            return (
              <Grid key={tech.id} size={{ xs: 12, sm: 6, md: 3 }}>
                <Box
                  sx={{
                    p: 2,
                    borderRadius: "14px",
                    border: "1px solid #E2E8F0",
                    backgroundColor: "#F8FAFC",
                    transition: "all 0.15s ease",
                    "&:hover": {
                      borderColor: "#CBD5E1",
                      backgroundColor: "#FFFFFF",
                      boxShadow: "0 4px 12px rgba(15, 23, 42, 0.05)",
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 1.5 }}>
                    <Box
                      sx={{
                        width: 38,
                        height: 38,
                        borderRadius: "12px",
                        background: "linear-gradient(135deg, #2563EB, #0D9488)",
                        color: "#FFFFFF",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                      }}
                    >
                      {tech.name.charAt(0)}
                    </Box>
                    <Box sx={{ flexGrow: 1 }}>
                      <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                        {tech.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {tech.services?.length || 0} Specialties
                      </Typography>
                    </Box>
                    <Chip
                      label={isFull ? "Busy" : "Available"}
                      size="small"
                      sx={{
                        height: 20,
                        fontSize: "0.68rem",
                        fontWeight: 750,
                        backgroundColor: isFull ? "rgba(245, 158, 11, 0.1)" : "rgba(16, 185, 129, 0.1)",
                        color: isFull ? "#B45309" : "#047857",
                      }}
                    />
                  </Stack>

                  {/* Capacity Bar */}
                  <Box sx={{ mb: 1 }}>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 1,
                        mb: 0.5,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary" fontWeight={600}>
                        Workload
                      </Typography>
                      <Typography variant="caption" fontWeight={750} color="#0F172A">
                        {bookedCount} / {maxCapacity} ({percentage}%)
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 6,
                        borderRadius: 3,
                        backgroundColor: "#E2E8F0",
                        "& .MuiLinearProgress-bar": {
                          borderRadius: 3,
                          backgroundColor: isFull ? "#F59E0B" : "#2563EB",
                        },
                      }}
                    />
                  </Box>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Paper>

      {/* Operations Grid: Recent Requests & Upcoming Appointments */}
      <Grid container spacing={3.5}>
        {/* Left: Recent Service Requests Feed */}
        <Grid size={{ xs: 12, lg: 7 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: "20px", height: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0F172A">
                  Recent Service Requests
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Latest customer submissions analyzed by FlowFix AI
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                endIcon={<ArrowForward />}
                onClick={() => navigate("/requests")}
                sx={{ fontWeight: 700 }}
              >
                View All
              </Button>
            </Box>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Request</TableCell>
                    <TableCell>Issue / Service</TableCell>
                    <TableCell>Urgency</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentRequests.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                        <Typography variant="body2" color="text.secondary">
                          No requests recorded yet.
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentRequests.map((req) => (
                      <TableRow
                        key={req.id}
                        hover
                        onClick={() => navigate(`/requests?id=${req.id}`)}
                        sx={{ cursor: "pointer" }}
                      >
                        <TableCell>
                          <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                            #{req.id}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {req.customer_id ? `Cust #${req.customer_id}` : "Unlinked"}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Typography variant="body2" fontWeight={650} color="#0F172A">
                            {req.service || req.issue || "General Plumbing"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 220, display: "block", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                            {req.message}
                          </Typography>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={req.urgency || "standard"}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.68rem",
                              fontWeight: 750,
                              textTransform: "uppercase",
                              backgroundColor: req.urgency === "high" ? "rgba(239, 68, 68, 0.12)" : "rgba(100, 116, 139, 0.08)",
                              color: req.urgency === "high" ? "#EF4444" : "#475569",
                            }}
                          />
                        </TableCell>

                        <TableCell>
                          <StatusChip status={req.status} size="small" />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Right: Upcoming Dispatch Schedule */}
        <Grid size={{ xs: 12, lg: 5 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: "20px", height: "100%" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0F172A">
                  Upcoming Appointments
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Scheduled technician dispatches
                </Typography>
              </Box>
              <Button
                size="small"
                variant="text"
                endIcon={<ArrowForward />}
                onClick={() => navigate("/appointments")}
                sx={{ fontWeight: 700 }}
              >
                Schedule
              </Button>
            </Box>

            <Stack spacing={1.5}>
              {upcomingAppointments.length === 0 ? (
                <Box sx={{ p: 4, textAlign: "center" }}>
                  <Typography variant="body2" color="text.secondary">
                    No upcoming appointments scheduled.
                  </Typography>
                </Box>
              ) : (
                upcomingAppointments.map((app) => (
                  <Box
                    key={app.id}
                    sx={{
                      p: 2,
                      borderRadius: "14px",
                      border: "1px solid #E2E8F0",
                      backgroundColor: "#F8FAFC",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: "#FFFFFF",
                        borderColor: "#CBD5E1",
                        boxShadow: "0 4px 12px rgba(15, 23, 42, 0.04)",
                      },
                    }}
                  >
                    <Stack direction="row" spacing={1.5} alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: "12px",
                          backgroundColor: "rgba(37, 99, 235, 0.08)",
                          color: "#2563EB",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                        }}
                      >
                        <CalendarMonth fontSize="small" />
                      </Box>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                          {app.appointment_date}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {app.start_time} – {app.end_time} • {app.technician?.name || "Assigned Plumber"}
                        </Typography>
                      </Box>
                    </Stack>

                    <StatusChip status={app.status || "confirmed"} size="small" />
                  </Box>
                ))
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Overview;