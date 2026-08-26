import {
  ArrowLeft,
  ArrowRight,
  LocationOn,
} from "@mui/icons-material";

import {
  Box,
  Button,
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
        maxWidth: 700,
        mx: "auto",
      }}
    >
      <Stack spacing={3}>
        <Box>
          <Typography
            variant="h2"
            sx={{
              fontSize: {
                xs: "2.2rem",
                sm: "3rem",
              },
            }}
          >
            Almost there.
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mt: 1,
              maxWidth: 560,
            }}
          >
            Tell us who we're helping and where
            the plumber needs to go.
          </Typography>
        </Box>

        <Box
          className="customer-glass"
          sx={{
            p: {
              xs: 2,
              sm: 3,
            },
            borderRadius: "28px",
          }}
        >
          <Stack spacing={2.5}>
            <TextField
              label="Your name"
              placeholder="Shivam Kapoor"
              value={details.name}
              onChange={updateField("name")}
              autoComplete="name"
            />

            <TextField
              label="Phone number"
              placeholder="0412 345 678"
              value={details.phone}
              onChange={updateField("phone")}
              type="tel"
              autoComplete="tel"
            />

            <TextField
              label="Service address"
              placeholder="25 Example Street, Sydney"
              value={details.address}
              onChange={updateField("address")}
              autoComplete="street-address"
              slotProps={{
                input: {
                  startAdornment: (
                    <LocationOn
                      sx={{
                        mr: 1,
                        color: "text.secondary",
                      }}
                    />
                  ),
                },
              }}
            />

            <Typography
              variant="body2"
              color="text.secondary"
            >
              We'll use these details to match your
              request with the available service team.
            </Typography>
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
          >
            Back
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
                sm: 210,
              },
            }}
          >
            Continue
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default DetailsStep;