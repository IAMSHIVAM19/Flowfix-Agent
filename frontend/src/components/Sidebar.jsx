import {
  Dashboard,
  Assignment,
  CalendarMonth,
  Engineering,
  People,
  SmartToy,
  Settings,
  Logout,
  OpenInNew,
  WaterDrop,
  AutoAwesome,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Stack,
  Toolbar,
  Typography,
} from "@mui/material";
import { NavLink, useLocation } from "react-router-dom";
import { isAdmin } from "../utils/permissions";

const drawerWidth = 260;

const mainNavigation = [
  {
    label: "Overview",
    path: "/",
    icon: <Dashboard fontSize="small" />,
    badge: null,
  },
  {
    label: "Requests",
    path: "/requests",
    icon: <Assignment fontSize="small" />,
    badge: "Live",
  },
  {
    label: "Appointments",
    path: "/appointments",
    icon: <CalendarMonth fontSize="small" />,
    badge: null,
  },
  {
    label: "Technicians",
    path: "/technicians",
    icon: <Engineering fontSize="small" />,
    badge: null,
  },
  {
    label: "Customers",
    path: "/customers",
    icon: <People fontSize="small" />,
    badge: null,
  },
];

const aiNavigation = [
  {
    label: "AI Copilot",
    path: "/agent",
    icon: <SmartToy fontSize="small" />,
    badge: "AI",
    isAi: true,
  },
];

