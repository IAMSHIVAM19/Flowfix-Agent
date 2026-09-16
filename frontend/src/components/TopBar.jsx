import { useState, useEffect } from "react";
import {
  AppBar,
  Badge,
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Popover,
  Stack,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import {
  Notifications,
  OpenInNew,
  Search,
  CheckCircle,
  Person,
  Logout,
  SmartToy,
  Tune,
  Menu as MenuIcon,
} from "@mui/icons-material";
import { useNavigate, useLocation } from "react-router-dom";
import { getDashboardNotifications, updateNotificationStatus } from "../services/api";

const drawerWidth = 260;

function TopBar({ onMobileMenuToggle, currentAdmin, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [notifications, setNotifications] = useState([]);
  const [notificationAnchor, setNotificationAnchor] = useState(null);
  const [userMenuAnchor, setUserMenuAnchor] = useState(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Derive active section name
  const pageTitles = {
    "/": "Operations Command Center",
    "/overview": "Operations Command Center",
    "/admin": "Operations Command Center",
    "/requests": "Service Requests",
    "/appointments": "Dispatch & Appointments",
    "/technicians": "Technician Fleet",
    "/customers": "Customer CRM",
    "/agent": "FlowFix AI Copilot",
    "/settings": "System Administration",
  };
  const currentTitle = pageTitles[location.pathname] || "Operations";

  async function loadNotifications() {
    try {
      setLoadingNotifications(true);
      const data = await getDashboardNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications in TopBar:", err);
    } finally {
      setLoadingNotifications(false);
    }
  }

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // Polling every 15s for live updates
    return () => clearInterval(interval);
  }, []);

  const unacknowledgedCount = notifications.filter(
    (n) => n.status !== "acknowledged"
  ).length;

  async function handleAcknowledge(id, e) {
    e.stopPropagation();
    try {
      await updateNotificationStatus(id, "acknowledged");
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: "acknowledged" } : n))
      );
    } catch (err) {
      console.error("Failed to acknowledge notification:", err);
    }
  }

  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={0}
      sx={{
        width: { sm: `calc(100% - ${drawerWidth}px)` },
        ml: { sm: `${drawerWidth}px` },
        backgroundColor: "rgba(255, 255, 255, 0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid #E2E8F0",
        zIndex: (theme) => theme.zIndex.drawer + 1,
      }}
    >
      <Toolbar sx={{ justifyContent: "space-between", minHeight: 64, px: { xs: 2, sm: 3 } }}>
        {/* Left Side: Mobile toggle + Page Title + Status */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          <IconButton
            color="inherit"
            edge="start"
            onClick={onMobileMenuToggle}
            sx={{ mr: 1, display: { sm: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box>
            <Typography variant="h6" fontWeight={750} sx={{ letterSpacing: "-0.02em", color: "#0F172A", fontSize: "1.1rem" }}>
              {currentTitle}
            </Typography>
          </Box>

          <Box sx={{ display: { xs: "none", md: "flex" }, alignItems: "center", ml: 2 }}>
            <Chip
              size="small"
              icon={<Box component="span" className="pulse-dot-green" sx={{ ml: 1, mr: 0.5 }} />}
              label="Live Operations"
              sx={{
                height: 24,
                fontSize: "0.72rem",
                fontWeight: 650,
                backgroundColor: "rgba(16, 185, 129, 0.08)",
                color: "#047857",
                border: "1px solid rgba(16, 185, 129, 0.2)",
              }}
            />
          </Box>
        </Stack>

        {/* Right Side Actions */}
        <Stack direction="row" spacing={1.5} alignItems="center">
          {/* Quick link to Live Customer Portal */}
          <Tooltip title="Open the customer booking flow in a new view">
            <Button
              variant="outlined"
              size="small"
              endIcon={<OpenInNew sx={{ fontSize: "16px !important" }} />}
              onClick={() => window.open("/customer-portal", "_blank")}
              sx={{
                display: { xs: "none", sm: "inline-flex" },
                borderRadius: 999,
                fontSize: "0.8rem",
                py: 0.5,
                px: 1.75,
                borderColor: "#E2E8F0",
                color: "#334155",
                fontWeight: 600,
                "&:hover": {
                  borderColor: "#2563EB",
                  color: "#2563EB",
                  backgroundColor: "rgba(37, 99, 235, 0.04)",
                },
              }}
            >
              Customer Portal
            </Button>
          </Tooltip>

          {/* AI Copilot Quick Button */}
          <Tooltip title="Ask FlowFix AI Agent">
            <IconButton
              size="small"
              onClick={() => navigate("/agent")}
              sx={{
                border: "1px solid #E2E8F0",
                backgroundColor: location.pathname === "/agent" ? "rgba(37, 99, 235, 0.08)" : "#FFFFFF",
                color: location.pathname === "/agent" ? "#2563EB" : "#64748B",
                p: 1,
                "&:hover": {
                  backgroundColor: "#F8FAFC",
                  color: "#2563EB",
                },
              }}
            >
              <SmartToy fontSize="small" />
            </IconButton>
          </Tooltip>

          {/* Notifications Dropdown */}
          <Tooltip title="Notifications">
            <IconButton
              size="small"
              onClick={(e) => setNotificationAnchor(e.currentTarget)}
              sx={{
                border: "1px solid #E2E8F0",
                backgroundColor: "#FFFFFF",
                color: unacknowledgedCount > 0 ? "#F59E0B" : "#64748B",
                p: 1,
                "&:hover": { backgroundColor: "#F8FAFC" },
              }}
            >
              <Badge badgeContent={unacknowledgedCount} color="error" max={99}>
                <Notifications fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* User Profile Menu */}
          <Box
            onClick={(e) => setUserMenuAnchor(e.currentTarget)}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              pl: 1,
              pr: 1.5,
              py: 0.5,
              borderRadius: 999,
              border: "1px solid #E2E8F0",
              cursor: "pointer",
              backgroundColor: "#FFFFFF",
              transition: "all 0.15s ease",
              "&:hover": { backgroundColor: "#F8FAFC" },
            }}
          >
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                background: "linear-gradient(135deg, #2563EB, #0D9488)",
                color: "#FFFFFF",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.75rem",
                fontWeight: 750,
              }}
            >
              {(currentAdmin?.username || "A").charAt(0).toUpperCase()}
            </Box>
            <Typography variant="body2" fontWeight={650} sx={{ display: { xs: "none", md: "block" } }}>
              {currentAdmin?.username || "Admin"}
            </Typography>
          </Box>
        </Stack>
      </Toolbar>

      {/* Notifications Popover */}
      <Popover
        open={Boolean(notificationAnchor)}
        anchorEl={notificationAnchor}
        onClose={() => setNotificationAnchor(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{
          paper: {
            sx: {
              width: 360,
              maxHeight: 440,
              borderRadius: 3,
              boxShadow: "0 20px 40px -10px rgba(15, 23, 42, 0.15)",
              border: "1px solid #E2E8F0",
              mt: 1,
            },
          },
        }}
      >
        <Box sx={{ p: 2, display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #E2E8F0" }}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle2" fontWeight={750}>
              Notifications
            </Typography>
            {unacknowledgedCount > 0 && (
              <Chip label={`${unacknowledgedCount} new`} size="small" color="warning" sx={{ height: 20, fontSize: "0.7rem", fontWeight: 700 }} />
            )}
          </Stack>
          <IconButton size="small" onClick={loadNotifications}>
            {loadingNotifications ? <CircularProgress size={16} /> : <Tune fontSize="small" />}
          </IconButton>
        </Box>

        <Box sx={{ maxHeight: 360, overflowY: "auto" }}>
          {notifications.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary">
                No notifications right now.
              </Typography>
            </Box>
          ) : (
            notifications.map((item) => (
              <Box
                key={item.id}
                sx={{
                  p: 2,
                  borderBottom: "1px solid #F1F5F9",
                  backgroundColor: item.status === "acknowledged" ? "transparent" : "rgba(245, 158, 11, 0.04)",
                  transition: "background-color 0.15s ease",
                  "&:hover": { backgroundColor: "#F8FAFC" },
                }}
              >
                <Stack spacing={0.75}>
                  <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
                    <Typography variant="body2" fontWeight={item.status === "acknowledged" ? 500 : 700} sx={{ color: "#0F172A", fontSize: "0.85rem" }}>
                      {item.message}
                    </Typography>
                    {item.status !== "acknowledged" && (
                      <Box component="span" className="pulse-dot-red" sx={{ mt: 0.5, flexShrink: 0 }} />
                    )}
                  </Stack>

                  <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {item.service_request_id ? `Request #${item.service_request_id}` : "System Alert"}
                    </Typography>

                    {item.status === "acknowledged" ? (
                      <Stack direction="row" spacing={0.5} alignItems="center" sx={{ color: "#10B981" }}>
                        <CheckCircle sx={{ fontSize: 14 }} />
                        <Typography variant="caption" fontWeight={650}>
                          Done
                        </Typography>
                      </Stack>
                    ) : (
                      <Button
                        size="small"
                        variant="text"
                        onClick={(e) => handleAcknowledge(item.id, e)}
                        sx={{ fontSize: "0.72rem", py: 0, px: 1, minHeight: 24, fontWeight: 700, color: "#2563EB" }}
                      >
                        Acknowledge
                      </Button>
                    )}
                  </Stack>
                </Stack>
              </Box>
            ))
          )}
        </Box>
      </Popover>

      {/* User Profile Menu */}
      <Menu
        anchorEl={userMenuAnchor}
        open={Boolean(userMenuAnchor)}
        onClose={() => setUserMenuAnchor(null)}
        slotProps={{
          paper: {
            sx: {
              width: 200,
              borderRadius: 3,
              mt: 1,
              boxShadow: "0 15px 30px -5px rgba(15, 23, 42, 0.1)",
              border: "1px solid #E2E8F0",
            },
          },
        }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={750}>
            {currentAdmin?.username || "Admin"}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: "capitalize" }}>
            {currentAdmin?.role || "admin"} Access
          </Typography>
        </Box>
        <Divider />
        <MenuItem onClick={() => { setUserMenuAnchor(null); navigate("/settings"); }}>
          <Person fontSize="small" sx={{ mr: 1.5, color: "#64748B" }} />
          Admin Settings
        </MenuItem>
        <MenuItem onClick={() => { setUserMenuAnchor(null); window.open("/customer-portal", "_blank"); }}>
          <OpenInNew fontSize="small" sx={{ mr: 1.5, color: "#64748B" }} />
          Customer Portal
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => { setUserMenuAnchor(null); onLogout?.(); }} sx={{ color: "#EF4444" }}>
          <Logout fontSize="small" sx={{ mr: 1.5 }} />
          Sign Out
        </MenuItem>
      </Menu>
    </AppBar>
  );
}

export default TopBar;