import { AnimatePresence, motion } from "framer-motion";
import { Box } from "@mui/material";

function AnimatedStep({
  step,
  children,
}) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <Box
        key={step}
        component={motion.div}
        initial={{
          opacity: 0,
          y: 18,
          scale: 0.99,
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          y: -12,
          scale: 0.99,
        }}
        transition={{
          duration: 0.38,
          ease: [0.22, 1, 0.36, 1],
        }}
        sx={{
          width: "100%",
        }}
      >
        {children}
      </Box>
    </AnimatePresence>
  );
}

export default AnimatedStep;