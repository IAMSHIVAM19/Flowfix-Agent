import {
  Box,
  ThemeProvider,
} from "@mui/material";

import customerTheme from "../customerTheme";
import AnimatedBackground from "./AnimatedBackground";

import "../customer.css";

function PortalShell({
  children,
}) {
  return (
    <ThemeProvider theme={customerTheme}>
      <Box
        className="customer-portal"
        sx={{
          position: "relative",
          minHeight: "100vh",
          overflow: "hidden",
        }}
      >
        <AnimatedBackground />

        <Box
          sx={{
            position: "relative",
            zIndex: 1,
            minHeight: "100vh",
          }}
        >
          <Box className="customer-shell">
            <Box className="customer-content">
              {children}
            </Box>
          </Box>
        </Box>
      </Box>
    </ThemeProvider>
  );
}

export default PortalShell;