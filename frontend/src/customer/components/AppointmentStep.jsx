import {
  AccessTime,
  ArrowLeft,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Grid,
  Stack,
  Typography,
} from "@mui/material";

import {
  motion,
} from "framer-motion";

import AppointmentCard from "./AppointmentCard";


function AppointmentStep({
  options,
  selectedOption,
  onSelect,
  onBack,
  onConfirm,
  confirming,
}) {
  return (
    <Box
      sx={{
        maxWidth: 900,
        mx: "auto",
      }}
    >
      <Stack spacing={3}>

        {/* Heading */}
        <Box>
          <Stack
            direction="row"
            spacing={1}
            sx={{
              alignItems: "center",
              mb: 1,
            }}
          >
            <AccessTime color="primary" />

            <Typography
              variant="body2"
              color="primary.main"
              fontWeight={700}
            >
              We found some availability
            </Typography>
          </Stack>

          <Typography
            variant="h2"
            sx={{
              fontSize: {
                xs: "2.1rem",
                sm: "3rem",
              },
              letterSpacing: "-0.035em",
            }}
          >
            Pick a time that works for you.
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{
              mt: 1,
              maxWidth: 650,
            }}
          >
            Choose the appointment that suits you
            best. We'll take care of the rest.
          </Typography>
        </Box>


        {/* Appointment cards */}
        <Grid
  container
  spacing={2.5}
  sx={{
    justifyContent:
      options.length === 1
        ? "center"
        : "flex-start",
  }}
>
  {options.map(
    (option, index) => (
      <Grid
        key={option.option_id}
        size={{
          xs: 12,
          sm:
            options.length === 1
              ? 8
              : 6,
        }}
        component={motion.div}
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.98,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        transition={{
          duration: 0.4,
          delay: index * 0.08,
          ease: [
            0.22,
            1,
            0.36,
            1,
          ],
        }}
      >
        <AppointmentCard
  option={option}
  selected={
    selectedOption?.option_id ===
    option.option_id
  }
  onSelect={onSelect}
  disabled={confirming}
  recommended={index === 0}
/>
      </Grid>
    )
  )}
</Grid>


        {/* Actions */}
        <Stack
          direction={{
            xs: "column-reverse",
            sm: "row",
          }}
          spacing={2}
          sx={{
            justifyContent:
              "space-between",
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
            disabled={confirming}
          >
            Back
          </Button>

          <Button
            variant="contained"
            size="large"
            disabled={
              !selectedOption ||
              confirming
            }
            onClick={onConfirm}
            sx={{
              minWidth: {
                xs: "100%",
                sm: 220,
              },
            }}
          >
            {confirming
              ? "Confirming..."
              : "Confirm appointment"}
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
}

export default AppointmentStep;