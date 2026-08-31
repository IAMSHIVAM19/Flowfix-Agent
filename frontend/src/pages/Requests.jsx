import { useEffect, useMemo, useState } from "react";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import useApi from "../hooks/useApi";

import {
  Box,
  Chip,
  CircularProgress,
  Divider,
  Drawer,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
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
  Typography,
} from "@mui/material";

import {
  getCustomer,
  getRequest,
  getRequests,
} from "../services/api";

const ROWS_PER_PAGE = 10;

function formatLabel(value) {
  if (!value) {
    return "Unknown";
  }

  return value
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function Requests() {
  const {
    data: requestData,
    loading,
    error,
    execute: loadRequests,
  } = useApi(getRequests);

  const requests = requestData || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState("all");
  const [serviceFilter, setServiceFilter] =
    useState("all");
  const [urgencyFilter, setUrgencyFilter] =
    useState("all");

  const [page, setPage] = useState(1);

  const [selectedRequest, setSelectedRequest] =
    useState(null);
  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const services = useMemo(() => {
    return [
      ...new Set(
        requests
          .map((request) => request.service)
          .filter(Boolean)
      ),
    ].sort();
  }, [requests]);

  const urgencies = useMemo(() => {
    return [
      ...new Set(
        requests
          .map((request) => request.urgency)
          .filter(Boolean)
      ),
    ].sort();
  }, [requests]);

  const statuses = useMemo(() => {
    return [
      ...new Set(
        requests
          .map((request) => request.status)
          .filter(Boolean)
      ),
    ].sort();
  }, [requests]);

  const filteredRequests = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    return requests.filter((request) => {
      const matchesSearch =
        !normalizedSearch ||
        request.request_id
          .toLowerCase()
          .includes(normalizedSearch) ||
        (request.issue || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (request.service || "")
          .toLowerCase()
          .includes(normalizedSearch);

      const matchesStatus =
        statusFilter === "all" ||
        request.status === statusFilter;

      const matchesService =
        serviceFilter === "all" ||
        request.service === serviceFilter;

      const matchesUrgency =
        urgencyFilter === "all" ||
        request.urgency === urgencyFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesService &&
        matchesUrgency
      );
    });
  }, [
    requests,
    search,
    statusFilter,
    serviceFilter,
    urgencyFilter,
  ]);

  const pageCount = Math.max(
    1,
    Math.ceil(
      filteredRequests.length / ROWS_PER_PAGE
    )
  );

  const paginatedRequests =
    filteredRequests.slice(
      (page - 1) * ROWS_PER_PAGE,
      page * ROWS_PER_PAGE
    );

  useEffect(() => {
    setPage(1);
  }, [
    search,
    statusFilter,
    serviceFilter,
    urgencyFilter,
  ]);

  async function openRequest(requestId) {
    try {
      setErrorDetails("");

      setSelectedCustomer(null);
      setLoadingDetails(true);

      const request = await getRequest(requestId);

      setSelectedRequest(request);

      if (request.customer_id) {
        const customer = await getCustomer(
          request.customer_id
        );

        setSelectedCustomer(customer);
      }
    } catch (err) {
      setErrorDetails(
        err.message ||
          "Failed to load request details."
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  const [detailsError, setDetailsError] =
    useState("");

  function setErrorDetails(message) {
    setDetailsError(message);
  }

  function closeDrawer() {
    setSelectedRequest(null);
    setSelectedCustomer(null);
    setDetailsError("");
  }

  if (loading && requests.length === 0) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Requests"
        description="Search, filter and inspect FlowFix service requests."
      />

      {error && (
        <ErrorState
          message={error}
          onRetry={loadRequests}
        />
      )}

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
        }}
      >
        <Stack
          direction={{
            xs: "column",
            md: "row",
          }}
          spacing={2}
        >
          <TextField
            fullWidth
            label="Search"
            placeholder="Request ID, issue or service"
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
          />

          <FormControl
            sx={{ minWidth: 190 }}
          >
            <InputLabel>Status</InputLabel>

            <Select
              value={statusFilter}
              label="Status"
              onChange={(event) =>
                setStatusFilter(
                  event.target.value
                )
              }
            >
              <MenuItem value="all">
                All statuses
              </MenuItem>

              {statuses.map((status) => (
                <MenuItem
                  key={status}
                  value={status}
                >
                  {formatLabel(status)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            sx={{ minWidth: 190 }}
          >
            <InputLabel>Service</InputLabel>

            <Select
              value={serviceFilter}
              label="Service"
              onChange={(event) =>
                setServiceFilter(
                  event.target.value
                )
              }
            >
              <MenuItem value="all">
                All services
              </MenuItem>

              {services.map((service) => (
                <MenuItem
                  key={service}
                  value={service}
                >
                  {service}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl
            sx={{ minWidth: 160 }}
          >
            <InputLabel>Urgency</InputLabel>

            <Select
              value={urgencyFilter}
              label="Urgency"
              onChange={(event) =>
                setUrgencyFilter(
                  event.target.value
                )
              }
            >
              <MenuItem value="all">
                All urgencies
              </MenuItem>

              {urgencies.map((urgency) => (
                <MenuItem
                  key={urgency}
                  value={urgency}
                >
                  {formatLabel(urgency)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Showing {filteredRequests.length} of{" "}
          {requests.length} requests
        </Typography>
      </Box>

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Request</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Urgency</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{ p: 0 }}
                  >
                    <EmptyState
                      message="No requests match the current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                paginatedRequests.map((request) => (
                  <TableRow
                    key={request.request_id}
                    hover
                    onClick={() =>
                      openRequest(
                        request.request_id
                      )
                    }
                    sx={{
                      cursor: "pointer",
                    }}
                  >
                    <TableCell>
                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {request.request_id.slice(
                          0,
                          8
                        )}
                        ...
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {request.issue || "—"}
                    </TableCell>

                    <TableCell>
                      {request.service || "—"}
                    </TableCell>

                    <TableCell>
                      {request.urgency ? (
  <Chip
    label={formatLabel(
      request.urgency
    )}
    size="small"
    color={
      request.urgency === "high"
        ? "error"
        : request.urgency === "normal"
          ? "primary"
          : "default"
    }
    variant={
      request.urgency === "high"
        ? "filled"
        : "outlined"
    }
  />
) : (
  "—"
)}
                    </TableCell>

                    <TableCell>
                      {request.preferred_date ||
                        "—"}
                    </TableCell>

                    <TableCell>
                      <StatusChip
                        status={request.status}
                      />
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {pageCount > 1 && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "flex-end",
              p: 2,
            }}
          >
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) =>
                setPage(value)
              }
              color="primary"
            />
          </Box>
        )}
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(selectedRequest)}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: {
              xs: "100%",
              sm: 520,
            },
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          {loadingDetails ? (
            <LoadingState />
          ) : selectedRequest ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  gutterBottom
                >
                  Request Details
                </Typography>

                <StatusChip
                  status={
                    selectedRequest.status
                  }
                  size="medium"
                />
              </Box>

              {detailsError && (
                <ErrorState
                  message={detailsError}
                />
              )}

              <Stack
                spacing={2.5}
                divider={<Divider />}
              >
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Request ID
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{
                      wordBreak:
                        "break-all",
                    }}
                  >
                    {selectedRequest.request_id}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Customer
                  </Typography>

                  {selectedCustomer ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                      >
                        {selectedCustomer.name}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {selectedCustomer.phone}
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {selectedCustomer.address}
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      Customer information unavailable
                    </Typography>
                  )}
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Original Message
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{ mt: 0.5 }}
                  >
                    {selectedRequest.message ||
                      "—"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Issue
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{ mt: 0.5 }}
                  >
                    {selectedRequest.issue ||
                      "—"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Service
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{ mt: 0.5 }}
                  >
                    {selectedRequest.service ||
                      "—"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Urgency
                  </Typography>

                  <Box sx={{ mt: 0.5 }}>
                    <Chip
                      label={
                        selectedRequest.urgency
                          ? formatLabel(
                              selectedRequest.urgency
                            )
                          : "Not specified"
                      }
                      size="small"
                    />
                  </Box>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Preferred Appointment
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{ mt: 0.5 }}
                  >
                    {selectedRequest
                      .preferred_date || "—"}
                    {" • "}
                    {selectedRequest
                      .preferred_time || "—"}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Appointment
                  </Typography>

                  {selectedRequest.appointment ? (
                    <Paper
                      variant="outlined"
                      sx={{
                        mt: 1,
                        p: 2,
                        borderRadius: 2,
                      }}
                    >
                      <Stack spacing={1}>
                        <Box
                          sx={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "center",
                            gap: 2,
                          }}
                        >
                          <Typography
                            fontWeight={700}
                          >
                            Appointment #
                            {
                              selectedRequest
                                .appointment
                                .id
                            }
                          </Typography>

                          <StatusChip
                            status={
                              selectedRequest
                                .appointment
                                .status
                            }
                          />
                        </Box>

                        <Typography variant="body2">
                          Technician #
                          {
                            selectedRequest
                              .appointment
                              .technician_id
                          }
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {
                            selectedRequest
                              .appointment
                              .appointment_date
                          }
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {
                            selectedRequest
                              .appointment
                              .start_time
                          }{" "}
                          –{" "}
                          {
                            selectedRequest
                              .appointment
                              .end_time
                          }
                        </Typography>
                      </Stack>
                    </Paper>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.5 }}
                    >
                      No appointment has been scheduled.
                    </Typography>
                  )}
                </Box>
              </Stack>
            </>
          ) : null}
        </Box>
      </Drawer>
    </Box>
  );
}

export default Requests;