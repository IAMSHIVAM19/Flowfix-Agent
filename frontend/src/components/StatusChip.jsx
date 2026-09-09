import { Box, Chip } from "@mui/material";

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const statusConfig = {
  confirmed: {
    bg: "rgba(16, 185, 129, 0.10)",
    color: "#047857",
    border: "rgba(16, 185, 129, 0.25)",
    dot: "#10B981",
  },
  awaiting_information: {
    bg: "rgba(245, 158, 11, 0.10)",
    color: "#B45309",
    border: "rgba(245, 158, 11, 0.25)",
    dot: "#F59E0B",
  },
  awaiting_appointment_selection: {
    bg: "rgba(37, 99, 235, 0.10)",
    color: "#1D4ED8",
    border: "rgba(37, 99, 235, 0.25)",
    dot: "#2563EB",
  },
  no_availability: {
    bg: "rgba(239, 68, 68, 0.10)",
    color: "#B91C1C",
    border: "rgba(239, 68, 68, 0.25)",
    dot: "#EF4444",
  },
  received: {
    bg: "rgba(100, 116, 139, 0.10)",
    color: "#475569",
    border: "rgba(100, 116, 139, 0.25)",
    dot: "#64748B",
  },
  awaiting_customer_confirmation: {
    bg: "rgba(245, 158, 11, 0.10)",
    color: "#B45309",
    border: "rgba(245, 158, 11, 0.25)",
    dot: "#F59E0B",
  },
  scheduled: {
    bg: "rgba(13, 148, 136, 0.10)",
    color: "#0F766E",
    border: "rgba(13, 148, 136, 0.25)",
    dot: "#0D9488",
  },
  completed: {
    bg: "rgba(16, 185, 129, 0.10)",
    color: "#047857",
    border: "rgba(16, 185, 129, 0.25)",
    dot: "#10B981",
  },
  cancelled: {
    bg: "rgba(239, 68, 68, 0.10)",
    color: "#B91C1C",
    border: "rgba(239, 68, 68, 0.25)",
    dot: "#EF4444",
  },
};

function StatusChip({
  status,
  size = "small",
  showDot = true,
  sx = {},
}) {
  const normalized = status?.toLowerCase() || "received";
  const config = statusConfig[normalized] || statusConfig.received;

  return (
    <Chip
      size={size}
      label={
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
          {showDot && (
            <Box
              component="span"
              sx={{
                width: 6,
                height: 6,
                borderRadius: "50%",
                backgroundColor: config.dot,
                flexShrink: 0,
              }}
            />
          )}
          <span>{formatStatus(status)}</span>
        </Box>
      }
      sx={{
        backgroundColor: config.bg,
        color: config.color,
        border: `1px solid ${config.border}`,
        fontWeight: 650,
        fontSize: size === "small" ? "0.75rem" : "0.82rem",
        height: size === "small" ? 24 : 28,
        ...sx,
      }}
    />
  );
}

export default StatusChip;