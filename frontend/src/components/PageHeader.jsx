import { Box, Stack, Typography } from "@mui/material";

function PageHeader({
  title,
  description,
  badge = null,
  action = null,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        justifyContent: "space-between",
        alignItems: { xs: "flex-start", sm: "center" },
        gap: 2,
        mb: 3.5,
      }}
    >
      <Box>
        <Stack direction="row" spacing={1.5} alignItems="center">
          <Typography
            variant="h4"
            fontWeight={800}
            sx={{
              letterSpacing: "-0.035em",
              color: "#0F172A",
              fontSize: { xs: "1.5rem", sm: "1.85rem" },
            }}
          >
            {title}
          </Typography>
          {badge}
        </Stack>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mt: 0.5, fontSize: "0.92rem" }}
          >
            {description}
          </Typography>
        )}
      </Box>

      {action && <Box sx={{ alignSelf: { xs: "stretch", sm: "auto" } }}>{action}</Box>}
    </Box>
  );
}

export default PageHeader;