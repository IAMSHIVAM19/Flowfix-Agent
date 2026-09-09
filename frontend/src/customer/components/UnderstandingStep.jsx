import {
  AutoAwesome,
  CheckCircle,
  Engineering,
  CalendarMonth,
  ContentPasteSearch,
} from "@mui/icons-material";
import {
  Box,
  CircularProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import {
  AnimatePresence,
  motion,
} from "framer-motion";
import {
  useEffect,
  useState,
} from "react";

const steps = [
  {
    icon: <ContentPasteSearch sx={{ fontSize: 20 }} />,
    title: "Understanding request context & urgency",
    desc: "AI classifies issue severity and required parts",
  },
  {
    icon: <Engineering sx={{ fontSize: 20 }} />,
    title: "Matching qualified licensed technicians",
    desc: "Filtering plumbers certified for your specific repair",
  },
  {
    icon: <CalendarMonth sx={{ fontSize: 20 }} />,
    title: "Finding optimal dispatch slots",
    desc: "Locking available service windows near your address",
  },
];

const MotionBox = motion.create(Box);

function UnderstandingStep({
  error,
}) {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer1 = setTimeout(() => setActiveStep(1), 600);
    const timer2 = setTimeout(() => setActiveStep(2), 1200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  if (error) {
    return (
      <Box
        sx={{
          maxWidth: 620,
          mx: "auto",
          textAlign: "center",
          p: 4,
          borderRadius: "24px",
          backgroundColor: "rgba(254, 242, 242, 0.9)",
          border: "1px solid #FCA5A5",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={800}
          color="error.main"
          gutterBottom
        >
          We couldn't process that request.
        </Typography>

        <Typography color="text.secondary">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 620,
        mx: "auto",
        width: "100%",
      }}
    >
      <Stack
        spacing={3.5}
        sx={{
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Animated AI Emblem */}
        <MotionBox
          animate={{
            scale: [1, 1.05, 1],
            boxShadow: [
              "0 15px 35px rgba(37,99,235,0.15)",
              "0 22px 55px rgba(37,99,235,0.25)",
              "0 15px 35px rgba(37,99,235,0.15)",
            ],
          }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          sx={{
            width: 88,
            height: 88,
            borderRadius: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "linear-gradient(135deg, #2563EB, #0D9488)",
            color: "#FFFFFF",
            boxShadow: "0 18px 40px rgba(37,99,235,0.25)",
          }}
        >
          <AutoAwesome sx={{ fontSize: 42 }} />
        </MotionBox>

        {/* Title */}
        <Box>
          <Typography
            variant="h2"
            sx={{
              fontSize: {
                xs: "2.2rem",
                sm: "2.8rem",
              },
              fontWeight: 800,
              letterSpacing: "-0.04em",
              color: "#0F172A",
            }}
          >
            FlowFix Agent is on it
          </Typography>

          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1, maxWidth: 500, mx: "auto" }}
          >
            Analyzing your request and scheduling the right technician.
          </Typography>
        </Box>

        {/* Step-by-Step Progress Card */}
        <Paper
          className="customer-glass"
          sx={{
            width: "100%",
            p: 3,
            borderRadius: "24px",
            backgroundColor: "rgba(255, 255, 255, 0.9)",
            border: "1px solid rgba(226, 232, 240, 0.9)",
            textAlign: "left",
          }}
        >
          <Stack spacing={2.5}>
            {steps.map((stepItem, index) => {
              const isCompleted = activeStep > index;
              const isCurrent = activeStep === index;

              return (
                <Box
                  key={stepItem.title}
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    gap: 2,
                    p: 1.5,
                    borderRadius: "16px",
                    backgroundColor: isCurrent ? "rgba(37, 99, 235, 0.05)" : "transparent",
                    transition: "all 0.3s ease",
                  }}
                >
                  <Box
                    sx={{
                      width: 40,
                      height: 40,
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isCompleted
                        ? "rgba(16, 185, 129, 0.12)"
                        : isCurrent
                        ? "rgba(37, 99, 235, 0.12)"
                        : "rgba(148, 163, 184, 0.12)",
                      color: isCompleted
                        ? "#10B981"
                        : isCurrent
                        ? "#2563EB"
                        : "#94A3B8",
                      flexShrink: 0,
                    }}
                  >
                    {isCompleted ? (
                      <CheckCircle sx={{ fontSize: 22 }} />
                    ) : isCurrent ? (
                      <CircularProgress size={18} thickness={5} color="primary" />
                    ) : (
                      stepItem.icon
                    )}
                  </Box>

                  <Box sx={{ flexGrow: 1 }}>
                    <Typography
                      variant="body2"
                      fontWeight={isCurrent || isCompleted ? 700 : 500}
                      sx={{ color: isCurrent || isCompleted ? "#0F172A" : "#64748B" }}
                    >
                      {stepItem.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {stepItem.desc}
                    </Typography>
                  </Box>
                </Box>
              );
            })}
          </Stack>
        </Paper>
      </Stack>
    </Box>
  );
}

export default UnderstandingStep;