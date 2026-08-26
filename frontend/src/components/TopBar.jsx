import {
  AppBar,
  Toolbar,
  Typography,
} from "@mui/material";

const drawerWidth = 240;

function TopBar() {
  return (
    <AppBar
      position="fixed"
      color="inherit"
      elevation={1}
      sx={{
        width: `calc(100% - ${drawerWidth}px)`,
        ml: `${drawerWidth}px`,
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          fontWeight={600}
        >
          Operations
        </Typography>
      </Toolbar>
    </AppBar>
  );
}

export default TopBar;