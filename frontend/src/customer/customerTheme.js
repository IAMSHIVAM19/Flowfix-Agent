import { createTheme } from "@mui/material/styles";

const customerTheme = createTheme({
  palette: {
    mode: "light",

    primary: {
      main: "#2563EB",
      dark: "#1D4ED8",
      light: "#60A5FA",
      contrastText: "#FFFFFF",
    },

    secondary: {
      main: "#14B8A6",
      dark: "#0F766E",
      light: "#5EEAD4",
      contrastText: "#FFFFFF",
    },

    background: {
      default: "#F7F9FC",
      paper: "#FFFFFF",
    },

    text: {
      primary: "#0F172A",
      secondary: "#64748B",
    },

    success: {
      main: "#16A34A",
    },

    error: {
      main: "#DC2626",
    },
  },

  typography: {
    fontFamily:
      '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',

    h1: {
      fontWeight: 800,
      letterSpacing: "-0.04em",
      lineHeight: 1.05,
    },

    h2: {
      fontWeight: 800,
      letterSpacing: "-0.035em",
      lineHeight: 1.1,
    },

    h3: {
      fontWeight: 750,
      letterSpacing: "-0.03em",
    },

    h4: {
      fontWeight: 750,
      letterSpacing: "-0.025em",
    },

    h5: {
      fontWeight: 700,
      letterSpacing: "-0.02em",
    },

    h6: {
      fontWeight: 700,
    },

    body1: {
      fontSize: "1rem",
      lineHeight: 1.65,
    },

    body2: {
      lineHeight: 1.55,
    },

    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },

  shape: {
    borderRadius: 20,
  },

  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          minHeight: 52,
          borderRadius: 16,
          paddingLeft: 22,
          paddingRight: 22,
          fontSize: "0.98rem",
        },

        containedPrimary: {
          boxShadow:
            "0 10px 24px rgba(37, 99, 235, 0.22)",

          "&:hover": {
            boxShadow:
              "0 14px 30px rgba(37, 99, 235, 0.28)",
          },
        },
      },
    },

    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },

      styleOverrides: {
        root: {
          "& .MuiOutlinedInput-root": {
            borderRadius: 16,
            minHeight: 56,
            backgroundColor: "#FFFFFF",

            "& fieldset": {
              borderColor: "#E2E8F0",
            },

            "&:hover fieldset": {
              borderColor: "#CBD5E1",
            },

            "&.Mui-focused fieldset": {
              borderWidth: 2,
            },
          },
        },
      },
    },

    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },

    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 24,
        },
      },
    },
  },
});

export default customerTheme;
