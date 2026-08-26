import {
  ArrowRight,
  AutoAwesome,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function IssueStep({
  value,
  onChange,
  onContinue,
}) {
  const canContinue =
    value.trim().length >= 5;

  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 920,
        mx: "auto",
      }}
    >
      <Stack
        spacing={{
          xs: 2.5,
          sm: 3,
          md: 4,
        }}
      >
        {/* Hero */}
        <Box
          sx={{
            textAlign: "center",
            maxWidth: 820,
            mx: "auto",
            px: {
              xs: 0.5,
              sm: 1,
            },
          }}
        >
          <Chip
            icon={<AutoAwesome />}
            label="AI-powered service matching"
            size="small"
            sx={{
              borderRadius: 999,
              mb: {
                xs: 2,
                sm: 2.5,
              },

              px: 0.5,

              backgroundColor:
                "rgba(255,255,255,0.62)",

              border:
                "1px solid rgba(255,255,255,0.55)",

              backdropFilter:
                "blur(12px)",

              color: "primary.main",
              fontWeight: 700,

              boxShadow:
                "0 8px 24px rgba(15,23,42,0.05)",

              "& .MuiChip-icon": {
                color: "primary.main",
              },
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: {
                xs: "2.65rem",
                sm: "4rem",
                md: "5.2rem",
              },

              lineHeight: {
                xs: 1.02,
                sm: 0.99,
              },

              letterSpacing: "-0.055em",

              fontWeight: 850,

              maxWidth: 860,

              mx: "auto",
            }}
          >
            Plumbing help,
            <br />

            <Box
              component="span"
              className="customer-gradient-text"
            >
              without the hassle.
            </Box>
          </Typography>

          <Typography
            sx={{
              mt: {
                xs: 1.75,
                sm: 2.5,
              },

              maxWidth: 660,

              mx: "auto",

              px: {
                xs: 0.5,
                sm: 0,
              },

              fontSize: {
                xs: "0.98rem",
                sm: "1.12rem",
              },

              lineHeight: 1.6,

              color: "text.secondary",
            }}
          >
            Tell us what's going wrong.
            FlowFix understands the problem,
            matches the right service, and finds
            a time that works for you.
          </Typography>
        </Box>


        {/* Request surface */}
        <Box
          sx={{
            position: "relative",

            p: {
              xs: 1,
              sm: 1.5,
              md: 2,
            },

            borderRadius: {
              xs: "24px",
              sm: "30px",
            },

            background:
              "rgba(255,255,255,0.56)",

            border:
              "1px solid rgba(255,255,255,0.72)",

            backdropFilter:
              "blur(22px)",

            boxShadow:
              "0 24px 70px rgba(15,23,42,0.10)",
          }}
        >
          <Box
            sx={{
              p: {
                xs: 1.5,
                sm: 2.5,
              },

              borderRadius: {
                xs: "20px",
                sm: "24px",
              },

              backgroundColor:
                "rgba(255,255,255,0.86)",

              border:
                "1px solid rgba(226,232,240,0.80)",
            }}
          >
            <TextField
              fullWidth
              multiline
              minRows={5}
              placeholder="Tell us what’s happening..."
              value={value}
              onChange={(event) =>
                onChange(
                  event.target.value
                )
              }
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: {
                    xs: 160,
                    sm: 190,
                  },

                  alignItems:
                    "flex-start",

                  borderRadius: {
                    xs: "15px",
                    sm: "18px",
                  },

                  backgroundColor:
                    "rgba(248,250,252,0.72)",

                  fontSize: {
                    xs: "0.98rem",
                    sm: "1.08rem",
                  },

                  lineHeight: 1.65,

                  transition:
                    "all 180ms ease",

                  "& fieldset": {
                    borderColor:
                      "rgba(226,232,240,0.80)",
                  },

                  "&:hover fieldset": {
                    borderColor:
                      "rgba(148,163,184,0.45)",
                  },

                  "&.Mui-focused": {
                    backgroundColor:
                      "#FFFFFF",

                    boxShadow:
                      "0 0 0 4px rgba(37,99,235,0.08)",
                  },
                },
              }}
            />

            <Stack
              direction={{
                xs: "column",
                sm: "row",
              }}
              spacing={2}
              sx={{
                mt: 2,

                justifyContent:
                  "space-between",

                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    fontWeight: 500,
                  }}
                >
                  Usually takes less than a minute.
                </Typography>

                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  No account required.
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight />}
                disabled={!canContinue}
                onClick={onContinue}
                fullWidth={false}
                sx={{
                  minWidth: {
                    xs: "100%",
                    sm: 220,
                  },

                  minHeight: {
                    xs: 50,
                    sm: 52,
                  },

                  borderRadius: "15px",

                  boxShadow:
                    canContinue
                      ? "0 12px 28px rgba(37,99,235,0.22)"
                      : "none",
                }}
              >
                Find my appointment
              </Button>
            </Stack>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textAlign: "center",
            opacity: 0.78,
            px: 2,
          }}
        >
          FlowFix helps match your request with
          available plumbing services.
        </Typography>
      </Stack>
    </Box>
  );
}

export default IssueStep;