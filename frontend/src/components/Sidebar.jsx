import {
  Dashboard,
  Assignment,
  CalendarMonth,
  Engineering,
  People,
  Settings,
  Logout,
} from "@mui/icons-material";

import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import { NavLink } from "react-router-dom";

import { isAdmin } from "../utils/permissions";

const drawerWidth = 240;

const navigation = [
  {
    label: "Overview",
    path: "/",
    icon: <Dashboard />,
  },
  {
    label: "Requests",
    path: "/requests",
    icon: <Assignment />,
  },
  {
    label: "Appointments",
    path: "/appointments",
    icon: <CalendarMonth />,
  },
  {
    label: "Technicians",
    path: "/technicians",
    icon: <Engineering />,
  },
  {
    label: "Customers",
    path: "/customers",
    icon: <People />,
  },
];

function Sidebar({
  onLogout,
  currentAdmin,
}) {
  const adminUser = isAdmin(currentAdmin);

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
        },
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 700,
          }}
        >
          FlowFix
        </Typography>
      </Toolbar>

      <Box
        sx={{
          px: 1,
          display: "flex",
          flexDirection: "column",
          height: "calc(100% - 64px)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            px: 2,
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          Operations
        </Typography>

        <List>
          {navigation.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.active": {
                  backgroundColor:
                    "action.selected",
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>

              <ListItemText
                primary={item.label}
              />
            </ListItemButton>
          ))}
        </List>

        <Typography
          variant="caption"
          sx={{
            px: 2,
            color: "text.secondary",
            textTransform: "uppercase",
          }}
        >
          System
        </Typography>

        <List>
          {adminUser && (
  <ListItemButton
    component={NavLink}
    to="/settings"
    sx={{
      borderRadius: 2,
      mt: 0.5,
      "&.active": {
        backgroundColor:
          "action.selected",
      },
    }}
  >
    <ListItemIcon>
      <Settings />
    </ListItemIcon>

    <ListItemText primary="Settings" />
  </ListItemButton>
)}

          <ListItemButton
            onClick={onLogout}
            sx={{
              borderRadius: 2,
              mt: 0.5,
              color: "error.main",
              "& .MuiListItemIcon-root": {
                color: "error.main",
              },
            }}
          >
            <ListItemIcon>
              <Logout />
            </ListItemIcon>

            <ListItemText
              primary="Logout"
            />
          </ListItemButton>
        </List>

        <Box
          sx={{
            mt: "auto",
            px: 2,
            pb: 2,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            display="block"
          >
            Signed in as
          </Typography>

          <Typography
            variant="body2"
            fontWeight={600}
          >
            {currentAdmin?.username || "Admin"}
          </Typography>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              textTransform: "capitalize",
            }}
          >
            {currentAdmin?.role || "admin"}
          </Typography>
        </Box>
      </Box>
    </Drawer>
  );
}

export default Sidebar;