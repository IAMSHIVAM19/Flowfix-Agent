import {
  ArrowRight,
  Check,
  Verified,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  Stack,
  Typography,
} from "@mui/material";

import { motion } from "framer-motion";

const MotionBox = motion.create(Box);

function formatDate(dateString) {
  if (!dateString) return "";

  const date = new Date(
    `${dateString}T00:00:00`
  );

  return new Intl.DateTimeFormat(
    "en-AU",
    {
      weekday: "long",
      day: "numeric",
      month: "long",
    }
  ).format(date);
}

function formatTime(timeString) {
  if (!timeString) return "";

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

function AppointmentCard({
  option,
  selected,
  onSelect,
  disabled,
  recommended = false,
}) {
  const date = formatDate(
    option.appointment_date
  );

  const start = formatTime(
    option.start_time
  );

  const end = formatTime(
    option.end_time
  );

  return (
    <MotionBox
      layout
      whileHover={
        !disabled && !selected
          ? {
              y: -4,
            }
          : undefined
      }
      animate={{
        scale: selected ? 1.015 : 1,
      }}
      transition={{
        duration: 0.22,
        ease: [0.22, 1, 0.36, 1],
      }}
      sx={{
        position: "relative",
        height: "100%",
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: "100%",
          display: "flex",
          flexDirection: "column",

          borderRadius: "26px",

          border: "2px solid",

          borderColor: selected
            ? "primary.main"
            : recommended
              ? "rgba(37,99,235,0.22)"
              : "rgba(148,163,184,0.16)",

          backgroundColor: selected
            ? "rgba(255,255,255,0.90)"
            : "rgba(255,255,255,0.78)",

          backdropFilter:
            "blur(18px)",

          boxShadow: selected
            ? "0 24px 60px rgba(37,99,235,0.16), 0 0 0 1px rgba(20,184,166,0.08)"
            : "0 12px 32px rgba(15,23,42,0.06)",

          overflow: "hidden",

          transition:
            "border-color 180ms ease, box-shadow 180ms ease, background-color 180ms ease",
        }}
      >
        {/* Selected glow */}
        {selected && (
          <Box
            sx={{
              position: "absolute",
              top: -80,
              right: -80,
              width: 180,
              height: 180,
              borderRadius: "50%",
              background:
                "rgba(37,99,235,0.10)",
              filter: "blur(40px)",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Accent line */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: selected ? 4 : 2,
            background: selected
              ? "linear-gradient(90deg, #2563EB, #14B8A6)"
              : recommended
                ? "rgba(37,99,235,0.14)"
                : "transparent",
            transition:
              "all 180ms ease",
          }}
        />

        <Stack
          spacing={2.5}
          sx={{
            p: {
              xs: 2.5,
              sm: 3,
            },
            height: "100%",
            position: "relative",
            zIndex: 1,
          }}
        >
          {/* Badges */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 24,
            }}
          >
            {recommended ? (
              <Chip
                icon={<Verified />}
                label="Recommended"
                size="small"
                sx={{
                  borderRadius: 999,
                  fontWeight: 700,
                  color: "primary.main",
                  backgroundColor:
                    "rgba(37,99,235,0.08)",

                  "& .MuiChip-icon": {
                    color: "primary.main",
                  },
                }}
              />
            ) : (
              <Box />
            )}

            {selected && (
              <MotionBox
                initial={{
                  opacity: 0,
                  scale: 0.8,
                }}
                animate={{
                  opacity: 1,
                  scale: 1,
                }}
              >
                <Chip
                  icon={<Check />}
                  label="Selected"
                  size="small"
                  color="primary"
                  sx={{
                    borderRadius: 999,
                    fontWeight: 700,
                  }}
                />
              </MotionBox>
            )}
          </Box>

          {/* Date/time */}
          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
            >
              {date}
            </Typography>

            <Typography
              variant="h4"
              fontWeight={800}
              sx={{
                mt: 0.4,
                letterSpacing:
                  "-0.025em",
              }}
            >
              {start} – {end}
            </Typography>
          </Box>

          {/* Technician */}
          <Stack
            direction="row"
            spacing={1.5}
            sx={{
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: "14px",

                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                background:
                  "linear-gradient(135deg, rgba(37,99,235,0.12), rgba(20,184,166,0.12))",

                color: "primary.main",

                fontWeight: 800,
              }}
            >
              {option.technician_name
                ?.charAt(0)
                .toUpperCase()}
            </Box>

            <Box>
              <Typography
                variant="body1"
                fontWeight={700}
              >
                {option.technician_name}
              </Typography>

              <Typography
                variant="body2"
                color="text.secondary"
              >
                FlowFix technician
              </Typography>
            </Box>
          </Stack>

          <Box sx={{ flexGrow: 1 }} />

          {/* Action */}
          <Button
            fullWidth
            variant={
              selected
                ? "contained"
                : "outlined"
            }
            endIcon={
              selected ? (
                <Check />
              ) : (
                <ArrowRight />
              )
            }
            disabled={disabled}
            onClick={() =>
              onSelect(option)
            }
            sx={{
              minHeight: 50,
              borderRadius: "15px",

              boxShadow: selected
                ? "0 10px 24px rgba(37,99,235,0.18)"
                : "none",
            }}
          >
            {selected
              ? "Selected"
              : "Choose this time"}
          </Button>
        </Stack>
      </Box>
    </MotionBox>
  );
}

export default AppointmentCard;