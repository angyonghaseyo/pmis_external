import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  Collapse, 
  Box,
  Typography
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { 
  Home, 
  Briefcase, 
  Users, 
  Anchor, 
  Clock, 
  Package, 
  Settings, 
  FileText 
} from 'lucide-react';

const drawerWidth = 240;

const Sidebar = ({ userType }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const navItems = [
    { name: "Dashboard", icon: <Home />, path: "/", children: [] },
    { name: "Assets and Facilities", icon: <Briefcase />, path: "/assets", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Manpower", icon: <Users />, path: "/manpower", children: ['Inquiries and Feedback', 'Training Program', 'Operator Requisition'] },
    { name: "Vessel Visits", icon: <Anchor />, path: "/vessels", children: ['Vessel Visit Request'] },
    { name: "Port Operations and Resources", icon: <Clock />, path: "/operations", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Cargos", icon: <Package />, path: "/cargos", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Customs and Trade Documents", icon: <FileText />, path: "/documents", children: ['Subitem 1', 'Subitem 2'] },
  ];

  // Only show Settings for Admin users
  if (userType === 'Admin') {
    navItems.push({ name: "Settings", icon: <Settings />, path: "/settings", children: ['Users', 'Company'] });
  }

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNavigation = (path, subitem) => {
    let fullPath = path;
    if (subitem) {
      fullPath += `/${subitem.toLowerCase().replace(/ /g, '-')}`;
    }
    navigate(fullPath);
  };

  const isSubitemBuilt = (subitem) => {
    return subitem !== 'Subitem 1' && subitem !== 'Subitem 2';
  };

  const isActive = (path, subitem) => {
    let fullPath = path;
    if (subitem) {
      fullPath += `/${subitem.toLowerCase().replace(/ /g, '-')}`;
    }
    return location.pathname === fullPath;
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: drawerWidth,
          boxSizing: 'border-box',
          mt: '64px', // Adjust based on your app bar height
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {navItems.map((item, index) => (
            <React.Fragment key={index}>
              <ListItem
                button
                onClick={() => item.children.length > 0 ? toggleExpand(index) : handleNavigation(item.path)}
                sx={{
                  bgcolor: isActive(item.path) ? 'action.selected' : 'inherit',
                  '&:hover': {
                    bgcolor: 'action.hover',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} />
                {item.children.length > 0 && (expandedItems[index] ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              {item.children.length > 0 && (
                <Collapse in={expandedItems[index]} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children.map((subitem, subIndex) => (
                      <ListItem
                        button
                        key={subIndex}
                        sx={{
                          pl: 4,
                          bgcolor: isActive(item.path, subitem) ? 'action.selected' : 'inherit',
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                          color: !isSubitemBuilt(subitem) ? 'text.disabled' : 'inherit',
                        }}
                        onClick={() => isSubitemBuilt(subitem) && handleNavigation(item.path, subitem)}
                        disabled={!isSubitemBuilt(subitem)}
                      >
                        <ListItemText 
                          primary={subitem} 
                          primaryTypographyProps={{
                            style: {
                              fontWeight: isActive(item.path, subitem) ? 'bold' : 'normal',
                            }
                          }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;