import { useEffect, useMemo, useState } from "react";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import useApi from "../hooks/useApi";

import {
  Box,
  Divider,
  Drawer,
  FormControl,
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
  Typography,
} from "@mui/material";

import { getAppointments } from "../services/api";

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

function Appointments() {
  const {
    data: appointmentData,
    loading,
    error,
    execute: loadAppointments,
  } = useApi(getAppointments);

  const appointments = appointmentData || [];

  const [statusFilter, setStatusFilter] =
    useState("all");

  const [technicianFilter, setTechnicianFilter] =
    useState("all");

  const [selectedAppointment, setSelectedAppointment] =
    useState(null);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const technicians = useMemo(() => {
    return [
      ...new Map(
        appointments
          .filter(
            (appointment) =>
              appointment.technician
          )
          .map((appointment) => [
            appointment.technician.id,
            appointment.technician,
          ])
      ).values(),
    ].sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [appointments]);

  const statuses = useMemo(() => {
    return [
      ...new Set(
        appointments
          .map(
            (appointment) =>
              appointment.status
          )
          .filter(Boolean)
      ),
    ].sort();
  }, [appointments]);

  const filteredAppointments = useMemo(() => {
    return appointments
      .filter((appointment) => {
        const matchesStatus =
          statusFilter === "all" ||
          appointment.status === statusFilter;

        const matchesTechnician =
          technicianFilter === "all" ||
          String(
            appointment.technician?.id
          ) === String(technicianFilter);

        return (
          matchesStatus &&
          matchesTechnician
        );
      })
      .sort((a, b) => {
        const first =
          `${a.appointment_date} ${a.start_time}`;

        const second =
          `${b.appointment_date} ${b.start_time}`;

        return first.localeCompare(second);
      });
  }, [
    appointments,
    statusFilter,
    technicianFilter,
  ]);

  if (loading && appointments.length === 0) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Appointments"
        description="View and monitor scheduled FlowFix appointments."
      />

      {error && (
        <ErrorState
          message={error}
          onRetry={loadAppointments}
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
            sm: "row",
          }}
          spacing={2}
        >
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
            sx={{ minWidth: 220 }}
          >
            <InputLabel>
              Technician
            </InputLabel>

            <Select
              value={technicianFilter}
              label="Technician"
              onChange={(event) =>
                setTechnicianFilter(
                  event.target.value
                )
              }
            >
              <MenuItem value="all">
                All technicians
              </MenuItem>

              {technicians.map(
                (technician) => (
                  <MenuItem
                    key={technician.id}
                    value={String(
                      technician.id
                    )}
                  >
                    {technician.name}
                  </MenuItem>
                )
              )}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Box sx={{ mb: 1.5 }}>
        <Typography
          variant="body2"
          color="text.secondary"
        >
          Showing{" "}
          {filteredAppointments.length} of{" "}
          {appointments.length} appointments
        </Typography>
      </Box>

      <Paper variant="outlined">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Time</TableCell>
                <TableCell>Technician</TableCell>
                <TableCell>Customer</TableCell>
                <TableCell>Service</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {filteredAppointments.length ===
              0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    sx={{ p: 0 }}
                  >
                    <EmptyState
                      message="No appointments match the current filters."
                    />
                  </TableCell>
                </TableRow>
              ) : (
                filteredAppointments.map(
                  (appointment) => (
                    <TableRow
                      key={appointment.id}
                      hover
                      sx={{
                        cursor: "pointer",
                      }}
                      onClick={() =>
                        setSelectedAppointment(
                          appointment
                        )
                      }
                    >
                      <TableCell>
                        {
                          appointment.appointment_date
                        }
                      </TableCell>

                      <TableCell>
                        {
                          appointment.start_time
                        }{" "}
                        –{" "}
                        {
                          appointment.end_time
                        }
                      </TableCell>

                      <TableCell>
                        {
                          appointment.technician
                            ?.name || "—"
                        }
                      </TableCell>

                      <TableCell>
                        {
                          appointment.customer
                            ?.name || "—"
                        }
                      </TableCell>

                      <TableCell>
                        {appointment.service ||
                          "—"}
                      </TableCell>

                      <TableCell>
                        <StatusChip
                          status={
                            appointment.status
                          }
                        />
                      </TableCell>
                    </TableRow>
                  )
                )
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Drawer
        anchor="right"
        open={Boolean(
          selectedAppointment
        )}
        onClose={() =>
          setSelectedAppointment(null)
        }
        PaperProps={{
          sx: {
            width: {
              xs: "100%",
              sm: 480,
            },
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          {selectedAppointment && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  gutterBottom
                >
                  Appointment Details
                </Typography>

                <StatusChip
                  status={
                    selectedAppointment.status
                  }
                  size="medium"
                />
              </Box>

              <Stack
                spacing={2.5}
                divider={<Divider />}
              >
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Appointment
                  </Typography>

                  <Typography
                    variant="body1"
                    sx={{ mt: 0.5 }}
                  >
                    #{selectedAppointment.id}
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Customer
                  </Typography>

                  {selectedAppointment.customer ? (
                    <Box sx={{ mt: 0.5 }}>
                      <Typography
                        fontWeight={700}
                      >
                        {
                          selectedAppointment
                            .customer.name
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          selectedAppointment
                            .customer.phone
                        }
                      </Typography>

                      <Typography
                        variant="body2"
                        color="text.secondary"
                      >
                        {
                          selectedAppointment
                            .customer.address
                        }
                      </Typography>
                    </Box>
                  ) : (
                    <Typography
                      color="text.secondary"
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
                    Technician
                  </Typography>

                  <Typography
                    fontWeight={600}
                    sx={{ mt: 0.5 }}
                  >
                    {
                      selectedAppointment
                        .technician?.name ||
                      "Unassigned"
                    }
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
                    sx={{ mt: 0.5 }}
                  >
                    {
                      selectedAppointment.service ||
                      "—"
                    }
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
                    sx={{ mt: 0.5 }}
                  >
                    {
                      selectedAppointment.issue ||
                      "—"
                    }
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Schedule
                  </Typography>

                  <Typography
                    sx={{ mt: 0.5 }}
                  >
                    {
                      selectedAppointment
                        .appointment_date
                    }
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    {
                      selectedAppointment
                        .start_time
                    }{" "}
                    –{" "}
                    {
                      selectedAppointment
                        .end_time
                    }
                  </Typography>
                </Box>

                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Request
                  </Typography>

                  <Typography
                    variant="body2"
                    sx={{
                      wordBreak:
                        "break-all",
                      mt: 0.5,
                    }}
                  >
                    {
                      selectedAppointment
                        .request_id
                    }
                  </Typography>
                </Box>
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

export default Appointments;