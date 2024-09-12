import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Home, Briefcase, Users, Anchor, Clock, Package, DollarSign, FileText, Settings, ChevronRight } from 'lucide-react';

const Sidebar = () => {
  const [expandedItems, setExpandedItems] = useState({});

  const navItems = [
    { name: "Dashboard", icon: Home, path: "/", children: [] },
    { name: "Assets and Facilities", icon: Briefcase, path: "/assets", children: [] },
    { name: "Manpower", icon: Users, path: "/manpower", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Vessel Visits", icon: Anchor, path: "/vessels", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Port Operations and Resources", icon: Clock, path: "/operations", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Cargos", icon: Package, path: "/cargos", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Financial", icon: DollarSign, path: "/financial", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Customs and Trade Documents", icon: FileText, path: "/documents", children: ['Subitem 1', 'Subitem 2'] },
    { name: "Settings", icon: Settings, path: "/settings", children: ['Subitem 1', 'Subitem 2'] }
  ];

  const toggleExpand = (index) => {
    setExpandedItems(prev => ({ ...prev, [index]: !prev[index] }));
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        {navItems.map((item, index) => (
          <div key={index}>
            <NavLink
              to={item.path}
              className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
              onClick={() => item.children.length > 0 && toggleExpand(index)}
            >
              <item.icon className="sidebar-icon" size={20} />
              <span>{item.name}</span>
              {item.children.length > 0 && (
                <ChevronRight
                  className={`sidebar-chevron ${expandedItems[index] ? 'expanded' : ''}`}
                  size={20}
                />
              )}
            </NavLink>
            {expandedItems[index] && item.children.length > 0 && (
              <div className="sidebar-submenu">
                {item.children.map((subitem, subIndex) => (
                  <NavLink
                    key={subIndex}
                    to={`${item.path}/${subitem.toLowerCase().replace(' ', '-')}`}
                    className="sidebar-sublink"
                  >
                    {subitem}
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;