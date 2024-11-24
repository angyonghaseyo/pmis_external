import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  IconButton,
  Menu,
  MenuItem,
  Typography,
  Avatar,
  Button,
  Select,
  FormControl,
  CircularProgress,
  useTheme,
} from "@mui/material";
import {
  Notifications,
  Logout,
  Person,
} from "@mui/icons-material";
import { useAuth } from "./AuthContext";
import logo from "./images/PortConnect-external.png";

function Header() {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [language, setLanguage] = useState("EN");
  const navigate = useNavigate();
  const theme = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleLanguageChange = (event) => {
    setLanguage(event.target.value);
  };

  const handleProfileMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (event) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleNotificationClose = () => {
    setNotificationAnchorEl(null);
  };

  if (!user) {
    return (
      <AppBar
        position="fixed"
        sx={{
          backgroundColor: "#ffffff",
          boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
          zIndex: 1300,
        }}
      >
        <Toolbar>
          <CircularProgress />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <>
    {user?.email !== "agency@gmail.com" && (
      <AppBar
      position="fixed"
      sx={{
        backgroundColor: "#ffffff",
        background: "linear-gradient(135deg, #0061a8 0%, #003b6f 100%)",
        boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
        zIndex: 1300,
      }}
    >
      <Toolbar
        sx={{ justifyContent: "space-between", minHeight: "64px", px: 3 }}
      >
        {/* Left Section */}
        <Box display="flex" alignItems="center" gap={2}>
          {/* <DirectionsBoat sx={{
            color: '#ffffff',
            fontSize: 30,
            marginRight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }} /> */}
          <img
            src={logo}
            alt="PortConnect Logo (External)"
            style={{
              height: "40px",
              width: "auto",
            }}
          />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: "none",
              color: "#ffffff",
              fontWeight: 600,
              letterSpacing: "0.5px",
              textShadow: "0 2px 4px rgba(0,0,0,0.2)",
              "&:hover": {
                color: "#60a5fa",
              },
            }}
          >
            PortConnect Client System
          </Typography>
        </Box>

        {/* Right Section - Language Select, Notifications, and User Profile/Login */}
        <Box display="flex" alignItems="center" gap={2}>
        {user && (
            <Typography
              variant="caption"
              sx={{
                color: "rgba(255,255,255,0.9)",
                backgroundColor: theme.palette.primary.main,
                padding: "4px 12px",
                borderRadius: "16px",
                fontWeight: "bold",
                // Responsive font sizing
                fontSize: {
                  xs: "0.65rem", // Extra small screens
                  sm: "0.7rem", // Small screens
                  md: "0.75rem", // Medium screens
                  lg: "0.8rem", // Large screens
                },
                // Make container responsive
                maxWidth: {
                  xs: "200px", // Extra small screens
                  sm: "300px", // Small screens
                  md: "400px", // Medium screens
                  lg: "none", // Large screens
                },
                // Handle text overflow
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {user
                ? `${user.email} - ${user.company || "Company X"}`
                : ""}
            </Typography>
          )}

          <FormControl size="small">
            <Select
              value={language}
              onChange={handleLanguageChange}
              sx={{
                backgroundColor: "rgba(255,255,255,0.1)",
                color: "#ffffff",
                "& .MuiSelect-icon": { color: "#ffffff" },
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.2)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: "rgba(255,255,255,0.3)",
                },
              }}
              displayEmpty
              inputProps={{ "aria-label": "Language Select" }}
            >
              <MenuItem value="EN">EN</MenuItem>
              <MenuItem value="FR">FR</MenuItem>
              <MenuItem value="ES">ES</MenuItem>
            </Select>
          </FormControl>

          {user ? (
            <>
              {/* Notifications Button */}
              <IconButton
                onClick={handleNotificationClick}
                sx={{
                  color: "#ffffff",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                <Notifications />
              </IconButton>

              {/* Notifications Menu */}
              <Menu
                anchorEl={notificationAnchorEl}
                open={Boolean(notificationAnchorEl)}
                onClose={handleNotificationClose}
                keepMounted
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 280,
                    maxHeight: 400,
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,97,168,0.1)",
                    "& .MuiMenuItem-root": {
                      px: 2,
                      py: 1.5,
                      borderBottom: "1px solid rgba(0,0,0,0.06)",
                      "&:last-child": {
                        borderBottom: "none",
                      },
                      "&:hover": {
                        backgroundColor: "rgba(0,97,168,0.08)",
                      },
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    borderBottom: "1px solid rgba(0,0,0,0.06)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, color: "#2c3e50" }}
                  >
                    Notifications
                  </Typography>
                </Box>
                <MenuItem onClick={handleNotificationClose}>
                  <Box sx={{ width: "100%" }}>
                    <Typography variant="body2" sx={{ color: "#2c3e50" }}>
                      No new notifications
                    </Typography>
                  </Box>
                </MenuItem>
              </Menu>

              {/* Profile Button */}
              <IconButton
                onClick={handleProfileMenuClick}
                sx={{
                  padding: 0.5,
                  border: "2px solid rgba(255,255,255,0.2)",
                  "&:hover": {
                    backgroundColor: "rgba(255,255,255,0.1)",
                  },
                }}
              >
                {user.photoURL ? (
                  <Avatar
                    src={user.photoURL}
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: "#ffffff",
                    }}
                  />
                ) : (
                  <Avatar
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: "#ffffff",
                      color: "#0061a8",
                    }}
                  >
                    <Person />
                  </Avatar>
                )}
              </IconButton>

              {/* Profile Menu */}
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleProfileMenuClose}
                keepMounted
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: "8px",
                    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
                    border: "1px solid rgba(0,97,168,0.1)",
                    "& .MuiMenuItem-root": {
                      px: 2,
                      py: 1.5,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                      color: "#2c3e50",
                      "&:hover": {
                        backgroundColor: "rgba(0,97,168,0.08)",
                      },
                    },
                  },
                }}
              >
                <MenuItem
                  onClick={() => {
                    navigate("/settings/profile");
                    handleProfileMenuClose();
                  }}
                >
                  <Person sx={{ color: "#0061a8" }} />
                  <span>Edit Profile</span>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleLogout();
                    handleProfileMenuClose();
                  }}
                  sx={{
                    color: "#dc3545 !important",
                    "&:hover": {
                      backgroundColor: "rgba(220,53,69,0.08) !important",
                    },
                  }}
                >
                  <Logout sx={{ color: "#dc3545" }} />
                  <span>Logout</span>
                </MenuItem>
              </Menu>
            </>
          ) : (
            <Button
              variant="contained"
              component={Link}
              to="/login"
              sx={{
                backgroundColor: "#ffffff",
                color: "#0061a8",
                textTransform: "none",
                fontWeight: 500,
                "&:hover": {
                  backgroundColor: "rgba(255,255,255,0.9)",
                },
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
      )}
  </>
  );
}

export default Header;
