import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
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

import PageHeader from "../components/PageHeader";
import LoadingState from "../components/LoadingState";
import ErrorState from "../components/ErrorState";
import EmptyState from "../components/EmptyState";
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

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [role, setRole] =
    useState("operations");

  const [creating, setCreating] =
    useState(false);

  const [updatingUserId, setUpdatingUserId] =
    useState(null);

  const [createError, setCreateError] =
    useState("");

  const [createSuccess, setCreateSuccess] =
    useState("");

  useEffect(() => {
    loadAdminUsers();
  }, [loadAdminUsers]);


  async function handleCreateUser(event) {
    event.preventDefault();

    try {
      setCreating(true);
      setCreateError("");
      setCreateSuccess("");

      await createAdminUser(
        username,
        password,
        role
      );

      setUsername("");
      setPassword("");
      setRole("operations");

      setCreateSuccess(
        "User created successfully."
      );

      await loadAdminUsers();
    } catch (err) {
      setCreateError(
        err.message ||
          "Failed to create user."
      );
    } finally {
      setCreating(false);
    }
  }


  async function handleToggleUser(user) {
    try {
      setUpdatingUserId(user.id);
      setCreateError("");
      setCreateSuccess("");

      await updateAdminUserStatus(
        user.id,
        !user.is_active
      );

      setCreateSuccess(
        `${user.username} is now ${
          user.is_active
            ? "inactive"
            : "active"
        }.`
      );

      await loadAdminUsers();
    } catch (err) {
      setCreateError(
        err.message ||
          "Failed to update user status."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }


  async function handleRoleChange(
    user,
    newRole
  ) {
    try {
      setUpdatingUserId(user.id);
      setCreateError("");
      setCreateSuccess("");

      await updateAdminUserRole(
        user.id,
        newRole
      );

      setCreateSuccess(
        `${user.username}'s role was changed to ${newRole}.`
      );

      await loadAdminUsers();
    } catch (err) {
      setCreateError(
        err.message ||
          "Failed to update user role."
      );
    } finally {
      setUpdatingUserId(null);
    }
  }


  if (
    loading &&
    adminUsers.length === 0
  ) {
    return <LoadingState />;
  }


  return (
    <Box>
      <PageHeader
        title="Settings"
        description="Manage FlowFix system and administrative settings."
      />

      {error && (
        <ErrorState
          message={error}
          onRetry={loadAdminUsers}
        />
      )}

      <Stack spacing={3}>

        {/* Create user */}
        <Paper
          variant="outlined"
          sx={{ p: 3 }}
        >
          <Typography
            variant="h6"
            fontWeight={700}
            gutterBottom
          >
            Create Admin User
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Create a new user with access to the
            FlowFix administration system.
          </Typography>

          {createError && (
            <Alert
              severity="error"
              sx={{ mb: 2 }}
            >
              {createError}
            </Alert>
          )}

          {createSuccess && (
            <Alert
              severity="success"
              sx={{ mb: 2 }}
            >
              {createSuccess}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleCreateUser}
          >
            <Stack spacing={2}>
              <TextField
                label="Username"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                required
                fullWidth
              />

              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
                fullWidth
                helperText="Minimum 8 characters"
              />

              <FormControl fullWidth>
                <InputLabel>
                  Role
                </InputLabel>

                <Select
                  value={role}
                  label="Role"
                  onChange={(event) =>
                    setRole(
                      event.target.value
                    )
                  }
                >
                  <MenuItem value="operations">
                    Operations
                  </MenuItem>

                  <MenuItem value="admin">
                    Admin
                  </MenuItem>
                </Select>
              </FormControl>

              <Box>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={
                    creating ||
                    username.trim().length < 3 ||
                    password.length < 8
                  }
                >
                  {creating
                    ? "Creating..."
                    : "Create User"}
                </Button>
              </Box>
            </Stack>
          </Box>
        </Paper>


        {/* User list */}
        <Paper variant="outlined">
          <Box
            sx={{
              p: 2.5,
              borderBottom: 1,
              borderColor: "divider",
            }}
          >
            <Typography
              variant="h6"
              fontWeight={700}
            >
              Admin Users
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Manage users, roles and account status.
            </Typography>
          </Box>

          {adminUsers.length === 0 ? (
            <EmptyState
              message="No admin users found."
            />
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      User
                    </TableCell>

                    <TableCell>
                      Role
                    </TableCell>

                    <TableCell>
                      Status
                    </TableCell>

                    <TableCell align="right">
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>

                <TableBody>
                  {adminUsers.map(
                    (user) => {
                      const isCurrentAdmin =
                        user.username === "admin";

                      const isUpdating =
                        updatingUserId ===
                        user.id;

                      return (
                        <TableRow
                          key={user.id}
                          hover
                        >
                          <TableCell>
                            <Stack
                              spacing={0.25}
                            >
                              <Typography
                                variant="body2"
                                fontWeight={600}
                              >
                                {user.username}
                              </Typography>

                              <Typography
                                variant="caption"
                                color="text.secondary"
                              >
                                ID #{user.id}
                              </Typography>
                            </Stack>
                          </TableCell>

                          <TableCell>
                            <FormControl
                              size="small"
                              sx={{
                                minWidth: 130,
                              }}
                              disabled={
                                isCurrentAdmin ||
                                isUpdating
                              }
                            >
                              <Select
                                value={
                                  user.role
                                }
                                onChange={(
                                  event
                                ) =>
                                  handleRoleChange(
                                    user,
                                    event
                                      .target
                                      .value
                                  )
                                }
                              >
                                <MenuItem value="operations">
                                  Operations
                                </MenuItem>

                                <MenuItem value="admin">
                                  Admin
                                </MenuItem>
                              </Select>
                            </FormControl>
                          </TableCell>

                          <TableCell>
                            <Chip
                              label={
                                user.is_active
                                  ? "Active"
                                  : "Inactive"
                              }
                              size="small"
                              color={
                                user.is_active
                                  ? "success"
                                  : "default"
                              }
                            />
                          </TableCell>

                          <TableCell align="right">
                            <Button
                              size="small"
                              variant="outlined"
                              color={
                                user.is_active
                                  ? "warning"
                                  : "success"
                              }
                              disabled={
                                isCurrentAdmin ||
                                isUpdating
                              }
                              onClick={() =>
                                handleToggleUser(
                                  user
                                )
                              }
                            >
                              {isUpdating
                                ? "Updating..."
                                : user.is_active
                                  ? "Deactivate"
                                  : "Activate"}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Stack>
    </Box>
  );
}

export default Settings;