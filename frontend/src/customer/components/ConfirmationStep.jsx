import {
  CalendarMonth,
  Check,
  Person,
  Schedule,
  LocationOn,
  EventAvailable,
  Replay,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { motion } from "framer-motion";

const MotionBox = motion.create(Box);

function formatDate(dateString) {
  if (!dateString) {
    return "Confirmed";
  }

  const date = new Date(`${dateString}T00:00:00`);

  return new Intl.DateTimeFormat("en-AU", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(timeString) {
  if (!timeString) {
    return "";
  }

  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return new Intl.DateTimeFormat("en-AU", {
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

function generateIcsCalendar(appointment) {
  const dateStr = (appointment?.appointment_date || "").replace(/-/g, "");
  const startTime = (appointment?.start_time || "09:00").replace(":", "") + "00";
  const endTime = (appointment?.end_time || "12:00").replace(":", "") + "00";
  const techName = appointment?.technician_name || "FlowFix Technician";

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//FlowFix//Plumbing Appointment//EN",
    "BEGIN:VEVENT",
    `SUMMARY:FlowFix Plumbing Service with ${techName}`,
    `DESCRIPTION:Confirmed FlowFix appointment. Technician: ${techName}.`,
    `DTSTART:${dateStr}T${startTime}`,
    `DTEND:${dateStr}T${endTime}`,
    "STATUS:CONFIRMED",
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", `flowfix-appointment-${appointment?.appointment_date || "booking"}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function ConfirmationStep({
  appointment,
  message,
  onReset,
}) {
  const date = formatDate(appointment?.appointment_date);
  const start = formatTime(appointment?.start_time);
  const end = formatTime(appointment?.end_time);

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        width: "100%",
      }}
    >
      <Stack
        spacing={3.5}
        sx={{
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Success Animated Mark */}
        <MotionBox
          initial={{ opacity: 0, scale: 0.72 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          sx={{
            position: "relative",
            width: 96,
            height: 96,
          }}
        >
          {/* Subtle Outer Glow */}
          <MotionBox
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.2, 0.35, 0.2],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            sx={{
              position: "absolute",
              inset: -14,
              borderRadius: "50%",
              background: "rgba(16,185,129,0.25)",
              filter: "blur(18px)",
            }}
          />

          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: "32px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #10B981, #059669)",
              color: "#FFFFFF",
              boxShadow: "0 20px 40px rgba(16,185,129,0.25)",
            }}
          >
            <Check sx={{ fontSize: 54 }} />
          </Box>
        </MotionBox>

        {/* Heading */}
        <MotionBox
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12, duration: 0.4 }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: {
                xs: "2.4rem",
                sm: "3.4rem",
              },
              letterSpacing: "-0.045em",
              fontWeight: 850,
              color: "#0F172A",
            }}
          >
            You're All Booked!
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              maxWidth: 560,
              mx: "auto",
              fontSize: "1.05rem",
            }}
          >
            {message || "Your FlowFix technician has been dispatched and scheduled on the operations calendar."}
          </Typography>
        </MotionBox>

        {/* Booking Card */}
        <MotionBox
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          sx={{ width: "100%" }}
        >
          <Box
            sx={{
              width: "100%",
              p: { xs: 3, sm: 4 },
              borderRadius: "28px",
              textAlign: "left",
              background: "rgba(255, 255, 255, 0.9)",
              border: "1px solid rgba(226, 232, 240, 0.9)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.10)",
            }}
          >
            <Stack spacing={3}>
              {/* Header inside card */}
              <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="subtitle2" fontWeight={750} sx={{ color: "#64748B", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Appointment Summary
                </Typography>
                <Chip
                  label="Confirmed & Dispatched"
                  size="small"
                  sx={{
                    backgroundColor: "rgba(16, 185, 129, 0.12)",
                    color: "#047857",
                    border: "1px solid rgba(16, 185, 129, 0.25)",
                    fontWeight: 750,
                  }}
                />
              </Box>

              <Divider />

              {/* Date */}
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(37, 99, 235, 0.08)",
                    color: "#2563EB",
                    flexShrink: 0,
                  }}
                >
                  <CalendarMonth />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Date
                  </Typography>
                  <Typography variant="body1" fontWeight={750} color="#0F172A">
                    {date}
                  </Typography>
                </Box>
              </Stack>

              {/* Time */}
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(13, 148, 136, 0.08)",
                    color: "#0D9488",
                    flexShrink: 0,
                  }}
                >
                  <Schedule />
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Arrival Window
                  </Typography>
                  <Typography variant="body1" fontWeight={750} color="#0F172A">
                    {start} – {end}
                  </Typography>
                </Box>
              </Stack>

              {/* Technician */}
              <Stack direction="row" spacing={2.5} alignItems="center">
                <Box
                  sx={{
                    width: 48,
                    height: 48,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "linear-gradient(135deg, rgba(37, 99, 235, 0.12), rgba(13, 148, 136, 0.12))",
                    color: "#2563EB",
                    fontWeight: 800,
                    fontSize: "1.1rem",
                    flexShrink: 0,
                  }}
                >
                  {appointment?.technician_name?.charAt(0).toUpperCase() || "T"}
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    Assigned Specialist
                  </Typography>
                  <Typography variant="body1" fontWeight={750} color="#0F172A">
                    {appointment?.technician_name || "FlowFix Technician"}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Licensed & Insured Plumbing Professional
                  </Typography>
                </Box>
              </Stack>

              <Divider />

              {/* Actions */}
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  fullWidth
                  variant="contained"
                  startIcon={<EventAvailable />}
                  onClick={() => generateIcsCalendar(appointment)}
                  sx={{
                    borderRadius: "12px",
                    minHeight: 46,
                    fontWeight: 700,
                    boxShadow: "0 8px 20px rgba(37, 99, 235, 0.25)",
                  }}
                >
                  Add to Calendar (.ics)
                </Button>

                {onReset && (
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<Replay />}
                    onClick={onReset}
                    sx={{
                      borderRadius: "12px",
                      minHeight: 46,
                      fontWeight: 650,
                      borderColor: "#CBD5E1",
                      color: "#334155",
                      "&:hover": {
                        borderColor: "#94A3B8",
                        backgroundColor: "rgba(241, 245, 249, 0.6)",
                      },
                    }}
                  >
                    Book Another Service
                  </Button>
                )}
              </Stack>
            </Stack>
          </Box>
        </MotionBox>

        <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 520, opacity: 0.85 }}>
          SMS and confirmation details have been prepared. Our technician will send an ETA notification 30 minutes prior to arrival.
        </Typography>
      </Stack>
    </Box>
  );
}

export default ConfirmationStep;