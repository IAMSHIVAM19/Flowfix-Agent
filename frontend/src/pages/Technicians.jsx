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
  Paper,
  Stack,
  Typography,
} from "@mui/material";

import {
  getTechnicians,
  getTechnicianAvailability,
} from "../services/api";

function Technicians() {
  const {
    data: technicianData,
    loading,
    error,
    execute: loadTechnicians,
  } = useApi(getTechnicians);

  const technicians = technicianData || [];

  const [selectedTechnician, setSelectedTechnician] =
    useState(null);

  const [availability, setAvailability] =
    useState([]);

  const [loadingAvailability, setLoadingAvailability] =
    useState(false);

  const [availabilityError, setAvailabilityError] =
    useState("");

  useEffect(() => {
    loadTechnicians();
  }, [loadTechnicians]);

  const technicianCount = technicians.length;

  const totalAppointments = useMemo(() => {
    return technicians.reduce(
      (total, technician) =>
        total + technician.appointments.length,
      0
    );
  }, [technicians]);

  async function openTechnician(technician) {
    try {
      setAvailabilityError("");
      setLoadingAvailability(true);

      setSelectedTechnician(technician);

      const data =
        await getTechnicianAvailability(
          technician.id
        );

      setAvailability(data.availability || []);
    } catch (err) {
      setAvailabilityError(
        err.message ||
          "Failed to load technician availability."
      );
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

  async function retryAvailability() {
    if (!selectedTechnician) {
      return;
    }

    await openTechnician(selectedTechnician);
  }

  if (loading && technicians.length === 0) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="Technicians"
        description="Monitor technician skills, workload and availability."
      />

      {error && (
        <ErrorState
          message={error}
          onRetry={loadTechnicians}
        />
      )}

      {/* Summary */}
      <Stack
        direction={{
          xs: "column",
          sm: "row",
        }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            minWidth: 220,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Total Technicians
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ mt: 1 }}
          >
            {technicianCount}
          </Typography>
        </Paper>

        <Paper
          variant="outlined"
          sx={{
            p: 2.5,
            minWidth: 220,
          }}
        >
          <Typography
            variant="body2"
            color="text.secondary"
          >
            Scheduled Appointments
          </Typography>

          <Typography
            variant="h4"
            fontWeight={700}
            sx={{ mt: 1 }}
          >
            {totalAppointments}
          </Typography>
        </Paper>
      </Stack>

      {/* Technician cards */}
      {technicians.length === 0 ? (
        <Paper variant="outlined">
          <EmptyState message="No technicians found." />
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {technicians.map((technician) => (
            <Paper
              key={technician.id}
              variant="outlined"
              onClick={() =>
                openTechnician(technician)
              }
              sx={{
                p: 2.5,
                cursor: "pointer",
                transition:
                  "border-color 0.15s ease, box-shadow 0.15s ease",
                "&:hover": {
                  borderColor: "primary.main",
                  boxShadow: 2,
                },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                  mb: 2,
                }}
              >
                <Box>
                  <Typography
                    variant="h6"
                    fontWeight={700}
                  >
                    {technician.name}
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    Technician #{technician.id}
                  </Typography>
                </Box>

                <Chip
                  label={`${technician.appointments.length} ${
                    technician.appointments.length ===
                    1
                      ? "appointment"
                      : "appointments"
                  }`}
                  size="small"
                />
              </Box>

              <Divider sx={{ mb: 2 }} />

              {/* Services */}
              <Box sx={{ mb: 2 }}>
                <Typography
                  variant="overline"
                  color="text.secondary"
                >
                  Services
                </Typography>

                {technician.services.length > 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: 0.75,
                      mt: 0.5,
                    }}
                  >
                    {technician.services.map(
                      (service) => (
                        <Chip
                          key={service}
                          label={service}
                          size="small"
                          variant="outlined"
                        />
                      )
                    )}
                  </Box>
                ) : (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    No services assigned.
                  </Typography>
                )}
              </Box>

              {/* Appointments */}
              <Box>
                <Typography
                  variant="overline"
                  color="text.secondary"
                >
                  Upcoming Appointments
                </Typography>

                {technician.appointments.length ===
                0 ? (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ mt: 0.5 }}
                  >
                    No scheduled appointments.
                  </Typography>
                ) : (
                  <Stack
                    spacing={1}
                    sx={{ mt: 0.75 }}
                  >
                    {technician.appointments
                      .slice(0, 3)
                      .map((appointment) => (
                        <Box
                          key={appointment.id}
                          sx={{
                            p: 1.25,
                            borderRadius: 1.5,
                            backgroundColor:
                              "action.hover",
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems:
                                "center",
                              gap: 1,
                            }}
                          >
                            <Box>
                              <Typography
                                variant="body2"
                                fontWeight={600}
                              >
                                {
                                  appointment.appointment_date
                                }
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                {
                                  appointment.start_time
                                }{" "}
                                –{" "}
                                {
                                  appointment.end_time
                                }
                              </Typography>
                            </Box>

                            <StatusChip
                              status={
                                appointment.status
                              }
                            />
                          </Box>
                        </Box>
                      ))}
                  </Stack>
                )}
              </Box>
            </Paper>
          ))}
        </Box>
      )}

      {/* Technician detail drawer */}
      <Drawer
        anchor="right"
        open={Boolean(selectedTechnician)}
        onClose={closeDrawer}
        PaperProps={{
          sx: {
            width: {
              xs: "100%",
              sm: 500,
            },
          },
        }}
      >
        <Box sx={{ p: 3 }}>
          {selectedTechnician && (
            <>
              <Box sx={{ mb: 3 }}>
                <Typography
                  variant="h5"
                  fontWeight={700}
                  gutterBottom
                >
                  {selectedTechnician.name}
                </Typography>

                <Typography
                  variant="body2"
                  color="text.secondary"
                >
                  Technician #{selectedTechnician.id}
                </Typography>
              </Box>

              <Stack
                spacing={2.5}
                divider={<Divider />}
              >
                {/* Services */}
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Services
                  </Typography>

                  {selectedTechnician.services
                    .length > 0 ? (
                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 0.75,
                        mt: 0.75,
                      }}
                    >
                      {selectedTechnician.services.map(
                        (service) => (
                          <Chip
                            key={service}
                            label={service}
                            size="small"
                          />
                        )
                      )}
                    </Box>
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mt: 0.75 }}
                    >
                      No services assigned.
                    </Typography>
                  )}
                </Box>

                {/* Workload */}
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Current Workload
                  </Typography>

                  <Typography
                    variant="h5"
                    fontWeight={700}
                    sx={{ mt: 0.5 }}
                  >
                    {
                      selectedTechnician
                        .appointments.length
                    }
                  </Typography>

                  <Typography
                    variant="body2"
                    color="text.secondary"
                  >
                    scheduled appointments
                  </Typography>
                </Box>

                {/* Scheduled appointments */}
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Scheduled Appointments
                  </Typography>

                  {selectedTechnician.appointments
                    .length === 0 ? (
                    <EmptyState
                      message="No scheduled appointments."
                    />
                  ) : (
                    <Stack
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      {selectedTechnician.appointments.map(
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
                                  {
                                    appointment.start_time
                                  }{" "}
                                  –{" "}
                                  {
                                    appointment.end_time
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
                  )}
                </Box>

                {/* Availability */}
                <Box>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                  >
                    Availability
                  </Typography>

                  {loadingAvailability ? (
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "center",
                        py: 3,
                      }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : availabilityError ? (
                    <Box sx={{ mt: 1 }}>
                      <ErrorState
                        message={availabilityError}
                        onRetry={retryAvailability}
                      />
                    </Box>
                  ) : availability.length === 0 ? (
                    <EmptyState
                      message="No availability found."
                    />
                  ) : (
                    <Stack
                      spacing={1}
                      sx={{ mt: 1 }}
                    >
                      {availability.map(
                        (slot) => (
                          <Paper
                            key={slot.id}
                            variant="outlined"
                            sx={{ p: 1.5 }}
                          >
                            <Typography
                              fontWeight={600}
                            >
                              {slot.available_date}
                            </Typography>

                            <Typography
                              variant="body2"
                              color="text.secondary"
                            >
                              {slot.start_time}{" "}
                              –{" "}
                              {slot.end_time}
                            </Typography>
                          </Paper>
                        )
                      )}
                    </Stack>
                  )}
                </Box>
              </Stack>
            </>
          )}
        </Box>
      </Drawer>
    </Box>
  );
}

export default Technicians;