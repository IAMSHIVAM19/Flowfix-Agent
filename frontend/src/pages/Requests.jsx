import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
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
  Close,
  ContentCopy,
  FlashOn,
  LocationOn,
  Person,
  Phone,
  Refresh,
  Search,
  SmartToy,
  WaterDrop,
  Shower,
  Wc,
  ArrowForward,
  CheckCircle,
  CalendarMonth,
  EditCalendar,
  EventAvailable,
  Schedule,
  Engineering,
  Whatshot,
  Plumbing,
  LocalFireDepartment,
  Roofing,
  Security,
  Cancel,
} from "@mui/icons-material";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import MarkdownMessage from "../components/MarkdownMessage";
import useApi from "../hooks/useApi";
import {
  getCustomer,
  getRequest,
  getRequests,
  getTechnicians,
  getRequestAppointmentOptions,
  adminBookAppointment,
  runAgentOperation,
} from "../services/api";

const ROWS_PER_PAGE = 10;

function formatLabel(value) {
  if (!value) return "General";
  return value
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function getServiceIcon(serviceName) {
  const name = (serviceName || "").toLowerCase();
  if (name.includes("tap")) return <WaterDrop sx={{ fontSize: 16, color: "#2563EB" }} />;
  if (name.includes("shower")) return <Shower sx={{ fontSize: 16, color: "#0D9488" }} />;
  if (name.includes("toilet")) return <Wc sx={{ fontSize: 16, color: "#6366F1" }} />;
  if (name.includes("hot water") || name.includes("heater")) return <Whatshot sx={{ fontSize: 16, color: "#EA580C" }} />;
  if (name.includes("drain") || name.includes("sewer")) return <Plumbing sx={{ fontSize: 16, color: "#0284C7" }} />;
  if (name.includes("burst") || name.includes("broken pipe")) return <FlashOn sx={{ fontSize: 16, color: "#DC2626" }} />;
  if (name.includes("gas")) return <LocalFireDepartment sx={{ fontSize: 16, color: "#E11D48" }} />;
  if (name.includes("roof") || name.includes("gutter")) return <Roofing sx={{ fontSize: 16, color: "#7C3AED" }} />;
  if (name.includes("backflow")) return <Security sx={{ fontSize: 16, color: "#059669" }} />;
  if (name.includes("leak")) return <Search sx={{ fontSize: 16, color: "#D97706" }} />;
  return <Engineering sx={{ fontSize: 16, color: "#64748B" }} />;
}

function Requests() {
  const [searchParams] = useSearchParams();

  const {
    data: requestData,
    loading,
    error,
    execute: loadRequests,
  } = useApi(getRequests);

  const requests = requestData || [];

  const { data: techniciansData } = useApi(getTechnicians);
  const technicians = techniciansData || [];

  // Filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [serviceFilter, setServiceFilter] = useState("all");
  const [urgencyFilter, setUrgencyFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Selected request state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Agent State inside drawer
  const [agentMessage, setAgentMessage] = useState("");
  const [agentResult, setAgentResult] = useState(null);
  const [agentLoading, setAgentLoading] = useState(false);
  const [agentError, setAgentError] = useState("");

  // Admin Booking State inside drawer
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("morning");
  const [bookingService, setBookingService] = useState("tap repair");
  const [availableOptions, setAvailableOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [selectedOptionId, setSelectedOptionId] = useState(null);
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [isRescheduling, setIsRescheduling] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  // Handle URL query parameters (e.g. ?id=147 or ?filter=high)
  useEffect(() => {
    const urlFilter = searchParams.get("filter");
    if (urlFilter === "high") {
      setUrgencyFilter("high");
    }

    const urlId = searchParams.get("id");
    if (urlId && requests.length > 0) {
      const match = requests.find((r) => String(r.id) === String(urlId));
      if (match) {
        openRequest(match);
      }
    }
  }, [searchParams, requests]);

  const services = useMemo(() => {
    return [...new Set(requests.map((r) => r.service).filter(Boolean))].sort();
  }, [requests]);

  const urgencies = useMemo(() => {
    return [...new Set(requests.map((r) => r.urgency).filter(Boolean))].sort();
  }, [requests]);

  const statuses = useMemo(() => {
    return [...new Set(requests.map((r) => r.status).filter(Boolean))].sort();
  }, [requests]);

  // Filter requests
  const filteredRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return requests.filter((req) => {
      const matchesSearch =
        !normalizedSearch ||
        String(req.id).includes(normalizedSearch) ||
        (req.request_id || "").toLowerCase().includes(normalizedSearch) ||
        (req.message || "").toLowerCase().includes(normalizedSearch) ||
        (req.issue || "").toLowerCase().includes(normalizedSearch) ||
        (req.service || "").toLowerCase().includes(normalizedSearch);

      const matchesStatus = statusFilter === "all" || req.status === statusFilter;
      const matchesService = serviceFilter === "all" || req.service === serviceFilter;
      const matchesUrgency = urgencyFilter === "all" || req.urgency === urgencyFilter;

      return matchesSearch && matchesStatus && matchesService && matchesUrgency;
    });
  }, [requests, search, statusFilter, serviceFilter, urgencyFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredRequests.length / ROWS_PER_PAGE));

  const paginatedRequests = useMemo(() => {
    const start = (page - 1) * ROWS_PER_PAGE;
    return filteredRequests.slice(start, start + ROWS_PER_PAGE);
  }, [filteredRequests, page]);

  async function openRequest(req) {
    setSelectedRequest(req);
    setSelectedCustomer(null);
    setDetailsError("");
    setAgentMessage("");
    setAgentResult(null);
    setAgentError("");
    setIsRescheduling(false);
    setSelectedOptionId(null);
    setAvailableOptions([]);
    setBookingError("");

    // Initialize booking controls from request details
    const todayStr = new Date().toISOString().split("T")[0];
    setBookingDate(req.preferred_date || todayStr);
    const prefTime = (req.preferred_time || "").toLowerCase();
    setBookingTime(prefTime.includes("afternoon") || prefTime.includes("pm") ? "afternoon" : "morning");
    setBookingService(req.service || req.issue || "tap repair");

    try {
      setLoadingDetails(true);
      const detailPromise = getRequest(req.request_id).catch(() => req);
      const customerPromise = req.customer_id
        ? getCustomer(req.customer_id).catch(() => null)
        : Promise.resolve(null);

      const [fullReq, customer] = await Promise.all([detailPromise, customerPromise]);
      setSelectedRequest(fullReq);
      setSelectedCustomer(customer);
    } catch (err) {
      setDetailsError(err.message || "Failed to load request details.");
    } finally {
      setLoadingDetails(false);
    }
  }

  // Live Query available appointment options when configuring dispatch
  useEffect(() => {
    if (!selectedRequest) return;
    if (selectedRequest.appointment && !isRescheduling) return;

    let active = true;
    async function fetchOptions() {
      try {
        setLoadingOptions(true);
        setBookingError("");
        const options = await getRequestAppointmentOptions(selectedRequest.request_id, {
          appointment_date: bookingDate,
          preferred_time: bookingTime,
          service_name: bookingService,
        });
        if (active) {
          setAvailableOptions(options || []);
          if (options && options.length > 0) {
            setSelectedOptionId(options[0].option_id);
          } else {
            setSelectedOptionId(null);
          }
        }
      } catch (err) {
        if (active) {
          setAvailableOptions([]);
          setSelectedOptionId(null);
          setBookingError(err.message || "Unable to query available technician slots.");
        }
      } finally {
        if (active) setLoadingOptions(false);
      }
    }

    fetchOptions();
    return () => {
      active = false;
    };
  }, [selectedRequest?.request_id, bookingDate, bookingTime, bookingService, isRescheduling, selectedRequest?.appointment]);

  async function handleAdminBook() {
    if (!selectedRequest || !selectedOptionId) return;

    const chosenOption = availableOptions.find((opt) => opt.option_id === selectedOptionId);
    if (!chosenOption) {
      setBookingError("Please select an available technician slot.");
      return;
    }

    try {
      setBookingSubmitting(true);
      setBookingError("");

      const updatedRequest = await adminBookAppointment(selectedRequest.request_id, {
        technician_id: chosenOption.technician_id,
        appointment_date: chosenOption.appointment_date,
        start_time: chosenOption.start_time,
        end_time: chosenOption.end_time,
        service_name: bookingService,
      });

      setSelectedRequest(updatedRequest);
      setIsRescheduling(false);
      setSnackbarMessage(
        `Appointment successfully confirmed with ${chosenOption.technician_name} on ${chosenOption.appointment_date} (${chosenOption.start_time} – ${chosenOption.end_time}).`
      );
      setSnackbarOpen(true);
      await loadRequests();
    } catch (err) {
      setBookingError(err.message || "Failed to book appointment on behalf of customer.");
    } finally {
      setBookingSubmitting(false);
    }
  }

  function closeDrawer() {
    setSelectedRequest(null);
    setSelectedCustomer(null);
    setDetailsError("");
    setAgentResult(null);
    setIsRescheduling(false);
    setBookingError("");
  }

  function handleCopyPhone(phone) {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  async function askAgent(presetPrompt = null) {
    const query = (presetPrompt || agentMessage).trim();
    if (!query || agentLoading || !selectedRequest) return;

    try {
      setAgentLoading(true);
      setAgentError("");
      setAgentResult(null);

      const result = await runAgentOperation(query, selectedRequest.request_id);
      setAgentResult(result);
    } catch (err) {
      setAgentError(err.message || "The FlowFix agent could not process this request.");
    } finally {
      setAgentLoading(false);
    }
  }

  return (
    <Box>
      <PageHeader
        title="Service Requests Hub"
        description="Monitor, filter, and dispatch incoming customer plumbing inquiries."
        badge={
          <Chip
            size="small"
            label={`${filteredRequests.length} Total`}
            sx={{ fontWeight: 750, backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}
          />
        }
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={loadRequests}
            sx={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
          >
            Refresh Requests
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={loadRequests} />}

      {/* Filter and Search Bar */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: "18px" }}>
        <Stack spacing={2}>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid size={{ xs: 12, md: 4 }}>
              <TextField
                fullWidth
                placeholder="Search by ID, issue description, or keyword..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
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

            {/* Status Filter */}
            <Grid size={{ xs: 12, sm: 4, md: 2.6 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-label">Status</InputLabel>
                <Select
                  labelId="status-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPage(1);
                  }}
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

            {/* Service Filter */}
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="service-label">Service Type</InputLabel>
                <Select
                  labelId="service-label"
                  label="Service Type"
                  value={serviceFilter}
                  onChange={(e) => {
                    setServiceFilter(e.target.value);
                    setPage(1);
                  }}
                  sx={{ borderRadius: "12px" }}
                >
                  <MenuItem value="all">All Services</MenuItem>
                  {services.map((srv) => (
                    <MenuItem key={srv} value={srv}>
                      {formatLabel(srv)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Urgency Filter */}
            <Grid size={{ xs: 12, sm: 4, md: 2.7 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="urgency-label">Urgency</InputLabel>
                <Select
                  labelId="urgency-label"
                  label="Urgency"
                  value={urgencyFilter}
                  onChange={(e) => {
                    setUrgencyFilter(e.target.value);
                    setPage(1);
                  }}
                  sx={{ borderRadius: "12px" }}
                >
                  <MenuItem value="all">All Urgencies</MenuItem>
                  {urgencies.map((urg) => (
                    <MenuItem key={urg} value={urg}>
                      {urg.toUpperCase()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>

          {/* Quick Filter Tag Buttons */}
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
            <Typography variant="caption" fontWeight={700} color="text.secondary">
              Quick Filters:
            </Typography>
            <Chip
              label="All"
              size="small"
              onClick={() => {
                setStatusFilter("all");
                setUrgencyFilter("all");
                setServiceFilter("all");
                setSearch("");
                setPage(1);
              }}
              sx={{
                cursor: "pointer",
                fontWeight: statusFilter === "all" && urgencyFilter === "all" ? 750 : 500,
                backgroundColor: statusFilter === "all" && urgencyFilter === "all" ? "#2563EB" : "#F1F5F9",
                color: statusFilter === "all" && urgencyFilter === "all" ? "#FFFFFF" : "#475569",
              }}
            />
            <Chip
              icon={<FlashOn sx={{ fontSize: "14px !important", color: urgencyFilter === "high" ? "#FFFFFF !important" : "#EF4444 !important" }} />}
              label="Emergency / High Urgency"
              size="small"
              onClick={() => {
                setUrgencyFilter(urgencyFilter === "high" ? "all" : "high");
                setPage(1);
              }}
              sx={{
                cursor: "pointer",
                fontWeight: urgencyFilter === "high" ? 750 : 600,
                backgroundColor: urgencyFilter === "high" ? "#DC2626" : "rgba(239, 68, 68, 0.08)",
                color: urgencyFilter === "high" ? "#FFFFFF" : "#DC2626",
                border: "1px solid rgba(239, 68, 68, 0.2)",
              }}
            />
            <Chip
              label="Awaiting Details"
              size="small"
              onClick={() => {
                setStatusFilter(statusFilter === "awaiting_information" ? "all" : "awaiting_information");
                setPage(1);
              }}
              sx={{
                cursor: "pointer",
                fontWeight: statusFilter === "awaiting_information" ? 750 : 600,
                backgroundColor: statusFilter === "awaiting_information" ? "#D97706" : "rgba(245, 158, 11, 0.08)",
                color: statusFilter === "awaiting_information" ? "#FFFFFF" : "#B45309",
              }}
            />
            <Chip
              label="Ready to Schedule"
              size="small"
              onClick={() => {
                setStatusFilter(statusFilter === "awaiting_appointment_selection" ? "all" : "awaiting_appointment_selection");
                setPage(1);
              }}
              sx={{
                cursor: "pointer",
                fontWeight: statusFilter === "awaiting_appointment_selection" ? 750 : 600,
                backgroundColor: statusFilter === "awaiting_appointment_selection" ? "#2563EB" : "rgba(37, 99, 235, 0.08)",
                color: statusFilter === "awaiting_appointment_selection" ? "#FFFFFF" : "#1D4ED8",
              }}
            />
            <Chip
              label="Confirmed Jobs"
              size="small"
              onClick={() => {
                setStatusFilter(statusFilter === "confirmed" ? "all" : "confirmed");
                setPage(1);
              }}
              sx={{
                cursor: "pointer",
                fontWeight: statusFilter === "confirmed" ? 750 : 600,
                backgroundColor: statusFilter === "confirmed" ? "#059669" : "rgba(16, 185, 129, 0.08)",
                color: statusFilter === "confirmed" ? "#FFFFFF" : "#047857",
              }}
            />
            <Chip
              label="Awaiting Specialist"
              size="small"
              onClick={() => {
                setStatusFilter(statusFilter === "awaiting_technician" ? "all" : "awaiting_technician");
                setPage(1);
              }}
              sx={{
                cursor: "pointer",
                fontWeight: statusFilter === "awaiting_technician" ? 750 : 600,
                backgroundColor: statusFilter === "awaiting_technician" ? "#DC2626" : "rgba(239, 68, 68, 0.08)",
                color: statusFilter === "awaiting_technician" ? "#FFFFFF" : "#DC2626",
              }}
            />
          </Box>
        </Stack>
      </Paper>

      {/* Requests Table */}
      <Paper variant="outlined" sx={{ borderRadius: "18px", overflow: "hidden", mb: 3 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width="90">Req #</TableCell>
                <TableCell width="120">Urgency</TableCell>
                <TableCell>Service / Diagnosis</TableCell>
                <TableCell>Customer Inquiry</TableCell>
                <TableCell>Requested Slot</TableCell>
                <TableCell width="160">Status</TableCell>
                <TableCell width="90" align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && requests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <LoadingState />
                  </TableCell>
                </TableRow>
              ) : paginatedRequests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                    <EmptyState
                      title="No matching requests found"
                      description="Try adjusting your filters or search keywords."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((req) => {
                  const isHigh = req.urgency === "high";
                  return (
                    <TableRow
                      key={req.id}
                      hover
                      onClick={() => openRequest(req)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: isHigh ? "rgba(254, 242, 242, 0.35)" : "inherit",
                        transition: "background-color 0.15s ease",
                      }}
                    >
                      {/* ID */}
                      <TableCell>
                        <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                          #{req.id}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {req.customer_id ? `Cust #${req.customer_id}` : "Unregistered"}
                        </Typography>
                      </TableCell>

                      {/* Urgency */}
                      <TableCell>
                        <Chip
                          icon={isHigh ? <Box component="span" className="pulse-dot-red" sx={{ ml: 0.5 }} /> : undefined}
                          label={req.urgency ? req.urgency.toUpperCase() : "STANDARD"}
                          size="small"
                          sx={{
                            height: 22,
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            backgroundColor: isHigh ? "rgba(239, 68, 68, 0.12)" : "rgba(100, 116, 139, 0.08)",
                            color: isHigh ? "#EF4444" : "#475569",
                            border: isHigh ? "1px solid rgba(239, 68, 68, 0.25)" : "none",
                          }}
                        />
                      </TableCell>

                      {/* Service / Category */}
                      <TableCell>
                        <Stack direction="row" spacing={1} alignItems="center">
                          {getServiceIcon(req.service || req.issue)}
                          <Box>
                            <Typography variant="body2" fontWeight={700} color="#0F172A">
                              {formatLabel(req.service || req.issue)}
                            </Typography>
                            {req.issue && req.issue !== req.service && (
                              <Typography variant="caption" color="text.secondary">
                                {req.issue}
                              </Typography>
                            )}
                          </Box>
                        </Stack>
                      </TableCell>

                      {/* Message Preview */}
                      <TableCell sx={{ maxWidth: 300 }}>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            textOverflow: "ellipsis",
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {req.message}
                        </Typography>
                      </TableCell>

                      {/* Preferred Slot */}
                      <TableCell>
                        <Typography variant="body2" fontWeight={600} color="#0F172A">
                          {req.preferred_date || "Any date"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {req.preferred_time || "Flexible window"}
                        </Typography>
                      </TableCell>

                      {/* Status */}
                      <TableCell>
                        <StatusChip status={req.status} />
                      </TableCell>

                      {/* Action */}
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={(e) => {
                            e.stopPropagation();
                            openRequest(req);
                          }}
                          sx={{ minWidth: 32, px: 1.25, py: 0.4, borderRadius: "8px", fontSize: "0.75rem" }}
                        >
                          Inspect
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        {totalPages > 1 && (
          <Box sx={{ p: 2, display: "flex", justifyContent: "center", borderTop: "1px solid #F1F5F9" }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(_, val) => setPage(val)}
              color="primary"
              shape="rounded"
              size="small"
            />
          </Box>
        )}
      </Paper>

      {/* ======================================================
          SLIDE-OVER INSPECTION DRAWER
      ====================================================== */}
      <Drawer
        anchor="right"
        open={Boolean(selectedRequest)}
        onClose={closeDrawer}
        slotProps={{
          paper: {
            sx: {
              width: { xs: "100%", sm: 580 },
              boxSizing: "border-box",
              borderLeft: "1px solid #E2E8F0",
              boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.2)",
            },
          },
        }}
      >
        {selectedRequest && (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            {/* Drawer Header */}
            <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="h6" fontWeight={850} color="#0F172A">
                    Request #{selectedRequest.id}
                  </Typography>
                  <StatusChip status={selectedRequest.status} size="small" />
                </Stack>
                <IconButton size="small" onClick={closeDrawer}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ wordBreak: "break-all" }}>
                UUID: {selectedRequest.request_id}
              </Typography>
            </Box>

            {/* Drawer Scrollable Body */}
            <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
              {loadingDetails ? (
                <LoadingState />
              ) : (
                <Stack spacing={3}>
                  {detailsError && <ErrorState message={detailsError} />}

                  {/* Customer Information Card */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                    <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                      Customer Profile
                    </Typography>
                    {selectedCustomer ? (
                      <Stack spacing={1.5}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box sx={{ width: 38, height: 38, borderRadius: "10px", backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 750 }}>
                            {selectedCustomer.name.charAt(0)}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                              {selectedCustomer.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Verified Customer ID #{selectedCustomer.id}
                            </Typography>
                          </Box>
                        </Stack>

                        <Divider />

                        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Phone sx={{ fontSize: 16, color: "#64748B" }} />
                            <Typography variant="body2" fontWeight={600} color="#0F172A">
                              {selectedCustomer.phone}
                            </Typography>
                          </Stack>
                          <Button
                            size="small"
                            variant="text"
                            startIcon={copiedPhone ? <CheckCircle sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                            onClick={() => handleCopyPhone(selectedCustomer.phone)}
                            sx={{ fontSize: "0.72rem", py: 0.2 }}
                          >
                            {copiedPhone ? "Copied" : "Copy"}
                          </Button>
                        </Box>

                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <LocationOn sx={{ fontSize: 16, color: "#64748B", mt: 0.25 }} />
                          <Typography variant="body2" color="text.secondary">
                            {selectedCustomer.address}
                          </Typography>
                        </Stack>
                      </Stack>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        Customer details pending identity confirmation.
                      </Typography>
                    )}
                  </Paper>

                  {/* AI Extraction Analysis */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px", backgroundColor: "rgba(37, 99, 235, 0.02)" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1.5 }}>
                      <SmartToy sx={{ fontSize: 18, color: "#2563EB" }} />
                      <Typography variant="caption" fontWeight={750} color="#1D4ED8" sx={{ textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        AI Diagnostics & Extraction
                      </Typography>
                    </Stack>

                    <Grid container spacing={2}>
                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Detected Issue
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {selectedRequest.issue || "General Issue"}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Service Category
                        </Typography>
                        <Typography variant="body2" fontWeight={700} color="#0F172A">
                          {formatLabel(selectedRequest.service)}
                        </Typography>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Assessed Urgency
                        </Typography>
                        <Box sx={{ mt: 0.5 }}>
                          <Chip
                            label={selectedRequest.urgency || "standard"}
                            size="small"
                            sx={{
                              height: 20,
                              fontWeight: 750,
                              fontSize: "0.68rem",
                              textTransform: "uppercase",
                              backgroundColor: selectedRequest.urgency === "high" ? "rgba(239, 68, 68, 0.12)" : "rgba(100, 116, 139, 0.1)",
                              color: selectedRequest.urgency === "high" ? "#EF4444" : "#475569",
                            }}
                          />
                        </Box>
                      </Grid>

                      <Grid size={{ xs: 6 }}>
                        <Typography variant="caption" color="text.secondary">
                          Customer Preferred Slot
                        </Typography>
                        <Typography variant="body2" fontWeight={600} color="#0F172A">
                          {selectedRequest.preferred_date || "Flexible"} • {selectedRequest.preferred_time || "Any"}
                        </Typography>
                      </Grid>
                    </Grid>

                    <Divider sx={{ my: 1.5 }} />

                    <Box sx={{ p: 1.5, borderRadius: "10px", backgroundColor: "#FFFFFF", border: "1px solid #E2E8F0" }}>
                      <Typography variant="body2" color="#334155" sx={{ fontStyle: "italic" }}>
                        "{selectedRequest.message}"
                      </Typography>
                    </Box>

                    {selectedRequest.quote_estimate && (
                      <Box
                        sx={{
                          mt: 1.5,
                          p: 1.5,
                          borderRadius: "10px",
                          backgroundColor: "rgba(37, 99, 235, 0.05)",
                          border: "1px solid rgba(37, 99, 235, 0.15)",
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          gap: 1.5,
                        }}
                      >
                        <Box>
                          <Typography
                            variant="caption"
                            sx={{
                              fontWeight: 750,
                              color: "#2563EB",
                              textTransform: "uppercase",
                              letterSpacing: "0.05em",
                              fontSize: "0.68rem",
                              display: "block",
                            }}
                          >
                            Estimated Quote • {selectedRequest.quote_estimate.pricing_tier}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
                            {selectedRequest.quote_estimate.description}
                          </Typography>
                        </Box>
                        <Typography variant="subtitle1" fontWeight={850} color="#0F172A" sx={{ flexShrink: 0 }}>
                          ${selectedRequest.quote_estimate.estimated_min}–${selectedRequest.quote_estimate.estimated_max} AUD
                        </Typography>
                      </Box>
                    )}
                  </Paper>

                  {/* Appointment Booking & Dispatch Section */}
                  {selectedRequest.appointment && !isRescheduling ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: "16px",
                        borderColor: selectedRequest.appointment.status === "declined" ? "rgba(239, 68, 68, 0.35)" : "rgba(16, 185, 129, 0.35)",
                        backgroundColor: selectedRequest.appointment.status === "declined" ? "rgba(239, 68, 68, 0.03)" : "rgba(16, 185, 129, 0.03)",
                        boxShadow: selectedRequest.appointment.status === "declined" ? "0 4px 12px rgba(239, 68, 68, 0.06)" : "0 4px 12px rgba(16, 185, 129, 0.06)",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 38,
                              height: 38,
                              borderRadius: "10px",
                              background: selectedRequest.appointment.status === "declined" ? "linear-gradient(135deg, #DC2626, #EF4444)" : "linear-gradient(135deg, #059669, #10B981)",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            {selectedRequest.appointment.status === "declined" ? <Cancel sx={{ fontSize: 20 }} /> : <EventAvailable sx={{ fontSize: 20 }} />}
                          </Box>
                          <Box>
                            <Typography variant="subtitle2" fontWeight={800} color="#0F172A">
                              {selectedRequest.appointment.status === "declined" ? "Specialist Declined Booking" : "Confirmed Appointment"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {selectedRequest.appointment.status === "declined" ? "Awaiting specialist reassignment" : "Dispatched & locked on technician schedule"}
                            </Typography>
                          </Box>
                        </Stack>
                        <StatusChip status={selectedRequest.appointment.status || "confirmed"} size="small" />
                      </Box>

                      {selectedRequest.appointment.declined_reason && (
                        <Box sx={{ mb: 2, p: 1.5, borderRadius: "10px", backgroundColor: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                          <Typography variant="caption" fontWeight={750} color="#DC2626" sx={{ display: "block" }}>
                            Decline Reason:
                          </Typography>
                          <Typography variant="body2" color="#991B1B" sx={{ fontStyle: "italic", mt: 0.25 }}>
                            "{selectedRequest.appointment.declined_reason}"
                          </Typography>
                        </Box>
                      )}

                      <Divider sx={{ my: 1.5 }} />

                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Scheduled Date
                          </Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                            <CalendarMonth sx={{ fontSize: 16, color: selectedRequest.appointment.status === "declined" ? "#DC2626" : "#059669" }} />
                            <Typography variant="body2" fontWeight={750} color="#0F172A">
                              {selectedRequest.appointment.appointment_date}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 6 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            Shift Window
                          </Typography>
                          <Stack direction="row" spacing={0.75} alignItems="center" sx={{ mt: 0.25 }}>
                            <Schedule sx={{ fontSize: 16, color: selectedRequest.appointment.status === "declined" ? "#DC2626" : "#059669" }} />
                            <Typography variant="body2" fontWeight={750} color="#0F172A">
                              {selectedRequest.appointment.start_time} – {selectedRequest.appointment.end_time}
                            </Typography>
                          </Stack>
                        </Grid>
                        <Grid size={{ xs: 12 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {selectedRequest.appointment.status === "declined" ? "Previously Assigned Specialist" : "Assigned Field Specialist"}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.5 }}>
                            <Box
                              sx={{
                                width: 28,
                                height: 28,
                                borderRadius: "50%",
                                backgroundColor: selectedRequest.appointment.status === "declined" ? "rgba(239, 68, 68, 0.12)" : "rgba(37, 99, 235, 0.12)",
                                color: selectedRequest.appointment.status === "declined" ? "#DC2626" : "#2563EB",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "0.75rem",
                                fontWeight: 800,
                              }}
                            >
                              #{selectedRequest.appointment.technician_id}
                            </Box>
                            <Typography variant="body2" fontWeight={700} color="#0F172A">
                              {(() => {
                                const techName =
                                  selectedRequest.appointment.technician_name ||
                                  technicians.find((t) => t.id === selectedRequest.appointment.technician_id)?.name;
                                return techName
                                  ? `${techName} (Technician #${selectedRequest.appointment.technician_id})`
                                  : `Technician #${selectedRequest.appointment.technician_id}`;
                              })()}
                            </Typography>
                          </Stack>
                        </Grid>
                      </Grid>

                      <Button
                        variant={selectedRequest.appointment.status === "declined" ? "contained" : "outlined"}
                        color={selectedRequest.appointment.status === "declined" ? "primary" : "inherit"}
                        size="small"
                        fullWidth
                        startIcon={<EditCalendar />}
                        onClick={() => setIsRescheduling(true)}
                        sx={{
                          borderRadius: "10px",
                          textTransform: "none",
                          fontWeight: 750,
                          ...(selectedRequest.appointment.status === "declined"
                            ? { backgroundColor: "#2563EB", color: "#FFFFFF", "&:hover": { backgroundColor: "#1D4ED8" } }
                            : { borderColor: "#CBD5E1" }),
                        }}
                      >
                        {selectedRequest.appointment.status === "declined" ? "Assign New Specialist / Re-Dispatch" : "Reschedule or Reassign Specialist"}
                      </Button>
                    </Paper>
                  ) : (
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2.5,
                        borderRadius: "16px",
                        border: "1.5px solid #3B82F6",
                        backgroundColor: "#FFFFFF",
                        boxShadow: "0 8px 24px -4px rgba(37, 99, 235, 0.08)",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
                        <Stack direction="row" spacing={1.5} alignItems="center">
                          <Box
                            sx={{
                              width: 40,
                              height: 40,
                              borderRadius: "12px",
                              background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                              color: "#FFFFFF",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              boxShadow: "0 4px 12px rgba(37, 99, 235, 0.25)",
                            }}
                          >
                            <EventAvailable sx={{ fontSize: 22 }} />
                          </Box>
                          <Box>
                            <Typography variant="subtitle1" fontWeight={850} color="#0F172A">
                              {isRescheduling ? "Reschedule Appointment" : "Book Appointment on Behalf of Customer"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Select preferred shift and choose an available certified specialist
                            </Typography>
                          </Box>
                        </Stack>

                        {isRescheduling && (
                          <Button
                            size="small"
                            variant="text"
                            onClick={() => setIsRescheduling(false)}
                            sx={{ fontSize: "0.75rem", color: "text.secondary" }}
                          >
                            Cancel
                          </Button>
                        )}
                      </Box>

                      {bookingError && (
                        <Alert severity="error" sx={{ mb: 2, borderRadius: "10px" }}>
                          {bookingError}
                        </Alert>
                      )}

                      {/* Controls: Service, Date, Time Shift */}
                      <Stack spacing={2} sx={{ mb: 2.5 }}>
                        <Grid container spacing={1.5}>
                          {/* Service Type */}
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 0.5 }}>
                              Service Capability
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={bookingService}
                                onChange={(e) => setBookingService(e.target.value)}
                                sx={{ borderRadius: "10px" }}
                              >
                                <MenuItem value="tap repair">Tap Repair</MenuItem>
                                <MenuItem value="toilet repair">Toilet Repair</MenuItem>
                                <MenuItem value="shower repair">Shower Repair</MenuItem>
                                <MenuItem value="leak investigation">Leak Investigation</MenuItem>
                                <MenuItem value="blocked drains">Blocked Drains</MenuItem>
                                <MenuItem value="hot water system">Hot Water System</MenuItem>
                                <MenuItem value="burst pipe repair">Burst Pipe Repair</MenuItem>
                                <MenuItem value="gas fitting">Gas Fitting</MenuItem>
                                <MenuItem value="roof plumbing">Roof Plumbing</MenuItem>
                                <MenuItem value="backflow prevention">Backflow Prevention</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Shift Window */}
                          <Grid size={{ xs: 12, sm: 6 }}>
                            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 0.5 }}>
                              Preferred Shift
                            </Typography>
                            <FormControl fullWidth size="small">
                              <Select
                                value={bookingTime}
                                onChange={(e) => setBookingTime(e.target.value)}
                                sx={{ borderRadius: "10px" }}
                              >
                                <MenuItem value="morning">Morning (09:00 – 12:00)</MenuItem>
                                <MenuItem value="afternoon">Afternoon (13:00 – 17:00)</MenuItem>
                              </Select>
                            </FormControl>
                          </Grid>

                          {/* Date Input */}
                          <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 0.5 }}>
                              Appointment Date
                            </Typography>
                            <TextField
                              type="date"
                              size="small"
                              fullWidth
                              value={bookingDate}
                              onChange={(e) => setBookingDate(e.target.value)}
                              sx={{
                                "& .MuiOutlinedInput-root": {
                                  borderRadius: "10px",
                                },
                              }}
                            />
                          </Grid>
                        </Grid>
                      </Stack>

                      {/* Available Certified Specialists */}
                      <Box sx={{ mb: 2.5 }}>
                        <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.05em", display: "block", mb: 1 }}>
                          Available Qualified Specialists ({availableOptions.length})
                        </Typography>

                        {loadingOptions ? (
                          <Box sx={{ py: 3, textAlign: "center" }}>
                            <CircularProgress size={22} />
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              Checking technician schedules & qualifications...
                            </Typography>
                          </Box>
                        ) : availableOptions.length === 0 ? (
                          <Box sx={{ p: 2, borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px dashed #CBD5E1", textAlign: "center" }}>
                            <Typography variant="body2" color="text.secondary" fontWeight={600}>
                              No qualified specialists available for this date and shift window.
                            </Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                              Try switching between Morning and Afternoon, or pick another date.
                            </Typography>
                          </Box>
                        ) : (
                          <Stack spacing={1}>
                            {availableOptions.map((opt) => {
                              const isSelected = selectedOptionId === opt.option_id;
                              return (
                                <Box
                                  key={opt.option_id}
                                  onClick={() => setSelectedOptionId(opt.option_id)}
                                  sx={{
                                    p: 1.5,
                                    borderRadius: "12px",
                                    border: `1.5px solid ${isSelected ? "#2563EB" : "#E2E8F0"}`,
                                    backgroundColor: isSelected ? "rgba(37, 99, 235, 0.05)" : "#FFFFFF",
                                    cursor: "pointer",
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
                                  <Stack direction="row" spacing={1.5} alignItems="center">
                                    <Box
                                      sx={{
                                        width: 36,
                                        height: 36,
                                        borderRadius: "10px",
                                        background: isSelected
                                          ? "linear-gradient(135deg, #2563EB, #1D4ED8)"
                                          : "#F1F5F9",
                                        color: isSelected ? "#FFFFFF" : "#475569",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        fontWeight: 800,
                                        fontSize: "0.95rem",
                                      }}
                                    >
                                      {opt.technician_name.charAt(0)}
                                    </Box>
                                    <Box>
                                      <Typography variant="body2" fontWeight={750} color={isSelected ? "#1D4ED8" : "#0F172A"}>
                                        {opt.technician_name}
                                      </Typography>
                                      <Typography variant="caption" color="text.secondary">
                                        Certified for {formatLabel(bookingService)} • ID #{opt.technician_id}
                                      </Typography>
                                    </Box>
                                  </Stack>

                                  <Stack direction="row" spacing={1} alignItems="center">
                                    <Chip
                                      label={`${opt.start_time} – ${opt.end_time}`}
                                      size="small"
                                      sx={{
                                        fontWeight: 700,
                                        fontSize: "0.7rem",
                                        backgroundColor: isSelected ? "rgba(37, 99, 235, 0.12)" : "#F1F5F9",
                                        color: isSelected ? "#1D4ED8" : "#475569",
                                      }}
                                    />
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
                                  </Stack>
                                </Box>
                              );
                            })}
                          </Stack>
                        )}
                      </Box>

                      {/* Submit Button */}
                      <Button
                        variant="contained"
                        fullWidth
                        disabled={!selectedOptionId || bookingSubmitting || availableOptions.length === 0}
                        startIcon={bookingSubmitting ? <CircularProgress size={16} color="inherit" /> : <EventAvailable />}
                        onClick={handleAdminBook}
                        sx={{
                          py: 1.2,
                          borderRadius: "12px",
                          background: "linear-gradient(135deg, #2563EB, #1D4ED8)",
                          boxShadow: "0 4px 14px rgba(37, 99, 235, 0.3)",
                          fontWeight: 800,
                          textTransform: "none",
                          fontSize: "0.88rem",
                        }}
                      >
                        {bookingSubmitting
                          ? "Confirming Appointment..."
                          : isRescheduling
                          ? "Update & Reassign Appointment"
                          : "Confirm & Book Appointment on Behalf of Customer"}
                      </Button>
                    </Paper>
                  )}

                  {/* AI Operations Copilot Box inside Drawer */}
                  <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                      <SmartToy sx={{ fontSize: 20, color: "#2563EB" }} />
                      <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                        FlowFix Agent Operations
                      </Typography>
                    </Stack>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                      Query availability, check customer history, or verify dispatch status for this request.
                    </Typography>

                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      placeholder="Ask the agent about this request..."
                      value={agentMessage}
                      onChange={(e) => setAgentMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          askAgent();
                        }
                      }}
                    />

                    {/* Quick Preset Buttons */}
                    <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center", mt: 1.5 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => askAgent("Is there an appointment available for this request?")}
                        sx={{ fontSize: "0.72rem", py: 0.3 }}
                      >
                        Check Availability
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => askAgent("Who is the customer for this request?")}
                        sx={{ fontSize: "0.72rem", py: 0.3 }}
                      >
                        Look Up Customer
                      </Button>
                    </Box>

                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={agentLoading ? <CircularProgress size={16} color="inherit" /> : <SmartToy />}
                      disabled={!agentMessage.trim() || agentLoading}
                      onClick={() => askAgent()}
                      sx={{ mt: 1.5, borderRadius: "10px" }}
                    >
                      {agentLoading ? "Consulting FlowFix Agent..." : "Run Operation Query"}
                    </Button>

                    {agentError && (
                      <Box sx={{ mt: 1.5 }}>
                        <ErrorState message={agentError} />
                      </Box>
                    )}

                    {agentResult && (
                      <Box sx={{ mt: 2, p: 2, borderRadius: "12px", backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
                        <Typography variant="caption" fontWeight={750} color="#2563EB" sx={{ textTransform: "uppercase", display: "block", mb: 0.5 }}>
                          Agent Response
                        </Typography>
                        <MarkdownMessage content={agentResult.message} />
                      </Box>
                    )}
                  </Paper>
                </Stack>
              )}
            </Box>
          </Box>
        )}
      </Drawer>

      {/* Confirmation Feedback Toast */}
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

export default Requests;