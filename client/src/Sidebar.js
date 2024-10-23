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

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const hasAccessRights = (requiredRights) => {
    if (!user || !user.accessRights) return false;
    return requiredRights.some(right => user.accessRights.includes(right));
  };

  const navItems = [
    { name: "Dashboard", icon: <Home />, path: "/", children: [] },
    {
      name: "Assets and Facilities",
      icon: <Briefcase />,
      path: "/assets",
      children: ['Subitem 1', 'Subitem 2'],
      accessRights: ['View Assets', 'Manage Assets']
    },
    {
      name: "Manpower",
      icon: <Users />,
      path: "/manpower",
      children: [
        { name: 'Inquiries and Feedback', accessRights: ['View Inquiries and Feedbacks', 'Create Inquiries and Feedback'] },
        { name: 'Training Program', accessRights: ['Enrol Training Program'] },
        { name: 'Operator Requisition', accessRights: ['View Operator Requisitions', 'Create Operator Requisition'] }
      ],
      accessRights: ['View Inquiries and Feedbacks', 'Create Inquiries and Feedback', 'Enrol Training Program', 'View Operator Requisitions', 'Create Operator Requisition']
    },
    {
      name: "Vessel Visits",
      icon: <Anchor />,
      path: "/vessels",
      children: [
        { name: 'Vessel Visit Request', accessRights: ['View Vessel Visit Requests', 'Create Vessel Visit Request', 'Edit Vessel Visit Requests', 'Delete Vessel Visit Requests'] }
      ],
      accessRights: ['View Vessel Visit Requests', 'Create Vessel Visit Request', 'Edit Vessel Visit Requests', 'Delete Vessel Visit Requests']
    },
    {
      name: "Port Operations and Resources",
      icon: <Clock />,
      path: "/operations",
      children: ['Subitem 1', 'Subitem 2'],
      accessRights: ['View Port Operations', 'Manage Port Operations']
    },
    {
      name: "Cargos",
      icon: <Package />,
      path: "/cargos",
      children: [
        { name: 'Cargo Manifest', accessRights: ['View Cargo Manifests', 'Submit Cargo Manifest', 'Update Cargo Manifest', 'Delete Cargo Manifest'] },
        { name: 'Container Request', accessRights: ['Create Container Request', 'View Container Request'] },
        { name: 'Container Pricing Manager', accessRights: ['Create Container Pricings', 'View Container Pricings'] },
        { name: 'Container Menu', accessRights: ['Create Container Menu', 'View Container Menu'] },
        { name: 'Truck Registration', accessRights: ['Register Truck', 'View Truck Registrations'] }
      ],
      accessRights: ['View Cargo Manifests', 'Submit Cargo Manifest', 'Update Cargo Manifest', 'Delete Cargo Manifest', 'Create Container Request', 'View Container Request', 'Create Container Pricings', 'View Container Pricings', 'Create Container Menu', 'View Container Menu', 'Register Truck', 'View Truck Registrations']
    },
    {
      name: "Customs and Trade Documents",
      icon: <FileText />,
      path: "/documents",
      children: ['Subitem 1', 'Subitem 2'],
      accessRights: ['View Documents', 'Manage Documents']
    },

    {
      name: "Settings",
      icon: <Settings />,
      path: "/settings",
      children: [
        { name: 'Users', accessRights: ['View Users List', 'Delete User', 'Invite User', 'Delete User Invitations', 'View Invitations List'] },
        { name: 'Company', accessRights: ['View Company Information', 'Edit Company Information'] }
      ],
      accessRights: ['View Company Information', 'Edit Company Information', 'View Users List', 'Delete User', 'Invite User', 'Delete User Invitations', 'View Invitations List']
    },
  ];


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
    return typeof subitem === 'object' && subitem.accessRights;
  };

  const isActive = (path, subitem) => {
    let fullPath = path;
    if (subitem) {
      fullPath += `/${(typeof subitem === 'string' ? subitem : subitem.name).toLowerCase().replace(/ /g, '-')}`;
    }
    return location.pathname === fullPath;
  };

  const canAccessNavItem = (item) => {
    if (!item.accessRights) return true;
    return hasAccessRights(item.accessRights);
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
          mt: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto' }}>
        <List>
          {navItems.map((item, index) => (
            canAccessNavItem(item) && (
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
                        isSubitemBuilt(subitem) && hasAccessRights(subitem.accessRights) && (
                          <ListItem
                            button
                            key={subIndex}
                            sx={{
                              pl: 4,
                              bgcolor: isActive(item.path, subitem) ? 'action.selected' : 'inherit',
                              '&:hover': {
                                bgcolor: 'action.hover',
                              },
                            }}
                            onClick={() => handleNavigation(item.path, subitem.name)}
                          >
                            <ListItemText
                              primary={subitem.name}
                              primaryTypographyProps={{
                                style: {
                                  fontWeight: isActive(item.path, subitem) ? 'bold' : 'normal',
                                }
                              }}
                            />
                          </ListItem>
                        )
                      ))}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            )
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;