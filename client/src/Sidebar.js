import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Box,
} from "@mui/material";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import {
  Home,
  Briefcase,
  Users,
  Anchor,
  Clock,
  Package,
  Settings,
  DollarSign,
  FileText,
} from "lucide-react";

const drawerWidth = 240;

const Sidebar = ({ user }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState({});

  const hasAccessRights = (requiredRights) => {
    if (!user || !user.accessRights) return false;
    return requiredRights.some((right) => user.accessRights.includes(right));
  };

  const navItems = [
    { name: "Dashboard", icon: <Home />, path: "/", children: [] },
    {
      name: "Assets and Facilities",
      icon: <Briefcase />,
      path: "/assets",
      children: ["Subitem 1", "Subitem 2"],
      accessRights: ["View Assets", "Manage Assets"],
    },
    {
      name: "Manpower",
      icon: <Users />,
      path: "/manpower",
      children: [
        {
          name: "Inquiries and Feedback",
          accessRights: [
            "View Inquiries and Feedbacks",
            "Create Inquiries and Feedback",
          ],
        },
        { name: "Training Program", accessRights: ["Enrol Training Program"] },
        {
          name: "Operator Requisition",
          accessRights: [
            "View Operator Requisitions",
            "Create Operator Requisition",
          ],
        },
      ],
      accessRights: [
        "View Inquiries and Feedbacks",
        "Create Inquiries and Feedback",
        "Enrol Training Program",
        "View Operator Requisitions",
        "Create Operator Requisition",
      ],
    },
    {
      name: "Vessel Visits",
      icon: <Anchor />,
      path: "/vessels",
      children: [
        {
          name: "Vessel Visit Request",
          accessRights: [
            "View Vessel Visit Requests",
            "Create Vessel Visit Request",
            "Edit Vessel Visit Requests",
            "Delete Vessel Visit Requests",
          ],
        },
        {
          name: "Ad Hoc Resource Request",
          accessRights: [
            "View Ad Hoc Resource Requests",
            "Create Ad Hoc Resource Request",
          ],
        },
      ],
      accessRights: [
        "View Vessel Visit Requests",
        "Create Vessel Visit Request",
        "Edit Vessel Visit Requests",
        "Delete Vessel Visit Requests",
        "View Ad Hoc Resource Requests",
        "Create Ad Hoc Resource Request",
      ],
    },
    {
      name: "Port Operations and Resources",
      icon: <Clock />,
      path: "/operations",
      children: ["Subitem 1", "Subitem 2"],
      accessRights: ["View Port Operations", "Manage Port Operations"],
    },
    {
      name: "Cargos",
      icon: <Package />,
      path: "/cargos",
      children: [
        { name: "Booking Form", accessRights: ["Create Cargo Booking"] },
        {
          name: "Container Request",
          accessRights: ["Create Container Request", "View Container Request"],
        },
        {
          name: "Truck Registration",
          accessRights: ["Register Truck", "View Truck Registrations"],
        },
        {
          name: "Cargo Manifest",
          accessRights: [
            "View Cargo Manifests",
            "Submit Cargo Manifest",
            "Update Cargo Manifest",
            "Delete Cargo Manifest",
          ],
        },
        {
          name: "Container Pricing Manager",
          accessRights: [
            "Create Container Pricings",
            "View Container Pricings",
          ],
        },
        {
          name: "Container Menu",
          accessRights: ["Create Container Menu", "View Container Menu"],
        },
        {
          name: "Container Requests List",
          accessRights: [
            "View Container Requests",
            "Approve Container Requests",
          ],
        },
        {
          name: "Facility and Space Rental",
          accessRights: ["Create Facility Rental"],
        },
        { name: "Cargo Sampling", accessRights: ["Create Sampling Request"] },
        { name: "Cargo Repacking", accessRights: ["Create Repacking Request"] },
        { name: "Cargo Storage", accessRights: ["Create Storage Request"] },
        {
          name: "Cargo Transloading",
          accessRights: ["Create Transloading Request"],
        },
      ],
      accessRights: [
        "Create Cargo Booking",
        "Create Facility Rental",
        "View Cargo Manifests",
        "Submit Cargo Manifest",
        "Update Cargo Manifest",
        "Delete Cargo Manifest",
        "Create Container Request",
        "View Container Request",
        "Create Container Pricings",
        "View Container Pricings",
        "Create Container Menu",
        "View Container Menu",
        "Register Truck",
        "View Truck Registrations",
        "View Container Requests",
        "Approve Container Requests",
        "Create Sampling Request",
        "Create Repacking Request",
        "Create Storage Request",
        "Create Transloading Request",
      ],
    },
    {
      name: "Customs and Trade Documents",
      icon: <FileText />,
      path: "/customs-and-trade-documents",
      children: [
        {
          name: "Electronic Trade Documents",
          accessRights: ["View Documents"],
        },
        { name: "Document Manager", accessRights: ["Manage Documents"] },
      ],
      accessRights: ["View Documents", "Manage Documents"],
    },
    {
      name: "Financial",
      icon: <DollarSign />,
      path: "/financial",
      children: [
        { name: "Billing Requests", accessRights: ["View Billing Requests"] },
        { name: "Invoice", accessRights: ["View Invoice"] },
        { name: "Pricing Rates", accessRights: ["View Invoice"] },
      ],
      accessRights: ["View Billing Requests"],
    },
    {
      name: "Settings",
      icon: <Settings />,
      path: "/settings",
      children: [
        {
          name: "Users",
          accessRights: [
            "View Users List",
            "Delete User",
            "Invite User",
            "Delete User Invitations",
            "View Invitations List",
          ],
        },
        {
          name: "Company",
          accessRights: [
            "View Company Information",
            "Edit Company Information",
          ],
        },
      ],
      accessRights: [
        "View Company Information",
        "Edit Company Information",
        "View Users List",
        "Delete User",
        "Invite User",
        "Delete User Invitations",
        "View Invitations List",
      ],
    },
  ];

  const toggleExpand = (index) => {
    setExpandedItems((prev) => ({ ...prev, [index]: !prev[index] }));
  };

  const handleNavigation = (path, subitem) => {
    let fullPath = path;
    if (subitem) {
      fullPath += `/${subitem.toLowerCase().replace(/ /g, "-")}`;
    }
    navigate(fullPath);
  };

  const isSubitemBuilt = (subitem) => {
    return typeof subitem === "object" && subitem.accessRights;
  };

  const isActive = (path, subitem) => {
    let fullPath = path;
    if (subitem) {
      fullPath += `/${(typeof subitem === "string" ? subitem : subitem.name)
        .toLowerCase()
        .replace(/ /g, "-")}`;
    }
    return location.pathname === fullPath;
  };

  const canAccessNavItem = (item) => {
    if (!item.accessRights) return true;
    return hasAccessRights(item.accessRights);
  };

  return (
    <>
      {user?.email !== "agency@gmail.com" && (
        <Drawer
          variant="permanent"
          sx={{
            width: drawerWidth,
            flexShrink: 0,
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              mt: "64px",
              height: "calc(100% - 64px)",
              backgroundColor: "#f8f9fa",
              borderRight: "1px solid rgba(0,0,0,0.1)",
              "&::-webkit-scrollbar": {
                width: "6px",
                background: "transparent",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0,0,0,0.03)",
                borderRadius: "3px",
                margin: "4px",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(0,97,168,0.2)",
                borderRadius: "3px",
                "&:hover": {
                  background: "rgba(0,97,168,0.3)",
                },
                "&:active": {
                  background: "rgba(0,97,168,0.4)",
                },
              },
            },
          }}
        >
          <Box
            sx={{
              overflow: "auto",
              height: "100%",
              py: 1,
              scrollBehavior: "smooth",
            }}
          >
            <List sx={{ px: 1 }}>
              {navItems.map(
                (item, index) =>
                  canAccessNavItem(item) && (
                    <React.Fragment key={index}>
                      <ListItem
                        button
                        onClick={() =>
                          item.children.length > 0
                            ? toggleExpand(index)
                            : handleNavigation(item.path)
                        }
                        sx={{
                          borderRadius: "8px",
                          mb: 0.5,
                          color: "#2c3e50",
                          "&:hover": {
                            backgroundColor: "rgba(0,97,168,0.08)",
                          },
                          ...(isActive(item.path) && {
                            backgroundColor: "rgba(0,97,168,0.12)",
                            color: "#0061a8",
                            fontWeight: 500,
                          }),
                        }}
                      >
                        <ListItemIcon
                          sx={{
                            color: isActive(item.path) ? "#0061a8" : "#2c3e50",
                            minWidth: "36px",
                          }}
                        >
                          {item.icon}
                        </ListItemIcon>
                        <ListItemText
                          primary={item.name}
                          primaryTypographyProps={{
                            fontSize: "0.95rem",
                            fontWeight: isActive(item.path) ? 500 : 400,
                          }}
                        />
                        {item.children.length > 0 &&
                          (expandedItems[index] ? (
                            <ExpandLess />
                          ) : (
                            <ExpandMore />
                          ))}
                      </ListItem>
                      {item.children.length > 0 && (
                        <Collapse
                          in={expandedItems[index]}
                          timeout="auto"
                          unmountOnExit
                        >
                          <List component="div" disablePadding>
                            {item.children.map(
                              (subitem, subIndex) =>
                                isSubitemBuilt(subitem) &&
                                hasAccessRights(subitem.accessRights) && (
                                  <ListItem
                                    button
                                    key={subIndex}
                                    sx={{
                                      pl: 4,
                                      borderRadius: "8px",
                                      mb: 0.5,
                                      position: "relative", // Absolute positioning of side bar
                                      color: "#2c3e50",
                                      "&:hover": {
                                        backgroundColor: "rgba(0,97,168,0.08)",
                                      },
                                      ...(isActive(item.path, subitem) && {
                                        backgroundColor: "rgba(0,97,168,0.12)",
                                        color: "#0061a8",
                                        "&::before": {
                                          // Blue side bar
                                          content: '""',
                                          position: "absolute",
                                          left: 0,
                                          top: "50%",
                                          transform: "translateY(-50%)",
                                          height: "60%",
                                          width: "3px",
                                          backgroundColor: "#0061a8",
                                          borderRadius: "0 3px 3px 0",
                                        },
                                      }),
                                    }}
                                    onClick={() =>
                                      handleNavigation(item.path, subitem.name)
                                    }
                                  >
                                    <ListItemText
                                      primary={subitem.name}
                                      primaryTypographyProps={{
                                        fontSize: "0.875rem",
                                        fontWeight: isActive(item.path, subitem)
                                          ? 600
                                          : 400, // Bold text when active
                                        color: isActive(item.path, subitem)
                                          ? "#0061a8"
                                          : "inherit",
                                      }}
                                    />
                                  </ListItem>
                                )
                            )}
                          </List>
                        </Collapse>
                      )}
                    </React.Fragment>
                  )
              )}
            </List>
          </Box>
        </Drawer>
      )}
    </>
  );
};

export default Sidebar;
