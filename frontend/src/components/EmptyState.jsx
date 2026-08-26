import { Box, Typography } from "@mui/material";

function EmptyState({
  message = "No data found.",
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 180,
        px: 2,
      }}
    >
      <Typography
        color="text.secondary"
        align="center"
      >
        {message}
      </Typography>
    </Box>
  );
}

export default EmptyState;