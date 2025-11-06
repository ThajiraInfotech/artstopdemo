import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Button } from "../ui/button";

const AdminNavbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("artstop_admin");
    navigate("/admin/login", { replace: true });
  };

  const linkBase =
    "px-3 py-2 rounded-md text-sm font-medium transition-colors";
  const linkInactive = "text-gray-600 hover:text-indigo-600 hover:bg-indigo-50";
  const linkActive = "text-white bg-indigo-600";

  return (
    <div className="w-full fixed top-0 left-0 right-0 z-50">
      <nav className="bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/artstoplogo.png"
              alt="ArtStop"
              className="h-8 w-auto object-contain drop-shadow-sm"
            />
            <span className="inline-flex items-center text-sm font-medium text-indigo-700 bg-indigo-50 border border-indigo-200 rounded-full px-2.5 py-0.5">
              Admin
            </span>
          </div>

          {/* Links */}
          <div className="hidden md:flex items-center gap-2">
            <NavLink
              to="/admin/dashboard"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Products
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Products
            </NavLink>
            <NavLink
              to="/admin/customers"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Customers
            </NavLink>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden sm:inline-flex border-gray-300"
              onClick={() => navigate("/", { replace: false })}
            >
              View Store
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </div>

        {/* Mobile links */}
        <div className="md:hidden border-t border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 flex items-center gap-2">
            <NavLink
              to="/admin/dashboard"
              end
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Products
            </NavLink>
            <NavLink
              to="/admin/orders"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Orders
            </NavLink>
            <NavLink
              to="/admin/customers"
              className={({ isActive }) =>
                `${linkBase} ${isActive ? linkActive : linkInactive}`
              }
            >
              Customers
            </NavLink>
          </div>
        </div>
      </nav>
    </div>
  );
};

export default AdminNavbar;