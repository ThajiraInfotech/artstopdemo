import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";
import {
  LayoutDashboard,
  Package,
  Users,
  ShoppingCart,
  Plus,
  LogOut,
  BarChart3,
  Menu,
  X,
  Grid3X3
} from "lucide-react";

const AdminSidebar = () => {
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("artstop_admin");
    localStorage.removeItem("artstop_admin_token");
    navigate("/admin/login", { replace: true });
  };

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const linkBase = "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors";
  const linkInactive = "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50";
  const linkActive = "text-white bg-indigo-600 shadow-sm";

  const navItems = [
    {
      to: "/admin/dashboard",
      icon: LayoutDashboard,
      label: "Dashboard",
      end: true
    },
    {
      to: "/admin/categories",
      icon: Grid3X3,
      label: "Categories"
    },
    {
      to: "/admin/products",
      icon: Package,
      label: "Products"
    },
    {
      to: "/admin/orders",
      icon: ShoppingCart,
      label: "Orders"
    },
    {
      to: "/admin/customers",
      icon: Users,
      label: "Customers"
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="bg-white border-gray-300 shadow-sm"
        >
          {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-white border-r border-gray-200 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-300 ease-in-out
        w-64 lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <img
            src="/artstoplogo.png"
            alt="ArtStop"
            className="h-8 w-auto object-contain drop-shadow-sm"
          />
          <div>
            <span className="inline-flex items-center text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-0.5">
              Admin Panel
            </span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `${linkBase} ${isActive ? linkActive : linkInactive}`
            }
          >
            <item.icon className="h-5 w-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <Button
          variant="outline"
          className="w-full border-gray-300 justify-start"
          onClick={() => {
            navigate("/", { replace: false });
            closeMobileMenu();
          }}
        >
          <BarChart3 className="h-4 w-4 mr-2" />
          View Store
        </Button>
        <Button
          className="w-full bg-indigo-600 hover:bg-indigo-700 justify-start"
          onClick={handleLogout}
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
    </>
  );
};

export default AdminSidebar;