import {
  AutoAwesome,
} from "@mui/icons-material";

import {
  Box,
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

const messages = [
  "Understanding your request",
  "Finding the right service",
  "Checking technician availability",
];

const MotionBox = motion.create(Box);

function UnderstandingStep({
  error,
}) {
  const [messageIndex, setMessageIndex] =
    useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMessageIndex((current) =>
        (current + 1) % messages.length
      );
    }, 900);

    return () => {
      clearInterval(timer);
    };
  }, []);

  if (error) {
    return (
      <Box
        sx={{
          maxWidth: 620,
          mx: "auto",
          textAlign: "center",
        }}
      >
        <Typography
          variant="h4"
          fontWeight={700}
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
      }}
    >
      <Stack
        spacing={3.5}
        sx={{
          alignItems: "center",
          textAlign: "center",
        }}
      >
        {/* Soft animated AI mark */}
        <MotionBox
          animate={{
            scale: [1, 1.025, 1],
            boxShadow: [
              "0 12px 34px rgba(37,99,235,0.08)",
              "0 18px 46px rgba(37,99,235,0.14)",
              "0 12px 34px rgba(37,99,235,0.08)",
            ],
          }}
          transition={{
            duration: 2.8,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          sx={{
            width: 84,
            height: 84,
            borderRadius: "26px",

            display: "flex",
            alignItems: "center",
            justifyContent: "center",

            background:
              "linear-gradient(135deg, rgba(37,99,235,0.10), rgba(20,184,166,0.10))",

            color: "primary.main",
          }}
        >
          <AutoAwesome
            sx={{
              fontSize: 38,
            }}
          />
        </MotionBox>

        {/* Main message */}
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
            FlowFix is on it.
          </Typography>

          <Box
            sx={{
              mt: 1.25,
              minHeight: 30,
              display: "flex",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <AnimatePresence mode="wait">
              <MotionBox
                key={messages[messageIndex]}
                initial={{
                  opacity: 0,
                  y: 8,
                }}
                animate={{
                  opacity: 1,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  y: -8,
                }}
                transition={{
                  duration: 0.35,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <Typography
                  color="text.secondary"
                >
                  {messages[messageIndex]}
                </Typography>
              </MotionBox>
            </AnimatePresence>
          </Box>
        </Box>

        {/* Minimal activity indicator */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.7,
            px: 2,
            py: 1,
            borderRadius: 999,

            background:
              "rgba(255,255,255,0.52)",

            border:
              "1px solid rgba(255,255,255,0.68)",

            backdropFilter:
              "blur(12px)",
          }}
        >
          {[0, 1, 2].map((dot) => (
            <MotionBox
              key={dot}
              animate={{
                opacity: [
                  0.35,
                  1,
                  0.35,
                ],
                y: [0, -2, 0],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: dot * 0.16,
                ease: "easeInOut",
              }}
              sx={{
                width: 5,
                height: 5,
                borderRadius: "50%",
                backgroundColor:
                  "primary.main",
              }}
            />
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

export default UnderstandingStep;