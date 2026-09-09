import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import {
  PersonAdd,
  Refresh,
} from "@mui/icons-material";

import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import useApi from "../hooks/useApi";

import {
  createAdminUser,
  getAdminUsers,
  updateAdminUserRole,
  updateAdminUserStatus,
} from "../services/api";

function Settings() {
  const {
    data: adminUserData,
    loading,
    error,
    execute: loadAdminUsers,
  } = useApi(getAdminUsers);

  const adminUsers = adminUserData || [];

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("operations");
  const [creating, setCreating] = useState(false);
  const [updatingUserId, setUpdatingUserId] = useState(null);
  const [createError, setCreateError] = useState("");
  const [createSuccess, setCreateSuccess] = useState("");

  useEffect(() => {
    loadAdminUsers();
  }, [loadAdminUsers]);

  async function handleCreateUser(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setCreateSuccess("");

      await createAdminUser(username, password, role);

      setUsername("");
      setPassword("");
      setRole("operations");
      setCreateSuccess("New user created successfully.");

      await loadAdminUsers();
    } catch (err) {
      setCreateError(err.message || "Failed to create user.");
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleUser(user) {
    try {
      setUpdatingUserId(user.id);
      setCreateError("");
      setCreateSuccess("");

      await updateAdminUserStatus(user.id, !user.is_active);
      setCreateSuccess(`${user.username} is now ${user.is_active ? "inactive" : "active"}.`);

      await loadAdminUsers();
    } catch (err) {
      setCreateError(err.message || "Failed to update user status.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  async function handleRoleChange(user, newRole) {
    try {
      setUpdatingUserId(user.id);
      setCreateError("");
      setCreateSuccess("");

      await updateAdminUserRole(user.id, newRole);
      setCreateSuccess(`${user.username}'s role was updated to ${newRole}.`);

      await loadAdminUsers();
    } catch (err) {
      setCreateError(err.message || "Failed to update user role.");
    } finally {
      setUpdatingUserId(null);
    }
  }

  if (loading && adminUsers.length === 0) {
    return <LoadingState />;
  }

  return (
    <Box>
      <PageHeader
        title="System Administration"
        description="Configure operator credentials, system access roles, and platform permissions."
        badge={
          <Chip
            size="small"
            label="Super Admin"
            sx={{ fontWeight: 750, backgroundColor: "rgba(37, 99, 235, 0.08)", color: "#2563EB" }}
          />
        }
        action={
          <Button
            variant="outlined"
            size="small"
            startIcon={<Refresh />}
            onClick={loadAdminUsers}
            sx={{ borderRadius: "10px", borderColor: "#E2E8F0" }}
          >
            Refresh Users
          </Button>
        }
      />

      {error && <ErrorState message={error} onRetry={loadAdminUsers} />}

      <Grid container spacing={3.5}>
        {/* Create User Card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: "20px", height: "100%" }}>
            <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }}>
              <Box
                sx={{
                  width: 36,
                  height: 36,
                  borderRadius: "10px",
                  backgroundColor: "rgba(37, 99, 235, 0.08)",
                  color: "#2563EB",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <PersonAdd fontSize="small" />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#0F172A">
                  Provision User
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Add an operator to the FlowFix portal
                </Typography>
              </Box>
            </Stack>

            {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
            {createSuccess && <Alert severity="success" sx={{ mb: 2 }}>{createSuccess}</Alert>}

            <Box component="form" onSubmit={handleCreateUser}>
              <Stack spacing={2.5}>
                <TextField
                  label="Username"
                  placeholder="e.g. jsmith"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  fullWidth
                />

                <TextField
                  label="Password"
                  type="password"
                  placeholder="At least 8 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  fullWidth
                  helperText="Must be at least 8 characters"
                />

                <FormControl fullWidth size="small">
                  <InputLabel>Permission Role</InputLabel>
                  <Select
                    value={role}
                    label="Permission Role"
                    onChange={(e) => setRole(e.target.value)}
                    sx={{ borderRadius: "12px" }}
                  >
                    <MenuItem value="operations">Operations (Standard Dispatcher)</MenuItem>
                    <MenuItem value="admin">Administrator (Full Access)</MenuItem>
                  </Select>
                </FormControl>

                <Button
                  type="submit"
                  variant="contained"
                  disabled={creating || username.trim().length < 3 || password.length < 8}
                  sx={{ borderRadius: "12px", minHeight: 46 }}
                >
                  {creating ? <CircularProgress size={20} color="inherit" /> : "Create Account"}
                </Button>
              </Stack>
            </Box>
          </Paper>
        </Grid>

        {/* Admin Users Table */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper variant="outlined" sx={{ borderRadius: "20px", overflow: "hidden" }}>
            <Box sx={{ p: 2.5, borderBottom: "1px solid #E2E8F0" }}>
              <Typography variant="h6" fontWeight={800} color="#0F172A">
                Active Staff Accounts
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Review and toggle access permissions
              </Typography>
            </Box>

            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Staff Member</TableCell>
                    <TableCell>Role</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {adminUsers.map((user) => {
                    const isCurrentAdmin = user.username === "admin";
                    const isUpdating = updatingUserId === user.id;

                    return (
                      <TableRow key={user.id} hover>
                        <TableCell>
                          <Stack direction="row" spacing={1.5} alignItems="center">
                            <Box
                              sx={{
                                width: 32,
                                height: 32,
                                borderRadius: "8px",
                                backgroundColor: user.role === "admin" ? "rgba(37, 99, 235, 0.1)" : "rgba(13, 148, 136, 0.1)",
                                color: user.role === "admin" ? "#2563EB" : "#0D9488",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 750,
                                fontSize: "0.8rem",
                              }}
                            >
                              {user.username.charAt(0).toUpperCase()}
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={750} color="#0F172A">
                                {user.username}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                User ID #{user.id}
                              </Typography>
                            </Box>
                          </Stack>
                        </TableCell>

                        <TableCell>
                          <FormControl size="small" sx={{ minWidth: 120 }} disabled={isCurrentAdmin || isUpdating}>
                            <Select
                              value={user.role}
                              onChange={(e) => handleRoleChange(user, e.target.value)}
                              sx={{ borderRadius: "10px", fontSize: "0.8rem", height: 32 }}
                            >
                              <MenuItem value="operations">Operations</MenuItem>
                              <MenuItem value="admin">Admin</MenuItem>
                            </Select>
                          </FormControl>
                        </TableCell>

                        <TableCell>
                          <Chip
                            label={user.is_active ? "Active" : "Disabled"}
                            size="small"
                            sx={{
                              height: 22,
                              fontSize: "0.7rem",
                              fontWeight: 750,
                              backgroundColor: user.is_active ? "rgba(16, 185, 129, 0.1)" : "rgba(100, 116, 139, 0.1)",
                              color: user.is_active ? "#047857" : "#64748B",
                            }}
                          />
                        </TableCell>

                        <TableCell align="right">
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={isCurrentAdmin || isUpdating}
                            onClick={() => handleToggleUser(user)}
                            color={user.is_active ? "error" : "primary"}
                            sx={{ borderRadius: "8px", fontSize: "0.72rem", py: 0.3 }}
                          >
                            {user.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;