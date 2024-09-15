import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, Briefcase, Users, Anchor, Clock, Package, DollarSign, FileText, Settings } from 'lucide-react';
import { List, ListItem, ListItemIcon, ListItemText, Collapse, Drawer, Box, IconButton } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import AccessibilityIcon from '@mui/icons-material/Accessibility';

const drawerWidth = 240;
const headerHeight = 64;

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState({});
  const navigate = useNavigate();
  const location = useLocation();
  const listRef = useRef(null);

  const navItems = useMemo(() => [
    { name: "Dashboard", icon: <Home />, path: "/", children: [] },
    { name: "Accounts Management", icon: <AccessibilityIcon />, path: "/accounts", children: ['Client List', 'Client Request', 'Client Users List', 'Client Users Request'] },
    { name: "Assets and Facilities", icon: <Briefcase />, path: "/assets", children: ['Asset Management', 'Location Tracking', 'Predictive Management Regime', 'Preventive Maintenance Regime', 'Asset Redeployment Strategy', 'Capacity Planning', 'Data Analytics and Reporting'] },
    { name: "Manpower", icon: <Users />, path: "/manpower", children: ['Invitations','HR Management', 'Training Management', 'Work Scheduling'] },
    { name: "Vessel Visits", icon: <Anchor />, path: "/vessels", children: ['Scheduled Vessel Request', 'Ad-Hoc Vessel Request', 'Resource Reservation'] },
    { name: "Port Operations and Resources", icon: <Clock />, path: "/operations", children: ['Berth Management', 'Staging Area Resource Management', 'Container Yard Space Management', 'Auxiliary Resource Management', 'Specialized Equipment Management'] },
    { name: "Cargos", icon: <Package />, path: "/cargos", children: ['Cargo Tracking', 'Cargo Manifest Management', 'Value-Added Services Management', 'Facility and Space Rental Management', 'RFID Management'] },
    { name: "Financial", icon: <DollarSign />, path: "/financial", children: ['Payment Process', 'Commercial Account Management', 'Financial Reporting'] },
    { name: "Customs and Trade Documents", icon: <FileText />, path: "/documents", children: ['Electronic Trade Application'] },
    { name: "Settings", icon: <Settings />, path: "/settings", children: ['Configuration', 'Users'] },
  ], []);

  useEffect(() => {
    const currentPath = location.pathname;
    setExpandedItems(prevExpanded => {
      const newExpanded = { ...prevExpanded };
      navItems.forEach((item, index) => {
        if (currentPath.startsWith(item.path)) {
          newExpanded[index] = true;
        }
      });
      return newExpanded;
    });
  }, [location.pathname, navItems]);

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNavigation = (path) => {
    navigate(path);
  };

  return (
    <Drawer
      variant="permanent"
      anchor="left"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          height: `calc(100% - ${headerHeight}px)`,
          top: `${headerHeight}px`,
          overflow: 'hidden',
        },
      }}
    >
      <Box
        sx={{
          overflowY: 'auto',
          height: '100%',
          '&::-webkit-scrollbar': {
            width: '6px',
            backgroundColor: '#F5F5F5',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: '#888',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#555',
          },
        }}
        ref={listRef}
      >
        <List>
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem
                button
                onClick={() => item.children.length > 0 ? toggleExpand(index) : handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} />
                {item.children.length > 0 && (
                  <IconButton onClick={(e) => {
                    e.stopPropagation();
                    toggleExpand(index);
                  }} size="small">
                    {expandedItems[index] ? <ExpandLess /> : <ExpandMore />}
                  </IconButton>
                )}
              </ListItem>
              <Collapse in={expandedItems[index]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((subitem, subIndex) => (
                    <ListItem
                      button
                      key={subIndex}
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigation(`${item.path}/${subitem.toLowerCase().replace(/ /g, '-')}`)}
                    >
                      <ListItemText primary={subitem} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;