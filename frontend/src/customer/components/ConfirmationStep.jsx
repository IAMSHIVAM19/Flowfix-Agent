import {
  CalendarMonth,
  Check,
  Person,
  Schedule,
} from "@mui/icons-material";

import {
  Box,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import {
  motion,
} from "framer-motion";

const MotionBox = motion.create(Box);

function formatDate(dateString) {
  if (!dateString) {
    return "Confirmed";
  }

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  ).format(date);
}

function formatTime(timeString) {
  if (!timeString) {
    return "";
  }

  const [hours, minutes] =
    timeString.split(":");

  const date = new Date();

  date.setHours(
    Number(hours),
    Number(minutes),
    0,
    0
  );

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(date);
}

function ConfirmationStep({
  appointment,
  message,
}) {
  const date = formatDate(
    appointment?.appointment_date
  );

  const start = formatTime(
    appointment?.start_time
  );

  const end = formatTime(
    appointment?.end_time
  );

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
      }}
    >
      <Stack
        spacing={3.5}
        sx={{
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Success mark */}
        <MotionBox
          initial={{
            opacity: 0,
            scale: 0.72,
          }}
          animate={{
            opacity: 1,
            scale: 1,
          }}
          transition={{
            duration: 0.5,
            ease: [0.22, 1, 0.36, 1],
          }}
          sx={{
            position: "relative",
            width: 92,
            height: 92,
          }}
        >
          {/* Soft glow */}
          <MotionBox
            animate={{
              scale: [1, 1.12, 1],
              opacity: [0.18, 0.28, 0.18],
            }}
            transition={{
              duration: 2.4,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            sx={{
              position: "absolute",
              inset: -12,
              borderRadius: "50%",
              background:
                "rgba(22,163,74,0.18)",
              filter: "blur(16px)",
            }}
          />

          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: "30px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "linear-gradient(135deg, #16A34A, #22C55E)",
              color: "#fff",
              boxShadow:
                "0 18px 40px rgba(22,163,74,0.20)",
            }}
          >
            <Check
              sx={{
                fontSize: 52,
              }}
            />
          </Box>
        </MotionBox>

        {/* Heading */}
        <MotionBox
          initial={{
            opacity: 0,
            y: 10,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.12,
            duration: 0.4,
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontSize: {
                xs: "2.4rem",
                sm: "3.4rem",
              },
              letterSpacing: "-0.045em",
            }}
          >
            You're booked.
          </Typography>

          <Typography
            color="text.secondary"
            sx={{
              mt: 1,
              maxWidth: 560,
              mx: "auto",
            }}
          >
            {message ||
              "Your FlowFix appointment has been confirmed."}
          </Typography>
        </MotionBox>

        {/* Booking card */}
        <MotionBox
          initial={{
            opacity: 0,
            y: 16,
          }}
          animate={{
            opacity: 1,
            y: 0,
          }}
          transition={{
            delay: 0.22,
            duration: 0.45,
            ease: [0.22, 1, 0.36, 1],
          }}
          sx={{
            width: "100%",
          }}
        >
          <Box
            sx={{
              width: "100%",
              p: {
                xs: 2.5,
                sm: 3.5,
              },
              borderRadius: "28px",
              textAlign: "left",

              background:
                "rgba(255,255,255,0.78)",

              border:
                "1px solid rgba(255,255,255,0.78)",

              backdropFilter:
                "blur(20px)",

              boxShadow:
                "0 22px 60px rgba(15,23,42,0.09)",
            }}
          >
            <Stack spacing={2.5}>
              {/* Status */}
              <Box>
                <Chip
                  label="Confirmed"
                  color="success"
                  size="small"
                  sx={{
                    fontWeight: 700,
                    borderRadius: 999,
                  }}
                />
              </Box>

              {/* Date */}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "rgba(37,99,235,0.08)",
                    color: "primary.main",
                    flexShrink: 0,
                  }}
                >
                  <CalendarMonth />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Date
                  </Typography>

                  <Typography
                    variant="body1"
                    fontWeight={700}
                  >
                    {date}
                  </Typography>
                </Box>
              </Stack>

              {/* Time */}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "rgba(20,184,166,0.08)",
                    color: "secondary.main",
                    flexShrink: 0,
                  }}
                >
                  <Schedule />
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Time
                  </Typography>

                  <Typography
                    variant="body1"
                    fontWeight={700}
                  >
                    {start} – {end}
                  </Typography>
                </Box>
              </Stack>

              {/* Technician */}
              <Stack
                direction="row"
                spacing={2}
                sx={{
                  alignItems: "center",
                }}
              >
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: "15px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(20,184,166,0.10))",
                    color: "primary.main",
                    fontWeight: 800,
                    flexShrink: 0,
                  }}
                >
                  {appointment?.technician_name
                    ?.charAt(0)
                    .toUpperCase()}
                </Box>

                <Box>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                  >
                    Technician
                  </Typography>

                  <Typography
                    variant="body1"
                    fontWeight={700}
                  >
                    {appointment?.technician_name ||
                      "FlowFix technician"}
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </Box>
        </MotionBox>

        <Typography
          variant="body2"
          color="text.secondary"
          sx={{
            maxWidth: 520,
          }}
        >
          We'll use the contact details you provided
          for appointment communication.
        </Typography>
      </Stack>
    </Box>
  );
}

export default ConfirmationStep;