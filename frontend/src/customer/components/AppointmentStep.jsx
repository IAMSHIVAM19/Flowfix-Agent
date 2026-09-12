import {
  AccessTime,
  ArrowLeft,
  ReceiptLong,
  VerifiedUser,
  LocalOffer,
  CheckCircle,
} from "@mui/icons-material";

import {
  Box,
  Button,
  Chip,
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
  quoteEstimate,
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

        {/* Upfront Transparent Quote Estimate Banner */}
        {quoteEstimate && (
          <Box
            sx={{
              p: { xs: 2, sm: 2.5 },
              borderRadius: "18px",
              backgroundColor: "rgba(255, 255, 255, 0.88)",
              backdropFilter: "blur(16px)",
              border: "1px solid rgba(37, 99, 235, 0.18)",
              boxShadow: "0 10px 30px -10px rgba(37, 99, 235, 0.08)",
              display: "flex",
              flexDirection: { xs: "column", sm: "row" },
              justifyContent: "space-between",
              alignItems: { xs: "flex-start", sm: "center" },
              gap: 2,
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center">
              <Box
                sx={{
                  width: 46,
                  height: 46,
                  borderRadius: "14px",
                  background: quoteEstimate.urgency_surcharge > 0
                    ? "linear-gradient(135deg, #EF4444, #F97316)"
                    : "linear-gradient(135deg, #10B981, #0D9488)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  flexShrink: 0,
                  boxShadow: "0 6px 16px -2px rgba(16, 185, 129, 0.3)",
                }}
              >
                <ReceiptLong sx={{ fontSize: 24 }} />
              </Box>
              <Box>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.25 }}>
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: quoteEstimate.urgency_surcharge > 0 ? "error.main" : "text.secondary",
                      textTransform: "uppercase",
                      letterSpacing: "0.06em",
                      fontSize: "0.7rem",
                    }}
                  >
                    Upfront Cost Estimate • {quoteEstimate.service_name}
                  </Typography>
                  {quoteEstimate.urgency_surcharge > 0 && (
                    <Chip
                      label="Emergency Priority"
                      size="small"
                      sx={{
                        height: 18,
                        fontSize: "0.62rem",
                        fontWeight: 800,
                        backgroundColor: "rgba(239, 68, 68, 0.12)",
                        color: "#DC2626",
                      }}
                    />
                  )}
                </Stack>
                <Typography
                  variant="h5"
                  fontWeight={850}
                  sx={{
                    color: "#0F172A",
                    letterSpacing: "-0.02em",
                    fontSize: { xs: "1.3rem", sm: "1.5rem" },
                  }}
                >
                  ${quoteEstimate.estimated_min} – ${quoteEstimate.estimated_max} {quoteEstimate.currency}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ display: "block", mt: 0.25, fontWeight: 550 }}
                >
                  Includes ${quoteEstimate.callout_fee} AUD diagnostic call-out fee & standard repair labor
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                alignSelf: { xs: "stretch", sm: "auto" },
                p: 1.25,
                px: 2,
                borderRadius: "12px",
                backgroundColor: "rgba(15, 23, 42, 0.04)",
                border: "1px solid rgba(15, 23, 42, 0.06)",
                textAlign: { xs: "left", sm: "right" },
              }}
            >
              <Stack direction="row" spacing={0.75} alignItems="center" sx={{ justifyContent: { sm: "flex-end" }, mb: 0.25 }}>
                <VerifiedUser sx={{ fontSize: 16, color: "#10B981" }} />
                <Typography variant="caption" fontWeight={750} sx={{ color: "#065F46" }}>
                  Transparent Pricing Guarantee
                </Typography>
              </Stack>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem", display: "block" }}>
                Fixed on-site quote confirmed before work starts. Zero hidden fees.
              </Typography>
            </Box>
          </Box>
        )}


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