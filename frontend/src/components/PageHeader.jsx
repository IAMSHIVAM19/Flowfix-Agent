import { Box, Typography } from "@mui/material";

function PageHeader({
  title,
  description,
  action = null,
}) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        gap: 2,
        mb: 3,
      }}
    >
      <Box>
        <Typography
          variant="h4"
          fontWeight={700}
          gutterBottom
        >
          {title}
        </Typography>

        {description && (
          <Typography
            variant="body2"
            color="text.secondary"
          >
            {description}
          </Typography>
        )}
      </Box>

      {action && <Box>{action}</Box>}
    </Box>
  );
}

export default PageHeader;