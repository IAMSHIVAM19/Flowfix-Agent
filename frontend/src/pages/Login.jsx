import { useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { login } from "../services/api";

function Login() {
  const navigate = useNavigate();

  const [username, setUsername] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      setLoading(true);
      setError("");

      await login(username, password);

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      setError(
        err.message ||
          "Unable to sign in."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
        backgroundColor: "background.default",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          maxWidth: 420,
          p: 4,
        }}
      >
        <Stack spacing={3}>
          <Box>
            <Typography
              variant="h4"
              fontWeight={700}
              gutterBottom
            >
              FlowFix
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
            >
              Admin dashboard sign in
            </Typography>
          </Box>

          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
          >
            <Stack spacing={2}>
              <TextField
                fullWidth
                label="Username"
                value={username}
                onChange={(event) =>
                  setUsername(
                    event.target.value
                  )
                }
                autoComplete="username"
                autoFocus
              />

              <TextField
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                autoComplete="current-password"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={
                  loading ||
                  !username ||
                  !password
                }
              >
                {loading ? (
                  <CircularProgress
                    size={24}
                    color="inherit"
                  />
                ) : (
                  "Sign in"
                )}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}

export default Login;