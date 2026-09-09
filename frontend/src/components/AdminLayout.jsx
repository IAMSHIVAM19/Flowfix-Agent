import { useEffect, useState } from "react";
import { Box, Toolbar } from "@mui/material";
import { Outlet, useNavigate } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import ErrorBoundary from "./ErrorBoundary";
import { getCurrentAdmin, logout } from "../services/api";

const drawerWidth = 260;

function AdminLayout() {
  const navigate = useNavigate();
  const [currentAdmin, setCurrentAdmin] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    async function loadCurrentAdmin() {
      try {
        const admin = await getCurrentAdmin();
        setCurrentAdmin(admin);
      } catch (error) {
        console.error("Failed to load admin profile:", error);
      }
    }

    loadCurrentAdmin();
  }, []);

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  function handleDrawerToggle() {
    setMobileOpen((prev) => !prev);
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", backgroundColor: "#F8FAFC" }}>
      <TopBar
        onMobileMenuToggle={handleDrawerToggle}
        currentAdmin={currentAdmin}
        onLogout={handleLogout}
      />

      <Sidebar
        onLogout={handleLogout}
        currentAdmin={currentAdmin}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, sm: 3, md: 4 },
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          minHeight: "100vh",
          backgroundColor: "#F8FAFC",
        }}
      >
        {/* Spacer for fixed AppBar */}
        <Toolbar sx={{ minHeight: 64 }} />

        <Box sx={{ maxWidth: 1400, mx: "auto" }}>
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </Box>
      </Box>
    </Box>
  );
}

export default AdminLayout;