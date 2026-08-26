import { Box } from "@mui/material";

function AnimatedBackground() {
  return (
    <Box
      sx={{
        position: "fixed",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
        zIndex: 0,
      }}
    >
      <Box
        component="video"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        aria-hidden="true"
        src="/FlowFix_Flow_Background_Loop.mp4"
        sx={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",

          opacity: 0.56,
filter: "blur(7px) saturate(0.92)",
transform: "scale(1.04)",
        }}
      />

      {/* Light readability overlay */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,

          background:
             "linear-gradient(180deg, rgba(247,249,252,0.28) 0%, rgba(247,249,252,0.34) 55%, rgba(247,249,252,0.46) 100%)",
        }}
      />

      {/* Very subtle central glow */}
      <Box
        sx={{
          position: "absolute",
          inset: 0,

          background:
            "radial-gradient(circle at 50% 42%, rgba(255,255,255,0.12), transparent 48%)",
        }}
      />
    </Box>
  );
}

export default AnimatedBackground;