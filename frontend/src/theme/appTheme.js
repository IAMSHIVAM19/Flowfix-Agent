import { createTheme } from "@mui/material/styles";

const appTheme = createTheme({
  palette: {
    mode: "light",
    primary: {
      main: "#2563EB", // Vibrant Sapphire / Royal Blue
      dark: "#1D4ED8",
      light: "#60A5FA",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#0D9488", // Rich Teal
      dark: "#0F766E",
      light: "#2DD4BF",
      contrastText: "#FFFFFF",
    },
    background: {
      default: "#F8FAFC", // Soft neutral slate
      paper: "#FFFFFF",
    },
    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },
    success: {
      main: "#10B981",
      light: "#D1FAE5",
      dark: "#047857",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#F59E0B",
      light: "#FEF3C7",
      dark: "#B45309",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#EF4444",
      light: "#FEE2E2",
      dark: "#B91C1C",
      contrastText: "#FFFFFF",
    },
    info: {
      main: "#0284C7",
      light: "#E0F2FE",
      dark: "#0369A1",
    },
    divider: "#E2E8F0",
  },
  typography: {
    fontFamily:
      '"Inter", system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h1: {
      fontWeight: 800,
      letterSpacing: "-0.04em",
      lineHeight: 1.1,
    },
    h2: {
      fontWeight: 800,
      letterSpacing: "-0.035em",
      lineHeight: 1.15,
    },
    h3: {
      fontWeight: 750,
      letterSpacing: "-0.03em",
      lineHeight: 1.2,
    },
    h4: {
      fontWeight: 700,
      letterSpacing: "-0.025em",
    },
    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },
    h6: {
      fontWeight: 700,
      letterSpacing: "-0.015em",
    },
    subtitle1: {
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
    subtitle2: {
      fontWeight: 600,
      fontSize: "0.875rem",
    },
    body1: {
      fontSize: "0.95rem",
      lineHeight: 1.6,
    },
    body2: {
      fontSize: "0.875rem",
      lineHeight: 1.55,
    },
    caption: {
      fontSize: "0.75rem",
      lineHeight: 1.4,
    },
    button: {
      textTransform: "none",
      fontWeight: 600,
      letterSpacing: "-0.01em",
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: "#F8FAFC",
          color: "#0F172A",
          fontFeatureSettings: '"cv02", "cv03", "cv04", "cv11"',
        },
      },
    },
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          backgroundImage: "none",
          borderRadius: 16,
        },
        outlined: {
          borderColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
        },
      },
    },
    MuiCard: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 16,
          border: "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
          boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04), 0 1px 2px -1px rgba(15, 23, 42, 0.04)",
          transition: "all 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          "&:hover": {
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.06), 0 8px 10px -6px rgba(15, 23, 42, 0.04)",
          },
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          padding: "8px 18px",
          fontWeight: 600,
          transition: "all 0.18s ease-in-out",
        },
        containedPrimary: {
          backgroundColor: "#2563EB",
          boxShadow: "0 4px 14px 0 rgba(37, 99, 235, 0.25)",
          "&:hover": {
            backgroundColor: "#1D4ED8",
            boxShadow: "0 6px 20px 0 rgba(37, 99, 235, 0.35)",
          },
        },
        containedSecondary: {
          backgroundColor: "#0D9488",
          boxShadow: "0 4px 14px 0 rgba(13, 148, 136, 0.25)",
          "&:hover": {
            backgroundColor: "#0F766E",
            boxShadow: "0 6px 20px 0 rgba(13, 148, 136, 0.35)",
          },
        },
        outlined: {
          borderColor: "#E2E8F0",
          backgroundColor: "#FFFFFF",
          color: "#334155",
          "&:hover": {
            borderColor: "#CBD5E1",
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 999,
          fontSize: "0.78rem",
          height: 28,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        variant: "outlined",
        size: "small",
      },
      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 12,
            backgroundColor: "#FFFFFF",
            transition: "all 0.15s ease",
            "& fieldset": {
              borderColor: "#E2E8F0",
            },
            "&:hover fieldset": {
              borderColor: "#CBD5E1",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2563EB",
              borderWidth: "1.5px",
            },
          },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          backgroundColor: "#F8FAFC",
          "& .MuiTableCell-head": {
            color: "#64748B",
            fontWeight: 650,
            fontSize: "0.76rem",
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            borderBottom: "1px solid #E2E8F0",
            padding: "12px 16px",
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #F1F5F9",
          padding: "14px 16px",
          fontSize: "0.875rem",
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          transition: "background-color 0.12s ease",
          "&:hover": {
            backgroundColor: "#F8FAFC",
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: "1px solid #E2E8F0",
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: "#0F172A",
          color: "#FFFFFF",
          fontSize: "0.75rem",
          borderRadius: 8,
          padding: "6px 10px",
        },
      },
    },
  },
});

export default appTheme;
