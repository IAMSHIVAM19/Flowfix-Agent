import {
  useEffect,
  useMemo,
  useState,
} from "react";

import StatusChip from "../components/StatusChip";
import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
import useApi from "../hooks/useApi";

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
  Typography,
} from "@mui/material";

import {
  getDashboardSummary,
  getDashboardNotifications,
  updateNotificationStatus,
  getRequests,
  getAppointments,
  getTechnicians,
} from "../services/api";


function Overview() {
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


  const [notifications, setNotifications] =
    useState([]);


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
    setNotifications(
      notificationData || []
    );
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


  async function handleAcknowledgeNotification(
    notificationId
  ) {
    try {
      const updated =
        await updateNotificationStatus(
          notificationId,
          "acknowledged"
        );

      setNotifications((current) =>
        current.map((notification) =>
          notification.id === updated.id
            ? updated
            : notification
        )
      );
    } catch (error) {
      console.error(
        "Failed to acknowledge notification:",
        error
      );
    }
  }


  const recentRequests = useMemo(() => {
    return requests.slice(0, 5);
  }, [requests]);


  const highPriorityRequests = useMemo(() => {
    return requests.filter(
      (request) =>
        request.urgency === "high"
    );
  }, [requests]);


  const highPriorityNotifications = useMemo(() => {
    return notifications.filter(
      (notification) =>
        notification.notification_type ===
          "high_priority_request" &&
        notification.status !== "acknowledged"
    );
  }, [notifications]);


  const upcomingAppointments = useMemo(() => {
    return [...appointments]
      .sort((a, b) => {
        const first =
          `${a.appointment_date} ${a.start_time}`;

        const second =
          `${b.appointment_date} ${b.start_time}`;

        return first.localeCompare(second);
      })
      .slice(0, 5);
  }, [appointments]);


  const maxWorkload = Math.max(
    ...technicians.map(
      (technician) =>
        technician.appointments.length
    ),
    1
  );


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


  return (
    <Box>

      <PageHeader
        title="Overview"
        description="Monitor FlowFix operations at a glance."
      />


      {/* High-priority request alert */}
      {highPriorityRequests.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            p: 2.5,
            borderColor: "error.light",
            backgroundColor:
              "rgba(254,242,242,0.75)",
          }}
        >
          <Stack
            direction={{
              xs: "column",
              sm: "row",
            }}
            spacing={2}
            sx={{
              justifyContent:
                "space-between",
              alignItems: {
                xs: "flex-start",
                sm: "center",
              },
            }}
          >

            <Box>
              <Typography
                variant="h6"
                fontWeight={700}
                color="error.main"
              >
                High-priority requests
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                {highPriorityRequests.length}{" "}
                high-priority{" "}
                {highPriorityRequests.length === 1
                  ? "request requires"
                  : "requests require"}{" "}
                attention.
              </Typography>
            </Box>

            <Chip
              label={`${highPriorityRequests.length} High`}
              color="error"
              size="small"
              sx={{
                fontWeight: 700,
              }}
            />

          </Stack>
        </Paper>
      )}


      {/* Notification alert */}
      {highPriorityNotifications.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            mb: 3,
            p: 2.5,
            borderColor: "warning.light",
            backgroundColor:
              "rgba(255,247,237,0.85)",
          }}
        >
          <Stack spacing={1.5}>

            <Box
              sx={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Admin notifications
              </Typography>

              <Chip
                label={`${highPriorityNotifications.length} new`}
                color="warning"
                size="small"
                sx={{
                  fontWeight: 700,
                }}
              />
            </Box>


            <Stack spacing={1}>
              {highPriorityNotifications
                .slice(0, 3)
                .map((notification) => (
                  <Box
                    key={notification.id}
                    sx={{
                      p: 1.5,
                      borderRadius: 2,
                      backgroundColor:
                        "rgba(255,255,255,0.75)",
                      border: 1,
                      borderColor:
                        "rgba(245,158,11,0.20)",
                    }}
                  >

                    <Typography
                      variant="body2"
                      fontWeight={600}
                    >
                      {notification.message}
                    </Typography>


                    <Stack
                      direction={{
                        xs: "column",
                        sm: "row",
                      }}
                      spacing={1.5}
                      sx={{
                        mt: 0.75,
                        alignItems: {
                          xs: "flex-start",
                          sm: "center",
                        },
                        justifyContent:
                          "space-between",
                      }}
                    >

                      <Typography
                        variant="caption"
                        color="text.secondary"
                      >
                        Request #
                        {notification.service_request_id ??
                          "—"}
                      </Typography>


                      {notification.status ===
                      "acknowledged" ? (
                        <Chip
                          label="Acknowledged"
                          color="success"
                          size="small"
                          sx={{
                            fontWeight: 700,
                          }}
                        />
                      ) : (
                        <Button
                          size="small"
                          variant="outlined"
                          color="warning"
                          onClick={() =>
                            handleAcknowledgeNotification(
                              notification.id
                            )
                          }
                        >
                          Acknowledge
                        </Button>
                      )}

                    </Stack>

                  </Box>
                ))}
            </Stack>

          </Stack>
        </Paper>
      )}


      {error && (
        <ErrorState
          message={error}
          onRetry={loadOverview}
        />
      )}


      {/* KPI cards */}
      <Grid
        container
        spacing={2}
        sx={{ mb: 3 }}
      >

        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2.4,
          }}
        >
          <Card
            variant="outlined"
            sx={{ height: "100%" }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Total Requests
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {summary?.total_requests ?? 0}
              </Typography>

            </CardContent>
          </Card>
        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2.4,
          }}
        >
          <Card
            variant="outlined"
            sx={{ height: "100%" }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Awaiting Information
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {summary?.awaiting_information ?? 0}
              </Typography>

            </CardContent>
          </Card>
        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2.4,
          }}
        >
          <Card
            variant="outlined"
            sx={{ height: "100%" }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                No Availability
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {summary?.no_availability ?? 0}
              </Typography>

            </CardContent>
          </Card>
        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2.4,
          }}
        >
          <Card
            variant="outlined"
            sx={{ height: "100%" }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Awaiting Selection
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                sx={{ mt: 1 }}
              >
                {
                  summary?.awaiting_appointment_selection ??
                  0
                }
              </Typography>

            </CardContent>
          </Card>
        </Grid>


        <Grid
          size={{
            xs: 12,
            sm: 6,
            md: 4,
            lg: 2.4,
          }}
        >
          <Card
            variant="outlined"
            sx={{ height: "100%" }}
          >
            <CardContent>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Confirmed
              </Typography>

              <Typography
                variant="h4"
                fontWeight={700}
                color="success.main"
                sx={{ mt: 1 }}
              >
                {summary?.confirmed ?? 0}
              </Typography>

            </CardContent>
          </Card>
        </Grid>

      </Grid>


      {/* Recent requests + upcoming appointments */}
      <Grid
        container
        spacing={3}
        sx={{ mb: 3 }}
      >

        {/* Recent Requests */}
        <Grid
          size={{
            xs: 12,
            lg: 7,
          }}
        >
          <Paper
            variant="outlined"
            sx={{ height: "100%" }}
          >

            <Box
              sx={{
                p: 2.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Recent Requests
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Latest requests entering FlowFix.
              </Typography>
            </Box>


            <TableContainer>
              <Table size="small">

                <TableHead>
                  <TableRow>
                    <TableCell>Request</TableCell>
                    <TableCell>Issue</TableCell>
                    <TableCell>Service</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>


                <TableBody>
                  {recentRequests.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={4}
                        sx={{ p: 0 }}
                      >
                        <EmptyState
                          message="No recent requests found."
                        />
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentRequests.map((request) => (
                      <TableRow
                        key={request.request_id}
                        hover
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

          </Paper>
        </Grid>


        {/* Upcoming appointments */}
        <Grid
          size={{
            xs: 12,
            lg: 5,
          }}
        >
          <Paper
            variant="outlined"
            sx={{ height: "100%" }}
          >

            <Box
              sx={{
                p: 2.5,
                borderBottom: 1,
                borderColor: "divider",
              }}
            >
              <Typography
                variant="h6"
                fontWeight={700}
              >
                Upcoming Appointments
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                Next scheduled service appointments.
              </Typography>
            </Box>


            <Box sx={{ p: 2.5 }}>
              {upcomingAppointments.length === 0 ? (
                <EmptyState
                  message="No upcoming appointments."
                />
              ) : (
                <Stack spacing={2}>

                  {upcomingAppointments.map(
                    (appointment) => (
                      <Box
                        key={appointment.id}
                        sx={{
                          p: 1.5,
                          border: 1,
                          borderColor:
                            "divider",
                          borderRadius: 2,
                        }}
                      >

                        <Box
                          sx={{
                            display: "flex",
                            justifyContent:
                              "space-between",
                            alignItems:
                              "flex-start",
                            gap: 2,
                            mb: 0.5,
                          }}
                        >

                          <Typography
                            variant="body2"
                            fontWeight={700}
                          >
                            Appointment #
                            {appointment.id}
                          </Typography>

                          <StatusChip
                            status={
                              appointment.status
                            }
                          />

                        </Box>


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


                        <Typography
                          variant="body2"
                          sx={{ mt: 1 }}
                        >
                          {
                            appointment
                              .technician?.name ||
                            "Unassigned"
                          }
                        </Typography>


                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          {
                            appointment
                              .customer?.name ||
                            "Unknown customer"
                          }
                        </Typography>

                      </Box>
                    )
                  )}

                </Stack>
              )}
            </Box>

          </Paper>
        </Grid>

      </Grid>


      {/* Technician workload */}
      <Paper variant="outlined">

        <Box
          sx={{
            p: 2.5,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
          >
            Technician Workload
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Current appointment load across technicians.
          </Typography>
        </Box>


        <Box sx={{ p: 2.5 }}>

          {technicians.length === 0 ? (
            <EmptyState
              message="No technician data available."
            />
          ) : (
            <Stack spacing={2.5}>

              {technicians.map((technician) => {
                const workload =
                  technician.appointments.length;

                const percentage =
                  (workload / maxWorkload) * 100;

                return (
                  <Box key={technician.id}>

                    <Box
                      sx={{
                        display: "flex",
                        justifyContent:
                          "space-between",
                        mb: 0.75,
                      }}
                    >

                      <Box>
                        <Typography
                          variant="body2"
                          fontWeight={700}
                        >
                          {technician.name}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {technician.services.join(
                            " • "
                          )}
                        </Typography>
                      </Box>


                      <Typography
                        variant="body2"
                        fontWeight={600}
                      >
                        {workload}{" "}
                        {workload === 1
                          ? "appointment"
                          : "appointments"}
                      </Typography>

                    </Box>


                    <LinearProgress
                      variant="determinate"
                      value={percentage}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                      }}
                    />

                  </Box>
                );
              })}

            </Stack>
          )}

        </Box>
      </Paper>

    </Box>
  );
}

export default Overview;