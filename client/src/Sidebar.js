import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Briefcase, Users, Anchor, Clock, Package, DollarSign, FileText, Settings } from 'lucide-react';
import { List, ListItem, ListItemIcon, ListItemText, Collapse, Drawer, Box } from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const drawerWidth = 240;
const headerHeight = 64;

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState({});
  const navigate = useNavigate();

  const navItems = [
    { name: "Dashboard", icon: <Home />, path: "/", children: [] },
    { name: "Assets and Facilities", icon: <Briefcase />, path: "/assets", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Manpower", icon: <Users />, path: "/manpower", children: ['Inquiries and Feedback', 'Training Program', 'Operator Requisition'] },
    { name: "Vessel Visits", icon: <Anchor />, path: "/vessels", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Port Operations and Resources", icon: <Clock />, path: "/operations", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Cargos", icon: <Package />, path: "/cargos", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Financial", icon: <DollarSign />, path: "/financial", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Customs and Trade Documents", icon: <FileText />, path: "/documents", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Settings", icon: <Settings />, path: "/settings", children: ['Users', 'Company'] }
  ];

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNavigation = (path, subitem) => {
    const fullPath = subitem ? `${path}/${subitem.toLowerCase().replace(/ /g, '-')}` : path;
    navigate(fullPath);
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
          mt: `${headerHeight}px`,
          height: `calc(100% - ${headerHeight}px)`,
          overflowY: 'auto',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', height: '100%' }}>
        <List>
          {navItems.map((item, index) => (
            <div key={index}>
              <ListItem 
                button 
                onClick={() => item.children.length > 0 ? toggleExpand(index) : handleNavigation(item.path)}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.name} />
                {item.children.length > 0 && (expandedItems[index] ? <ExpandLess /> : <ExpandMore />)}
              </ListItem>
              <Collapse in={expandedItems[index]} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {item.children.map((subitem, subIndex) => (
                    <ListItem
                      button
                      key={subIndex}
                      sx={{ pl: 4 }}
                      onClick={() => handleNavigation(item.path, subitem)}
                    >
                      <ListItemText primary={subitem} />
                    </ListItem>
                  ))}
                </List>
              </Collapse>
            </div>
          ))}
        </List>
      </Box>
    </Drawer>
  );
};

export default Sidebar;