import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Briefcase, Users, Anchor, Archive, DollarSign, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const navItems = [
    { name: "Dashboard", icon: Home, path: "/" },
    { name: "Assets and Facilities", icon: Briefcase, path: "/assets" },
    { name: "Manpower", icon: Users, path: "/manpower" },
    { name: "Vessel Visits", icon: Anchor, path: "/vessels" },
    { name: "Port Operations and Resources", icon: Archive, path: "/operations" },
    { name: "Cargos", icon: Archive, path: "/cargos" },
    { name: "Financial", icon: DollarSign, path: "/financial" },
    { name: "Customs and Trade Documents", icon: FileText, path: "/documents" },
    { name: "Settings", icon: Settings, path: "/settings/profile" }
  ];

  return (
    <aside className="w-64 bg-white shadow-md">
      <div className="p-4 border-b">
        <h1 className="text-2xl font-bold flex items-center">
          <span className="mr-2">🚢</span> Oceania PMIS
        </h1>
      </div>
      <nav className="mt-4">
        {navItems.map((item, index) => (
          <Link
            key={index}
            to={item.path}
            className={`flex items-center p-4 hover:bg-gray-200 ${
              location.pathname === item.path ? 'bg-gray-200' : ''
            }`}
          >
            <item.icon className="mr-3" size={20} />
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;