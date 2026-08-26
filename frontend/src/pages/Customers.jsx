import { useEffect, useMemo, useState } from "react";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import useApi from "../hooks/useApi";

import {
  Box,
  CircularProgress,
  Divider,
  Drawer,
  Paper,
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

  const [selectedCustomer, setSelectedCustomer] =
    useState(null);

  const [loadingDetails, setLoadingDetails] =
    useState(false);

  const [detailsError, setDetailsError] =
    useState("");

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const filteredCustomers = useMemo(() => {
    const normalizedSearch =
      search.trim().toLowerCase();

    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) => {
      return (
        (customer.name || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (customer.phone || "")
          .toLowerCase()
          .includes(normalizedSearch) ||
        (customer.address || "")
          .toLowerCase()
          .includes(normalizedSearch)
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
      setDetailsError(
        err.message ||
          "Failed to load customer details."
      );
    } finally {
      setLoadingDetails(false);
    }
  }

  function closeDrawer() {
    setSelectedCustomer(null);
    setDetailsError("");
  }

  if (loading && customers.length === 0) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Customers"
        description="Search customers and review their service history."
      />

      {error && (
        <ErrorState
          message={error}
          onRetry={loadCustomers}
        />
      )}

      <Paper
        variant="outlined"
        sx={{
          p: 2,
          mb: 3,
        }}
      >
        <TextField
          fullWidth
          label="Search customers"
          placeholder="Name, phone or address"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
        />
      </Paper>

      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Showing {filteredCustomers.length} of{" "}
          {customers.length} customers
        </Typography>
      </Box>

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Customer</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Address</TableCell>
                <TableCell>Requests</TableCell>
                <TableCell>Appointments</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredCustomers.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    sx={{ p: 0 }}
                  >
                    <EmptyState
                      message="No customers match the current search."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    hover
                    onClick={() =>
                      openCustomer(customer.id)
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
                        {customer.name}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {customer.phone}
                    </TableCell>

                    <TableCell>
                      {customer.address}
                    </TableCell>

                    <TableCell>
                      {customer.request_count}
                    </TableCell>

                    <TableCell>
                      {customer.appointment_count}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(selectedCustomer)}
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
          ) : selectedCustomer ? (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  gutterBottom
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

              {detailsError && (
                <ErrorState
                  message={detailsError}
                  onRetry={() =>
                    openCustomer(
                      selectedCustomer.id
                    )
                  }
                />
              )}

              <Stack
                spacing={2.5}
                divider={<Divider />}
              >
                {/* Request history */}
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Request History
                  </Typography>

                  {selectedCustomer.requests?.length >
                  0 ? (
                    <Stack
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      {selectedCustomer.requests.map(
                        (request) => (
                          <Paper
                            key={request.id}
                            variant="outlined"
                            sx={{ p: 1.5 }}
                          >
                            <Typography
                              fontWeight={600}
                            >
                              {request.issue ||
                                "Service request"}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {request.service ||
                                "No service specified"}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {request.preferred_date ||
                                "—"}{" "}
                              •{" "}
                              {request.preferred_time ||
                                "—"}
                            </Typography>

                            <Box sx={{ mt: 1 }}>
                              <StatusChip
                                status={
                                  request.status
                                }
                              />
                            </Box>
                          </Paper>
                        )
                      )}
                    </Stack>
                  ) : (
                    <EmptyState
                      message="No requests found for this customer."
                    />
                  )}
                </Box>

                {/* Appointment history */}
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Appointment History
                  </Typography>

                  {selectedCustomer.appointments
                    ?.length > 0 ? (
                    <Stack
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      {selectedCustomer.appointments.map(
                        (appointment) => (
                          <Paper
                            key={appointment.id}
                            variant="outlined"
                            sx={{ p: 1.5 }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                justifyContent:
                                  "space-between",
                                alignItems:
                                  "flex-start",
                                gap: 1,
                              }}
                            >
                              <Box>
                                <Typography
                                  fontWeight={600}
                                >
                                  Appointment #
                                  {appointment.id}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {
                                    appointment.appointment_date
                                  }
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  {appointment.start_time}{" "}
                                  –{" "}
                                  {appointment.end_time}
                                </Typography>

                                <Typography
                                  variant="body2"
                                  color="text.secondary"
                                >
                                  Technician #
                                  {
                                    appointment.technician_id
                                  }
                                </Typography>
                              </Box>

                              <StatusChip
                                status={
                                  appointment.status
                                }
                              />
                            </Box>
                          </Paper>
                        )
                      )}
                    </Stack>
                  ) : (
                    <EmptyState
                      message="No appointments found for this customer."
                    />
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

export default Customers;