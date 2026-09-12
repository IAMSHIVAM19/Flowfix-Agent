import { createTheme } from "@mui/material/styles";

const technicianTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#38BDF8",
      dark: "#0284C7",
      light: "#7DD3FC",
      contrastText: "#0F172A",
    },
    secondary: {
      main: "#2DD4BF",
      dark: "#0D9488",
      light: "#5EEAD4",
      contrastText: "#0F172A",
    },
    background: {
      default: "#0F172A",
      paper: "#1E293B",
    },
    text: {
      primary: "#F8FAFC",
      secondary: "#94A3B8",
    },
    error: {
      main: "#EF4444",
      light: "#F87171",
      dark: "#DC2626",
    },
    success: {
      main: "#10B981",
      light: "#34D399",
      dark: "#059669",
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    button: {
      textTransform: "none",
      fontWeight: 700,
    },
  },
  shape: {
    borderRadius: 14,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: "#1E293B",
          color: "#F8FAFC",
          backgroundImage: "none",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1E293B",
          color: "#F8FAFC",
          borderRadius: 20,
          backgroundImage: "none",
          border: "1px solid rgba(255, 255, 255, 0.12)",
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          backgroundColor: "#1E293B",
          color: "#F8FAFC",
          borderRadius: 14,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          backgroundImage: "none",
          boxShadow: "0 12px 36px rgba(0, 0, 0, 0.6)",
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          color: "#F8FAFC",
          fontSize: "0.88rem",
          fontWeight: 600,
          padding: "10px 16px",
          "&:hover": {
            backgroundColor: "rgba(56, 189, 248, 0.15)",
          },
          "&.Mui-selected": {
            backgroundColor: "rgba(56, 189, 248, 0.22)",
            color: "#38BDF8",
            fontWeight: 700,
            "&:hover": {
              backgroundColor: "rgba(56, 189, 248, 0.3)",
            },
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          color: "#94A3B8",
          "&.Mui-focused": {
            color: "#38BDF8",
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          color: "#F8FAFC",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          borderRadius: 12,
          "& fieldset": {
            borderColor: "rgba(255, 255, 255, 0.2)",
          },
          "&:hover fieldset": {
            borderColor: "rgba(255, 255, 255, 0.35)",
          },
          "&.Mui-focused fieldset": {
            borderColor: "#38BDF8",
            borderWidth: "1.5px",
          },
        },
        input: {
          color: "#F8FAFC",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        select: {
          color: "#F8FAFC",
        },
        icon: {
          color: "#94A3B8",
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
          fontWeight: 700,
          textTransform: "none",
          transition: "all 0.18s ease-in-out",
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.18)",
          backgroundColor: "rgba(255, 255, 255, 0.05)",
          color: "#F8FAFC",
          "&:hover": {
            borderColor: "rgba(56, 189, 248, 0.5)",
            backgroundColor: "rgba(56, 189, 248, 0.12)",
            color: "#38BDF8",
          },
        },
        outlinedError: {
          borderColor: "rgba(239, 68, 68, 0.35)",
          backgroundColor: "rgba(239, 68, 68, 0.1)",
          color: "#F87171",
          "&:hover": {
            borderColor: "#EF4444",
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            color: "#EF4444",
          },
        },
      },
    },
  },
});

export default technicianTheme;
