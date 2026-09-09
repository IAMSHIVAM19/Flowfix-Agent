import React from "react";
import { Box, Button, Paper, Typography, Alert } from "@mui/material";
import { Refresh, WarningAmber } from "@mui/icons-material";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box
          sx={{
            minHeight: "60vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            p: 3,
          }}
        >
          <Paper
            elevation={0}
            sx={{
              maxWidth: 550,
              width: "100%",
              p: 4,
              borderRadius: "16px",
              border: "1px solid #FCA5A5",
              backgroundColor: "#FEF2F2",
              textAlign: "center",
            }}
          >
            <Box
              sx={{
                width: 54,
                height: 54,
                borderRadius: "50%",
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#DC2626",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                mx: "auto",
                mb: 2,
              }}
            >
              <WarningAmber sx={{ fontSize: 32 }} />
            </Box>

            <Typography variant="h6" fontWeight={750} color="#991B1B" gutterBottom>
              Something went wrong loading this view
            </Typography>

            <Typography variant="body2" color="#7F1D1D" sx={{ mb: 2.5 }}>
              A client-side error occurred while rendering this component.
            </Typography>

            {this.state.error?.message && (
              <Alert severity="error" sx={{ mb: 3, textAlign: "left", fontSize: "0.85rem" }}>
                {this.state.error.message}
              </Alert>
            )}

            <Button
              variant="contained"
              startIcon={<Refresh />}
              onClick={this.handleReload}
              sx={{
                backgroundColor: "#DC2626",
                "&:hover": { backgroundColor: "#B91C1C" },
                borderRadius: "10px",
                textTransform: "none",
                fontWeight: 650,
                px: 3,
              }}
            >
              Reload Page
            </Button>
          </Paper>
        </Box>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
