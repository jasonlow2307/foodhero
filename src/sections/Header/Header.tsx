import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, Map, PlusCircle, Utensils, LogOut, Menu, X } from "lucide-react";
import { auth } from "../../firebase/firebase";
import { signOut } from "firebase/auth";
import { enqueueSnackbar } from "notistack";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      enqueueSnackbar("Signed out successfully", { variant: "success" });
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
      enqueueSnackbar("Error signing out", { variant: "error" });
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="bg-white shadow-md sticky top-0 z-50">
      <div className="bg-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-50">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo.svg"
                  alt="Food Hero"
                  className="h-10 mr-3 w-auto"
                />
                <span className="font-bold bg-gradient-to-r from-green-500 to-blue-500 bg-clip-text text-transparent">
                  Food Hero
                </span>
              </Link>
            </div>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex md:items-center md:space-x-4">
            <Link
              to="/"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                isActive("/")
                  ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Home className="mr-1" size={18} />
              Home
            </Link>

            <Link
              to="/list"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                isActive("/list")
                  ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Map className="mr-1" size={18} />
              My Places
            </Link>

            <Link
              to="/add"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                isActive("/add")
                  ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <PlusCircle className="mr-1" size={18} />
              Add Place
            </Link>

            <Link
              to="/what-to-eat"
              className={`px-3 py-2 rounded-md text-sm font-medium flex items-center transition-colors ${
                isActive("/what-to-eat")
                  ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              <Utensils className="mr-1" size={18} />
              What To Eat
            </Link>

            <button
              onClick={handleSignOut}
              className="px-3 py-2 rounded-md text-sm font-medium flex items-center text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut className="mr-1" size={18} />
              Sign Out
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 focus:text-gray-900 transition-colors"
            >
              {isMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu with slide animation */}
      <div
        className={`md:hidden fixed top-16 left-0 w-full transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } bg-white shadow-lg z-40`}
      >
        <div className="pt-2 pb-3 space-y-1 shadow-inner bg-gray-50">
          <Link
            to="/"
            className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
              isActive("/")
                ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            <Home className="mr-2" size={18} />
            Home
          </Link>

          <Link
            to="/list"
            className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
              isActive("/list")
                ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            <Map className="mr-2" size={18} />
            My Places
          </Link>

          <Link
            to="/add"
            className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
              isActive("/add")
                ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            <PlusCircle className="mr-2" size={18} />
            Add Place
          </Link>

          <Link
            to="/what-to-eat"
            className={`px-3 py-2 rounded-md text-base font-medium flex items-center ${
              isActive("/what-to-eat")
                ? "bg-gradient-to-r from-green-50 to-blue-50 text-blue-700"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => setIsMenuOpen(false)}
          >
            <Utensils className="mr-2" size={18} />
            What To Eat
          </Link>

          <button
            onClick={() => {
              handleSignOut();
              setIsMenuOpen(false);
            }}
            className="w-full text-left px-3 py-2 rounded-md text-base font-medium flex items-center text-red-600 hover:bg-red-50 cursor-pointer"
          >
            <LogOut className="mr-2" size={18} />
            Sign Out
          </button>
        </div>
      </div>

      {/* Optional: Add overlay when menu is open */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black opacity-80 md:hidden z-30"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
