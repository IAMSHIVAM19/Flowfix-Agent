import {
  ArrowRight,
  AutoAwesome,
  FlashOn,
  WaterDrop,
  Shower,
  HotTub,
  Wc,
  Plumbing,
} from "@mui/icons-material";
import {
  Box,
  Button,
  Chip,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

const quickIssues = [
  {
    label: "Burst Pipe (Emergency)",
    icon: <FlashOn sx={{ fontSize: "16px !important", color: "#EF4444 !important" }} />,
    text: "I have a burst pipe in my home and water is leaking everywhere, I need an emergency plumber today.",
    color: "error",
  },
  {
    label: "Leaking Tap",
    icon: <WaterDrop sx={{ fontSize: "16px !important", color: "#2563EB !important" }} />,
    text: "My kitchen sink mixer tap is dripping continuously and leaking under the counter.",
    color: "primary",
  },
  {
    label: "Blocked Drain",
    icon: <Plumbing sx={{ fontSize: "16px !important", color: "#0284C7 !important" }} />,
    text: "The main drain is completely blocked with wastewater backing up into the pipes.",
    color: "info",
  },
  {
    label: "Blocked Shower",
    icon: <Shower sx={{ fontSize: "16px !important", color: "#0D9488 !important" }} />,
    text: "The shower drain is clogged with water pooling around the base and draining very slowly.",
    color: "secondary",
  },
  {
    label: "No Hot Water",
    icon: <HotTub sx={{ fontSize: "16px !important", color: "#F59E0B !important" }} />,
    text: "Our hot water heater has stopped working and only cold water is coming through the taps.",
    color: "warning",
  },
  {
    label: "Running Toilet",
    icon: <Wc sx={{ fontSize: "16px !important", color: "#6366F1 !important" }} />,
    text: "The toilet cistern keeps running water into the bowl constantly and needs urgent repair.",
    color: "default",
  },
];

function IssueStep({
  value,
  onChange,
  onContinue,
}) {
  const canContinue = value.trim().length >= 5;

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
            label="AI-Powered Smart Dispatch & Booking"
            size="small"
            sx={{
              borderRadius: 999,
              mb: {
                xs: 2,
                sm: 2.5,
              },
              px: 1,
              backgroundColor: "rgba(255,255,255,0.7)",
              border: "1px solid rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              color: "primary.main",
              fontWeight: 750,
              boxShadow: "0 8px 24px rgba(15,23,42,0.06)",
              "& .MuiChip-icon": {
                color: "primary.main",
              },
            }}
          />

          <Typography
            variant="h1"
            sx={{
              fontSize: {
                xs: "2.5rem",
                sm: "3.8rem",
                md: "4.8rem",
              },
              lineHeight: {
                xs: 1.05,
                sm: 1.0,
              },
              letterSpacing: "-0.05em",
              fontWeight: 850,
              maxWidth: 860,
              mx: "auto",
              color: "#0F172A",
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
              fontSize: {
                xs: "1rem",
                sm: "1.12rem",
              },
              lineHeight: 1.6,
              color: "text.secondary",
            }}
          >
            Describe what's going wrong in plain English. FlowFix AI diagnoses the issue, matches certified local plumbers, and books an exact appointment window in seconds.
          </Typography>
        </Box>

        {/* Request Surface */}
        <Box
          sx={{
            position: "relative",
            p: {
              xs: 1.5,
              sm: 2,
              md: 2.5,
            },
            borderRadius: {
              xs: "24px",
              sm: "30px",
            },
            background: "rgba(255,255,255,0.65)",
            border: "1px solid rgba(255,255,255,0.85)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 25px 60px -15px rgba(15,23,42,0.10)",
            maxWidth: "100%",
            boxSizing: "border-box",
          }}
        >
          <Box
            sx={{
              p: {
                xs: 2,
                sm: 2.5,
              },
              borderRadius: {
                xs: "20px",
                sm: "24px",
              },
              backgroundColor: "rgba(255,255,255,0.92)",
              border: "1px solid rgba(226,232,240,0.90)",
              maxWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            {/* Quick Issue Selection */}
            <Box sx={{ mb: 2 }}>
              <Typography variant="caption" fontWeight={700} sx={{ color: "#64748B", display: "block", mb: 1, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Quick Fill Common Issues:
              </Typography>
              <Box
                sx={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 1,
                  alignItems: "center",
                }}
              >
                {quickIssues.map((item) => (
                  <Chip
                    key={item.label}
                    icon={item.icon}
                    label={item.label}
                    size="small"
                    onClick={() => onChange(item.text)}
                    sx={{
                      cursor: "pointer",
                      borderRadius: 999,
                      fontWeight: 650,
                      py: 0.5,
                      maxWidth: "100%",
                      border: "1px solid rgba(226, 232, 240, 0.8)",
                      backgroundColor: value === item.text ? "rgba(37, 99, 235, 0.12)" : "rgba(248, 250, 252, 0.8)",
                      borderColor: value === item.text ? "#3B82F6" : "rgba(226, 232, 240, 0.8)",
                      transition: "all 0.15s ease",
                      "&:hover": {
                        backgroundColor: "rgba(37, 99, 235, 0.08)",
                        borderColor: "#93C5FD",
                        transform: "translateY(-1px)",
                      },
                    }}
                  />
                ))}
              </Box>
            </Box>

            <TextField
              fullWidth
              multiline
              minRows={4}
              placeholder="e.g. My shower is dripping constantly and water pressure has dropped significantly since this morning..."
              value={value}
              onChange={(event) => onChange(event.target.value)}
              sx={{
                "& .MuiOutlinedInput-root": {
                  minHeight: {
                    xs: 140,
                    sm: 160,
                  },
                  alignItems: "flex-start",
                  borderRadius: {
                    xs: "15px",
                    sm: "18px",
                  },
                  backgroundColor: "rgba(248,250,252,0.85)",
                  fontSize: {
                    xs: "1rem",
                    sm: "1.08rem",
                  },
                  lineHeight: 1.65,
                  transition: "all 180ms ease",
                  "& fieldset": {
                    borderColor: "rgba(226,232,240,0.9)",
                  },
                  "&:hover fieldset": {
                    borderColor: "#94A3B8",
                  },
                  "&.Mui-focused": {
                    backgroundColor: "#FFFFFF",
                    boxShadow: "0 0 0 4px rgba(37,99,235,0.12)",
                    borderColor: "#2563EB",
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
                mt: 2.5,
                justifyContent: "space-between",
                alignItems: {
                  xs: "stretch",
                  sm: "center",
                },
              }}
            >
              <Box>
                <Typography
                  variant="body2"
                  fontWeight={600}
                  sx={{ color: "#334155" }}
                >
                  {value.length > 0 ? `${value.length} characters entered` : "Usually takes less than 60 seconds."}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                >
                  Zero phone tag • Verified local technicians
                </Typography>
              </Box>

              <Button
                variant="contained"
                size="large"
                endIcon={<ArrowRight />}
                disabled={!canContinue}
                onClick={onContinue}
                sx={{
                  minWidth: {
                    xs: "100%",
                    sm: 220,
                  },
                  minHeight: 52,
                  borderRadius: "15px",
                  fontSize: "1rem",
                  boxShadow: canContinue ? "0 12px 28px rgba(37,99,235,0.25)" : "none",
                }}
              >
                Find My Appointment
              </Button>
            </Stack>
          </Box>
        </Box>

        <Typography
          variant="caption"
          color="text.secondary"
          sx={{
            textAlign: "center",
            opacity: 0.85,
            px: 2,
          }}
        >
          🔒 FlowFix AI instantly protects your privacy and only matches licensed plumbing professionals.
        </Typography>
      </Stack>
    </Box>
  );
}

export default IssueStep;