function Sidebar({ onLogout, currentAdmin, mobileOpen, onMobileClose }) {
  const adminUser = isAdmin(currentAdmin);
  const location = useLocation();

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#0F172A", // Rich dark slate navy
        color: "#F8FAFC",
      }}
    >
      {/* Brand Header */}
      <Box sx={{ p: 2.5, pb: 2, display: "flex", alignItems: "center", gap: 1.5 }}>
        <Box
          sx={{
            width: 36,
            height: 36,
            borderRadius: "10px",
            background: "linear-gradient(135deg, #2563EB, #0D9488)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#FFFFFF",
            boxShadow: "0 8px 16px -4px rgba(37, 99, 235, 0.4)",
          }}
        >
          <WaterDrop sx={{ fontSize: 20 }} />
        </Box>
        <Box>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: "-0.03em", color: "#FFFFFF", fontSize: "1.15rem", lineHeight: 1 }}>
              FlowFix
            </Typography>
            <Chip
              label="AGENT"
              size="small"
              sx={{
                height: 18,
                fontSize: "0.62rem",
                fontWeight: 800,
                backgroundColor: "rgba(37, 99, 235, 0.25)",
                color: "#60A5FA",
                border: "1px solid rgba(96, 165, 250, 0.3)",
                px: 0.2,
              }}
            />
          </Stack>
          <Typography variant="caption" sx={{ color: "#94A3B8", fontSize: "0.72rem" }}>
            Field Service Automation
          </Typography>
        </Box>
      </Box>

      <Divider sx={{ borderColor: "rgba(255, 255, 255, 0.08)", mb: 2 }} />

      {/* Navigation Links */}
      <Box sx={{ px: 1.5, flexGrow: 1, overflowY: "auto" }}>
        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            color: "#64748B",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.68rem",
            display: "block",
            mb: 1,
          }}
        >
          Operations
        </Typography>

        <List sx={{ p: 0, mb: 2 }}>
          {mainNavigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                onClick={onMobileClose}
                sx={{
                  borderRadius: "10px",
                  mb: 0.5,
                  py: 0.9,
                  px: 1.5,
                  color: isActive ? "#FFFFFF" : "#94A3B8",
                  backgroundColor: isActive ? "rgba(37, 99, 235, 0.18)" : "transparent",
                  borderLeft: isActive ? "3px solid #3B82F6" : "3px solid transparent",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    backgroundColor: "rgba(255, 255, 255, 0.06)",
                    color: "#F8FAFC",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: isActive ? "#60A5FA" : "#64748B",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.88rem",
                    fontWeight: isActive ? 650 : 500,
                  }}
                />
                {item.badge && (
                  <Chip
                    label={item.badge}
                    size="small"
                    sx={{
                      height: 18,
                      fontSize: "0.62rem",
                      fontWeight: 750,
                      backgroundColor: "rgba(16, 185, 129, 0.15)",
                      color: "#34D399",
                      border: "1px solid rgba(52, 211, 153, 0.2)",
                    }}
                  />
                )}
              </ListItemButton>
            );
          })}
        </List>

        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            color: "#64748B",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.68rem",
            display: "block",
            mb: 1,
          }}
        >
          Intelligence
        </Typography>

        <List sx={{ p: 0, mb: 2 }}>
          {aiNavigation.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItemButton
                key={item.path}
                component={NavLink}
                to={item.path}
                onClick={onMobileClose}
                sx={{
                  borderRadius: "10px",
                  mb: 0.5,
                  py: 0.9,
                  px: 1.5,
                  color: isActive ? "#FFFFFF" : "#94A3B8",
                  backgroundColor: isActive
                    ? "rgba(37, 99, 235, 0.18)"
                    : "rgba(37, 99, 235, 0.06)",
                  borderLeft: isActive ? "3px solid #3B82F6" : "3px solid transparent",
                  transition: "all 0.15s ease",
                  "&:hover": {
                    backgroundColor: "rgba(37, 99, 235, 0.14)",
                    color: "#F8FAFC",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 32,
                    color: isActive ? "#60A5FA" : "#38BDF8",
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.label}
                  primaryTypographyProps={{
                    fontSize: "0.88rem",
                    fontWeight: isActive ? 650 : 500,
                  }}
                />
                <Chip
                  icon={<AutoAwesome sx={{ fontSize: "10px !important", color: "#60A5FA !important" }} />}
                  label="Agent"
                  size="small"
                  sx={{
                    height: 18,
                    fontSize: "0.62rem",
                    fontWeight: 750,
                    backgroundColor: "rgba(37, 99, 235, 0.25)",
                    color: "#60A5FA",
                    border: "1px solid rgba(96, 165, 250, 0.3)",
                  }}
                />
              </ListItemButton>
            );
          })}
        </List>

        <Typography
          variant="caption"
          sx={{
            px: 1.5,
            color: "#64748B",
            fontWeight: 700,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            fontSize: "0.68rem",
            display: "block",
            mb: 1,
          }}
        >
          System
        </Typography>

        <List sx={{ p: 0 }}>
          {adminUser && (
            <ListItemButton
              component={NavLink}
              to="/settings"
              onClick={onMobileClose}
              sx={{
                borderRadius: "10px",
                mb: 0.5,
                py: 0.9,
                px: 1.5,
                color: location.pathname === "/settings" ? "#FFFFFF" : "#94A3B8",
                backgroundColor: location.pathname === "/settings" ? "rgba(37, 99, 235, 0.18)" : "transparent",
                borderLeft: location.pathname === "/settings" ? "3px solid #3B82F6" : "3px solid transparent",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 0.06)",
                  color: "#F8FAFC",
                },
              }}
            >
              <ListItemIcon
                sx={{
                  minWidth: 32,
                  color: location.pathname === "/settings" ? "#60A5FA" : "#64748B",
                }}
              >
                <Settings fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary="Settings"
                primaryTypographyProps={{
                  fontSize: "0.88rem",
                  fontWeight: location.pathname === "/settings" ? 650 : 500,
                }}
              />
            </ListItemButton>
          )}

          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: "10px",
              py: 0.9,
              px: 1.5,
              color: "#F87171",
              "&:hover": {
                backgroundColor: "rgba(239, 68, 68, 0.12)",
                color: "#EF4444",
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 32, color: "inherit" }}>
              <Logout fontSize="small" />
            </ListItemIcon>
            <ListItemText
              primary="Logout"
              primaryTypographyProps={{
                fontSize: "0.88rem",
                fontWeight: 600,
              }}
            />
          </ListItemButton>
        </List>
      </Box>

      {/* Live Portals Shortcut Card */}
      <Box sx={{ p: 2, pt: 1 }}>
        <Box
          sx={{
            p: 2,
            borderRadius: "14px",
            backgroundColor: "rgba(255, 255, 255, 0.04)",
            border: "1px solid rgba(255, 255, 255, 0.08)",
          }}
        >
          <Typography variant="caption" sx={{ color: "#94A3B8", display: "block", mb: 0.5 }}>
            Live Platform Portals
          </Typography>
          <Typography variant="body2" fontWeight={650} sx={{ color: "#F8FAFC", mb: 1.5, fontSize: "0.82rem" }}>
            Experience the customer & technician flows
          </Typography>

          <Stack spacing={1}>
            <Button
              fullWidth
              size="small"
              variant="contained"
              endIcon={<OpenInNew sx={{ fontSize: "14px !important", color: "#0F172A !important" }} />}
              onClick={() => window.open("/customer-portal", "_blank")}
              sx={{
                backgroundColor: "#FFFFFF !important",
                color: "#0F172A !important",
                fontWeight: 750,
                fontSize: "0.78rem",
                borderRadius: "10px",
                py: 0.8,
                textTransform: "none",
                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.25)",
                transition: "all 0.15s ease",
                "& .MuiButton-endIcon": {
                  color: "#0F172A !important",
                },
                "&:hover": {
                  backgroundColor: "#F1F5F9 !important",
                  color: "#0F172A !important",
                  boxShadow: "0 4px 14px rgba(0, 0, 0, 0.35)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Customer Portal
            </Button>

            <Button
              fullWidth
              size="small"
              variant="outlined"
              endIcon={<OpenInNew sx={{ fontSize: "14px !important" }} />}
              onClick={() => window.open("/technician-portal", "_blank")}
              sx={{
                borderColor: "rgba(56, 189, 248, 0.4)",
                backgroundColor: "rgba(56, 189, 248, 0.08)",
                color: "#38BDF8",
                fontWeight: 750,
                fontSize: "0.78rem",
                borderRadius: "10px",
                py: 0.8,
                textTransform: "none",
                transition: "all 0.15s ease",
                "&:hover": {
                  borderColor: "#38BDF8",
                  backgroundColor: "rgba(56, 189, 248, 0.16)",
                  transform: "translateY(-1px)",
                },
              }}
            >
              Technician Field Portal
            </Button>
          </Stack>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      {/* Mobile temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onMobileClose}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", sm: "none" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "none",
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: "none", sm: "block" },
          "& .MuiDrawer-paper": {
            boxSizing: "border-box",
            width: drawerWidth,
            borderRight: "none",
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </Box>
  );
}

export default Sidebar;