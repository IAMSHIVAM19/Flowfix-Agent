import {
  AccessTime,
  ArrowLeft,
  Refresh,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Stack,
  Typography,
} from "@mui/material";

function NoAvailabilityStep({
  message,
  onTryAgain,
}) {
  return (
    <Box
      sx={{
        maxWidth: 680,
        mx: "auto",
        textAlign: "center",
      }}
    >
      <Stack
        spacing={3}
        sx={{
          alignItems: "center",
        }}
      >
        <Box
          sx={{
            width: 76,
            height: 76,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            backgroundColor:
              "rgba(245, 158, 11, 0.10)",
            color: "#D97706",
          }}
        >
          <AccessTime
            sx={{
              fontSize: 34,
            }}
          />
        </Box>

        <Box>
          <Typography
            variant="h3"
            fontWeight={700}
            sx={{
              fontSize: {
                xs: "2rem",
                sm: "3rem",
              },
            }}
          >
            We couldn't find a time just yet.
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mt: 1.5,
              maxWidth: 580,
              mx: "auto",
            }}
          >
            {message}
          </Typography>
        </Box>

        <Box
          className="customer-glass"
          sx={{
            width: "100%",
            maxWidth: 520,
            p: 3,
            borderRadius: "24px",
            textAlign: "left",
          }}
        >
          <Typography
            variant="body1"
            fontWeight={700}
            gutterBottom
          >
            Try a different time
          </Typography>

          <Typography
            variant="body2"
            color="text.secondary"
          >
            Go back and update your request with
            another preferred date or time. FlowFix
            will check availability again.
          </Typography>
        </Box>

        <Button
          variant="contained"
          size="large"
          startIcon={<Refresh />}
          onClick={onTryAgain}
          sx={{
            minWidth: {
              xs: "100%",
              sm: 220,
            },
          }}
        >
          Try another time
        </Button>

        <Button
          variant="text"
          startIcon={<ArrowLeft />}
          onClick={onTryAgain}
        >
          Edit my request
        </Button>
      </Stack>
    </Box>
  );
}

export default NoAvailabilityStep;