import { Check } from "@mui/icons-material";

import {
  Box,
  Typography,
} from "@mui/material";

const steps = [
  "Issue",
  "Details",
  "Appointment",
  "Confirmation",
];

function ProgressIndicator({
  currentStep,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 720,
        mx: "auto",
        mb: {
          xs: 4,
          md: 5,
        },
      }}
    >
      <Box
        sx={{
          position: "relative",
          width: "100%",
          display: "flex",
          alignItems: "flex-start",
        }}
      >
        {/* Base line */}
        <Box
          sx={{
            position: "absolute",
            top: 15,
            left: "12.5%",
            right: "12.5%",
            height: "1px",
            backgroundColor:
              "rgba(255,255,255,0.45)",
            zIndex: 0,
          }}
        />

        {/* Progress line */}
        <Box
          sx={{
            position: "absolute",
            top: 14,
            left: "12.5%",
            width: `calc(${Math.max(
              currentStep - 1,
              0
            )} * 25%)`,
            maxWidth: "75%",
            height: "2px",
            background:
              "linear-gradient(90deg, #2563EB, #14B8A6)",
            borderRadius: "999px",
            transition:
              "width 350ms ease",
            zIndex: 0,
          }}
        />

        {steps.map((label, index) => {
          const step = index + 1;

          const isActive =
            step === currentStep;

          const isCompleted =
            step < currentStep;

          return (
            <Box
              key={label}
              sx={{
                flex: 1,
                position: "relative",
                zIndex: 1,

                display: "flex",
                flexDirection: "column",
                alignItems: "center",

                // Explicitly no panel/background.
                backgroundColor: "transparent",
                backgroundImage: "none",
                border: 0,
                boxShadow: "none",
              }}
            >
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: "50%",

                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",

                  background:
                    isActive || isCompleted
                      ? "linear-gradient(135deg, #2563EB, #14B8A6)"
                      : "rgba(255,255,255,0.9)",

                  border:
                    isActive || isCompleted
                      ? "none"
                      : "1px solid rgba(148,163,184,0.28)",

                  color:
                    isActive || isCompleted
                      ? "#FFFFFF"
                      : "#64748B",

                  boxShadow:
                    isActive
                      ? "0 8px 24px rgba(37,99,235,0.22)"
                      : "0 4px 12px rgba(15,23,42,0.04)",

                  transition:
                    "all 250ms ease",
                }}
              >
                {isCompleted ? (
                  <Check
                    sx={{
                      fontSize: 17,
                    }}
                  />
                ) : (
                  <Typography
                    component="span"
                    sx={{
                      fontSize: 12,
                      lineHeight: 1,
                      fontWeight: 800,
                    }}
                  >
                    {step}
                  </Typography>
                )}
              </Box>

              <Typography
                variant="caption"
                sx={{
                  mt: 1,
                  fontWeight:
                    isActive || isCompleted
                      ? 700
                      : 500,
                  color:
                    isActive
                      ? "text.primary"
                      : "text.secondary",
                }}
              >
                {label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

export default ProgressIndicator;