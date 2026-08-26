import {
  Box,
  CircularProgress,
} from "@mui/material";

function LoadingState() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        minHeight: 300,
      }}
    >
      <CircularProgress />
    </Box>
  );
}

export default LoadingState;
