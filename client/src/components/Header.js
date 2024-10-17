import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  IconButton, 
  Menu, 
  MenuItem, 
  Box,
  Avatar,
  Tooltip
} from '@mui/material';
import {
  Menu as MenuIcon,
  AccountCircle,
  Notifications,
  Settings,
  Logout
} from '@mui/icons-material';

function Header({ user, onLogout }) {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    onLogout();
    handleClose();
    navigate('/login');
  };

  return (
    <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar>
        <IconButton
          size="large"
          edge="start"
          color="inherit"
          aria-label="menu"
          sx={{ mr: 2 }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          🚢 Oceania PMIS
        </Typography>
        {user ? (
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Tooltip title="Notifications">
              <IconButton color="inherit">
                <Notifications />
              </IconButton>
            </Tooltip>
            <Tooltip title="Account settings">
              <IconButton
                size="large"
                aria-label="account of current user"
                aria-controls="menu-appbar"
                aria-haspopup="true"
                onClick={handleMenu}
                color="inherit"
              >
                {user.photoURL ? (
                  <Avatar alt={user.displayName} src={user.photoURL} />
                ) : (
                  <AccountCircle />
                )}
              </IconButton>
            </Tooltip>
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem onClick={() => { handleClose(); navigate('/settings/profile'); }}>
                <AccountCircle sx={{ mr: 1 }} /> Profile
              </MenuItem>
              <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
                <Settings sx={{ mr: 1 }} /> Settings
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <Logout sx={{ mr: 1 }} /> Logout
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button color="inherit" component={Link} to="/login">Login</Button>
        )}
      </Toolbar>
    </AppBar>
  );
}

export default Header;