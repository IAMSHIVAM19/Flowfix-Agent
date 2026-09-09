import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  Paper,
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
  LocationOn,
  Person,
  Phone,
  Refresh,
  Search,
  CheckCircle,
  AssignmentOutlined,
  CalendarMonthOutlined,
} from "@mui/icons-material";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import useApi from "../hooks/useApi";
import {
  getCustomer,
  getCustomers,
} from "../services/api";

function Customers() {
  const {
    data: customerData,
    loading,
    error,
    execute: loadCustomers,
  } = useApi(getCustomers);

  const customers = customerData || [];

  const [search, setSearch] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [copiedPhone, setCopiedPhone] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        (customer.name || "").toLowerCase().includes(normalizedSearch) ||
        (customer.phone || "").toLowerCase().includes(normalizedSearch) ||
        (customer.address || "").toLowerCase().includes(normalizedSearch)
      );
    });
  }, [customers, search]);

  async function openCustomer(customerId) {
    try {
      setDetailsError("");
      setLoadingDetails(true);
      const data = await getCustomer(customerId);
      setSelectedCustomer(data);
    } catch (err) {
      setDetailsError(err.message || "Failed to load customer details.");
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDrawer() {
    setSelectedCustomer(null);
    setDetailsError("");
  }

  function handleCopyPhone(phone) {
    if (!phone) return;
    navigator.clipboard.writeText(phone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  }

  return (
    <Box>
      <PageHeader
        title="Customer CRM & History"
        description="Search customer accounts, verify service locations, and review past work orders."
        badge={
          <Chip
            size="small"
            label={`${filteredCustomers.length} Customers`}
            sx={{ fontWeight: 750, backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}
          />
        }
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={loadCustomers}
            sx={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
          >
            Refresh List
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={loadCustomers} />}

      {/* Search Bar */}
      <Paper variant="outlined" sx={{ p: 2.5, mb: 3, borderRadius: "18px" }}>
        <TextField
          fullWidth
          placeholder="Search by customer name, phone number, or street address..."
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
      </Paper>

      {/* Table */}
      <Paper variant="outlined" sx={{ borderRadius: "18px", overflow: "hidden" }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Contact Number</TableCell>
                <TableCell>Service Address</TableCell>
                <TableCell align="center">Requests</TableCell>
                <TableCell align="center">Appointments</TableCell>
                <TableCell align="right">Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading && customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <LoadingState />
                  </TableCell>
                </TableRow>
              ) : filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 6 }}>
                    <EmptyState
                      title="No customers found"
                      description="Try a different search term or check spelling."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((cust) => (
                  <TableRow
                    key={cust.id}
                    hover
                    onClick={() => openCustomer(cust.id)}
                    sx={{ cursor: "pointer" }}
                  >
                    {/* Customer Avatar & Name */}
                    <TableCell>
                      <Stack direction="row" spacing={1.5} alignItems="center">
                        <Box
                          sx={{
                            width: 36,
                            height: 36,
                            borderRadius: "10px",
                            backgroundColor: "rgba(37, 99, 235, 0.08)",
                            color: "#2563EB",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontWeight: 750,
                            fontSize: "0.85rem",
                          }}
                        >
                          {cust.name ? cust.name.charAt(0).toUpperCase() : "C"}
                        </Box>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                            {cust.name}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Customer ID #{cust.id}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Phone */}
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Phone sx={{ fontSize: 16, color: "#94A3B8" }} />
                        <Typography variant="body2" fontWeight={600} color="#0F172A">
                          {cust.phone}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Address */}
                    <TableCell>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <LocationOn sx={{ fontSize: 16, color: "#94A3B8" }} />
                        <Typography variant="body2" color="#475569">
                          {cust.address}
                        </Typography>
                      </Stack>
                    </TableCell>

                    {/* Request count */}
                    <TableCell align="center">
                      <Chip
                        label={`${cust.request_count ?? cust.requests_count ?? 0} reqs`}
                        size="small"
                        sx={{ fontWeight: 650, backgroundColor: "#F1F5F9", color: "#475569" }}
                      />
                    </TableCell>

                    {/* Appointment count */}
                    <TableCell align="center">
                      <Chip
                        label={`${cust.appointment_count ?? cust.appointments_count ?? 0} appts`}
                        size="small"
                        sx={{ fontWeight: 650, backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#047857" }}
                      />
                    </TableCell>

                    {/* Action */}
                    <TableCell align="right">
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={(e) => {
                          e.stopPropagation();
                          openCustomer(cust.id);
                        }}
                        sx={{ minWidth: 32, px: 1.25, py: 0.4, borderRadius: "8px", fontSize: "0.75rem" }}
                      >
                        Profile
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Customer CRM Details Drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedCustomer)}
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
        {selectedCustomer && (
          <Box sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
            <Box sx={{ p: 3, pb: 2, borderBottom: "1px solid #E2E8F0", backgroundColor: "#F8FAFC" }}>
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
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
                    {selectedCustomer.name.charAt(0)}
                  </Box>
                  <Box>
                    <Typography variant="h6" fontWeight={850} color="#0F172A">
                      {selectedCustomer.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Customer ID #{selectedCustomer.id}
                    </Typography>
                  </Box>
                </Stack>
                <IconButton size="small" onClick={closeDrawer}>
                  <Close fontSize="small" />
                </IconButton>
              </Box>
            </Box>

            <Box sx={{ p: 3, flexGrow: 1, overflowY: "auto" }}>
              <Stack spacing={3}>
                {detailsError && <ErrorState message={detailsError} />}

                {/* Contact Card */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                    Contact & Location
                  </Typography>

                  <Stack spacing={1.5}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Phone sx={{ fontSize: 18, color: "#64748B" }} />
                        <Typography variant="body1" fontWeight={700} color="#0F172A">
                          {selectedCustomer.phone}
                        </Typography>
                      </Stack>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={copiedPhone ? <CheckCircle sx={{ fontSize: 14 }} /> : <ContentCopy sx={{ fontSize: 14 }} />}
                        onClick={() => handleCopyPhone(selectedCustomer.phone)}
                        sx={{ fontSize: "0.72rem", py: 0.2 }}
                      >
                        {copiedPhone ? "Copied" : "Copy"}
                      </Button>
                    </Box>

                    <Divider />

                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <LocationOn sx={{ fontSize: 18, color: "#64748B", mt: 0.25 }} />
                      <Box>
                        <Typography variant="body2" color="#0F172A" fontWeight={600}>
                          Service Address
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedCustomer.address}
                        </Typography>
                      </Box>
                    </Stack>
                  </Stack>
                </Paper>

                {/* Request History */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                    Service Request History ({selectedCustomer.requests?.length || 0})
                  </Typography>

                  {(!selectedCustomer.requests || selectedCustomer.requests.length === 0) ? (
                    <Typography variant="body2" color="text.secondary">
                      No service requests recorded.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {selectedCustomer.requests.map((r) => (
                        <Box
                          key={r.id}
                          sx={{
                            p: 2,
                            borderRadius: "12px",
                            backgroundColor: "#F8FAFC",
                            border: "1px solid #E2E8F0",
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                              Request #{r.id} • {r.service || r.issue || "Plumbing"}
                            </Typography>
                            <StatusChip status={r.status} size="small" />
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            "{r.message}"
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  )}
                </Paper>

                {/* Appointments History */}
                <Paper variant="outlined" sx={{ p: 2.5, borderRadius: "16px" }}>
                  <Typography variant="caption" fontWeight={750} color="text.secondary" sx={{ textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1.5 }}>
                    Appointment History ({selectedCustomer.appointments?.length || 0})
                  </Typography>

                  {(!selectedCustomer.appointments || selectedCustomer.appointments.length === 0) ? (
                    <Typography variant="body2" color="text.secondary">
                      No appointments booked yet.
                    </Typography>
                  ) : (
                    <Stack spacing={1.25}>
                      {selectedCustomer.appointments.map((a) => (
                        <Box
                          key={a.id}
                          sx={{
                            p: 2,
                            borderRadius: "12px",
                            backgroundColor: "rgba(16, 185, 129, 0.04)",
                            border: "1px solid rgba(16, 185, 129, 0.2)",
                          }}
                        >
                          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 0.5 }}>
                            <Typography variant="subtitle2" fontWeight={750} color="#0F172A">
                              Appt #{a.id} ({a.appointment_date})
                            </Typography>
                            <StatusChip status={a.status} size="small" />
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Time: {a.start_time} – {a.end_time}
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
    </Box>
  );
}

export default Customers;