import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, signOut } from './firebaseConfig';
import { Box, AppBar, Toolbar, IconButton, Menu, MenuItem, Typography, Avatar, Select, FormControl } from '@mui/material';
import { Notifications, Logout, Person, DirectionsBoat } from '@mui/icons-material';

function Header() {
  const [user, setUser] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null); // For user profile menu
  const [notificationAnchorEl, setNotificationAnchorEl] = useState(null); // For notifications
  const [language, setLanguage] = useState('EN');
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
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

  return (
    <AppBar position="fixed" sx={{ backgroundColor: '#ffffff', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)', zIndex: 1300 }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        {/* Left Section - Boat Icon and Oceania PMIS */}
        <Box display="flex" alignItems="center">
          <DirectionsBoat sx={{ color: '#25316D', fontSize: 30, marginRight: 1 }} />
          <Typography 
            variant="h6" 
            component={Link} 
            to="/" 
            sx={{ textDecoration: 'none', color: '#25316D', fontWeight: 'bold' }}>
            Oceania PMIS
          </Typography>
        </Box>

        {/* Right Section - Language Select, Notifications, and User Profile */}
        <Box display="flex" alignItems="center">
          <FormControl>
            <Select
              value={language}
              onChange={handleLanguageChange}
              sx={{ marginRight: 2 }}
              displayEmpty
              inputProps={{ 'aria-label': 'Language Select' }}
            >
              <MenuItem value="EN">EN</MenuItem>
              <MenuItem value="FR">FR</MenuItem>
              <MenuItem value="ES">ES</MenuItem>
            </Select>
          </FormControl>

          {user && (
            <IconButton onClick={handleNotificationClick} color="inherit" sx={{ marginRight: 2 }}>
              <Notifications sx={{ color: '#25316D' }} />
            </IconButton>
          )}

          {/* Notification Menu */}
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleNotificationClose}
            keepMounted
          >
            <MenuItem onClick={handleNotificationClose}>No new notifications</MenuItem>
          </Menu>

          {/* User Avatar and Profile Menu */}
          <IconButton onClick={handleProfileMenuClick} color="inherit">
            {user?.photoURL ? (
              <Avatar src={user.photoURL} />
            ) : (
              <Avatar>
                <Person />
              </Avatar>
            )}
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            keepMounted
          >
            <MenuItem onClick={() => navigate('/settings/profile')}>
              <Person sx={{ marginRight: 1 }} /> Edit Profile
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <Logout sx={{ marginRight: 1 }} /> Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}

export default Header;
