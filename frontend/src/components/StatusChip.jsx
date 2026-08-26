import { Chip } from "@mui/material";

function formatStatus(status) {
  if (!status) {
    return "Unknown";
  }

  return status
    .split("_")
    .map(
      (word) =>
        word.charAt(0).toUpperCase() +
        word.slice(1)
    )
    .join(" ");
}

function getStatusColor(status) {
  switch (status) {
    case "confirmed":
      return "success";

    case "awaiting_information":
      return "warning";

    case "awaiting_appointment_selection":
      return "info";

    case "no_availability":
      return "error";

    case "received":
      return "default";

    case "awaiting_customer_confirmation":
      return "warning";

    case "cancelled":
      return "error";

    default:
      return "default";
  }
}

function StatusChip({
  status,
  size = "small",
}) {
  return (
    <Chip
      label={formatStatus(status)}
      color={getStatusColor(status)}
      size={size}
    />
  );
}

export default StatusChip;