import { Alert, Box } from "@mui/material";

function ErrorState({ message }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Alert severity="error">
        {message || "Something went wrong."}
      </Alert>
    </Box>
  );
}

export default ErrorState;