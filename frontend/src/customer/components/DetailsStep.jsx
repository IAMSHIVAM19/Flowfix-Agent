import {
  ArrowLeft,
  ArrowRight,
  LocationOn,
  Person,
  Phone,
} from "@mui/icons-material";
import {
  Box,
  Button,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

function DetailsStep({
  details,
  onChange,
  onContinue,
  onBack,
}) {
  const canContinue =
    details.name.trim().length >= 2 &&
    details.phone.trim().length >= 8 &&
    details.address.trim().length >= 3;

  function updateField(field) {
    return (event) => {
      onChange({
        ...details,
        [field]: event.target.value,
      });
    };
  }

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: "auto",
        width: "100%",
      }}
    >
      <Stack spacing={3.5}>
        <Box>
          <Typography
            variant="h2"
            sx={{
              fontSize: {
                xs: "2.2rem",
                sm: "3rem",
              },
              letterSpacing: "-0.04em",
              fontWeight: 800,
              color: "#0F172A",
            }}
          >
            Contact & Address
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mt: 0.5,
              maxWidth: 560,
            }}
          >
            Where should the plumber arrive and who should we contact upon dispatch?
          </Typography>
        </Box>

        <Box
          className="customer-glass"
          sx={{
            p: {
              xs: 2.5,
              sm: 3.5,
            },
            borderRadius: "28px",
            backgroundColor: "rgba(255, 255, 255, 0.88)",
            border: "1px solid rgba(255, 255, 255, 0.9)",
            boxShadow: "0 25px 60px -15px rgba(15, 23, 42, 0.09)",
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Full Name"
              placeholder="e.g. David Miller"
              value={details.name}
              onChange={updateField("name")}
              autoComplete="name"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person sx={{ color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Phone Number"
              placeholder="e.g. 0412 345 678"
              value={details.phone}
              onChange={updateField("phone")}
              type="tel"
              autoComplete="tel"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone sx={{ color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <TextField
              label="Service Address"
              placeholder="e.g. 142 George Street, Sydney NSW 2000"
              value={details.address}
              onChange={updateField("address")}
              autoComplete="street-address"
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <LocationOn sx={{ color: "#94A3B8" }} />
                    </InputAdornment>
                  ),
                },
              }}
            />

            <Box sx={{ p: 1.5, borderRadius: "12px", backgroundColor: "rgba(37, 99, 235, 0.05)", border: "1px solid rgba(37, 99, 235, 0.12)" }}>
              <Typography variant="caption" sx={{ color: "#1D4ED8", fontWeight: 600, display: "block" }}>
                ✓ Instant AI Verification
              </Typography>
              <Typography variant="caption" color="text.secondary">
                We check existing customer records to link past maintenance notes and assign the technician best suited to your plumbing hardware.
              </Typography>
            </Box>
          </Stack>
        </Box>

        <Stack
          direction={{
            xs: "column-reverse",
            sm: "row",
          }}
          spacing={2}
          sx={{
            justifyContent: "space-between",
            alignItems: {
              xs: "stretch",
              sm: "center",
            },
          }}
        >
          <Button
            variant="text"
            startIcon={<ArrowLeft />}
            onClick={onBack}
            sx={{ fontWeight: 650, color: "#64748B" }}
          >
            Back to Issue
          </Button>

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
            Find Availability
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default DetailsStep;