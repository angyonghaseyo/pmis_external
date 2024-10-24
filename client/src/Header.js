import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signOut } from './firebaseConfig';
import { Box, AppBar, Toolbar, IconButton, Menu, MenuItem, Typography, Avatar, Button, Select, FormControl, CircularProgress } from '@mui/material';
import { Notifications, Logout, Person, DirectionsBoat } from '@mui/icons-material';

function Header() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null);
  const [language, setLanguage] = useState('EN');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
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

  if (loading) {
    return (
      <AppBar position="fixed" sx={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', zIndex: 1300 }}>
        <Toolbar>
          <CircularProgress />
        </Toolbar>
      </AppBar>
    );
  }

  return (
    <AppBar
      position="fixed"
      sx={{
        backgroundColor: '#ffffff',
        background: 'linear-gradient(135deg, #0061a8 0%, #003b6f 100%)',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        zIndex: 1300
      }}
    >
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left Section */}
        <Box display="flex" alignItems="center">
          <DirectionsBoat sx={{
            color: '#ffffff',
            fontSize: 30,
            marginRight: 1,
            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
          }} />
          <Typography
            variant="h6"
            component={Link}
            to="/"
            sx={{
              textDecoration: 'none',
              color: '#ffffff',
              fontWeight: 'bold',
              letterSpacing: '0.5px',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)'
            }}
          >
            Oceania PMIS
          </Typography>
        </Box>

        {/* Right Section - Language Select, Notifications, and User Profile/Login */}
        <Box display="flex" alignItems="center" gap={2}>
          <FormControl size="small">
            <Select
              value={language}
              onChange={handleLanguageChange}
              sx={{
                backgroundColor: 'rgba(255,255,255,0.1)',
                color: '#ffffff',
                '& .MuiSelect-icon': { color: '#ffffff' },
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.2)'
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'rgba(255,255,255,0.3)'
                }
              }}
              displayEmpty
              inputProps={{ 'aria-label': 'Language Select' }}
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
                  color: '#ffffff',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
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
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 280,
                    maxHeight: 400,
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,97,168,0.1)',
                    '& .MuiMenuItem-root': {
                      px: 2,
                      py: 1.5,
                      borderBottom: '1px solid rgba(0,0,0,0.06)',
                      '&:last-child': {
                        borderBottom: 'none',
                      },
                      '&:hover': {
                        backgroundColor: 'rgba(0,97,168,0.08)',
                      },
                    },
                  },
                }}
              >
                <Box sx={{
                  p: 2,
                  borderBottom: '1px solid rgba(0,0,0,0.06)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#2c3e50' }}>
                    Notifications
                  </Typography>
                </Box>
                <MenuItem onClick={handleNotificationClose}>
                  <Box sx={{ width: '100%' }}>
                    <Typography variant="body2" sx={{ color: '#2c3e50' }}>
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
                  border: '2px solid rgba(255,255,255,0.2)',
                  '&:hover': {
                    backgroundColor: 'rgba(255,255,255,0.1)'
                  }
                }}
              >
                {user.photoURL ? (
                  <Avatar
                    src={user.photoURL}
                    sx={{
                      width: 36,
                      height: 36,
                      backgroundColor: '#ffffff'
                    }}
                  />
                ) : (
                  <Avatar sx={{
                    width: 36,
                    height: 36,
                    backgroundColor: '#ffffff',
                    color: '#0061a8'
                  }}>
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
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                PaperProps={{
                  sx: {
                    mt: 1.5,
                    minWidth: 200,
                    borderRadius: '8px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                    border: '1px solid rgba(0,97,168,0.1)',
                    '& .MuiMenuItem-root': {
                      px: 2,
                      py: 1.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      color: '#2c3e50',
                      '&:hover': {
                        backgroundColor: 'rgba(0,97,168,0.08)',
                      },
                    },
                  },
                }}
              >
                <MenuItem onClick={() => {
                  navigate('/settings/profile');
                  handleProfileMenuClose();
                }}>
                  <Person sx={{ color: '#0061a8' }} />
                  <span>Edit Profile</span>
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    handleLogout();
                    handleProfileMenuClose();
                  }}
                  sx={{
                    color: '#dc3545 !important',
                    '&:hover': {
                      backgroundColor: 'rgba(220,53,69,0.08) !important',
                    },
                  }}
                >
                  <Logout sx={{ color: '#dc3545' }} />
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
                backgroundColor: '#ffffff',
                color: '#0061a8',
                textTransform: 'none',
                fontWeight: 500,
                '&:hover': {
                  backgroundColor: 'rgba(255,255,255,0.9)'
                }
              }}
            >
              Login
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;