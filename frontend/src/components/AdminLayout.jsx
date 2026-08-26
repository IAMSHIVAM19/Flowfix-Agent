import { useEffect, useState } from "react";
import { Box, Toolbar } from "@mui/material";
import {
  Outlet,
  useNavigate,
} from "react-router-dom";

import Sidebar from "./Sidebar";
import TopBar from "./TopBar";

import {
  getCurrentAdmin,
  logout,
} from "../services/api";

const drawerWidth = 240;

function AdminLayout() {
  const navigate = useNavigate();

  const [currentAdmin, setCurrentAdmin] =
    useState(null);

  useEffect(() => {
    async function loadCurrentAdmin() {
      try {
        const admin =
          await getCurrentAdmin();

        setCurrentAdmin(admin);
      } catch (error) {
        // The API layer handles 401 redirects.
        console.error(
          "Failed to load admin profile:",
          error
        );
      }
    }

    loadCurrentAdmin();
  }, []);

  function handleLogout() {
    logout();

    navigate("/login", {
      replace: true,
    });
  }

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar
        onLogout={handleLogout}
        currentAdmin={currentAdmin}
      />

      <TopBar />

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          ml: `${drawerWidth}px`,
        }}
      >
        <Toolbar />

        <Outlet />
      </Box>
    </Box>
  );
}

export default AdminLayout;