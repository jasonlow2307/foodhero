import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Home,
  Map,
  PlusCircle,
  Utensils,
  LogOut,
  Menu,
  X,
  User,
  ChevronDown,
} from "lucide-react";
import { auth } from "../../firebase/firebase";
import { signOut } from "firebase/auth";
import { enqueueSnackbar } from "notistack";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const desktopDropdownRef = useRef<HTMLDivElement>(null);
  const mobileDropdownRef = useRef<HTMLDivElement>(null);
  const mobileButtonWrapperRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);

  // Get current user
  const user = auth.currentUser;
  const userName = user?.displayName || "User";
  const userEmail = user?.email || "";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!isUserDropdownOpen) return;

      // Check if click is on any button or dropdown
      const isButtonClick =
        buttonRef.current?.contains(event.target as Node) ||
        mobileButtonRef.current?.contains(event.target as Node);

      const isDropdownClick =
        desktopDropdownRef.current?.contains(event.target as Node) ||
        mobileDropdownRef.current?.contains(event.target as Node);

      if (!isButtonClick && !isDropdownClick) {
        setIsUserDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isUserDropdownOpen]);

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

            {/* User profile dropdown */}
            <div className="relative ml-3">
              <button
                ref={buttonRef}
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center gap-2 bg-white px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors focus:outline-none hover: cursor-pointer"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white">
                  <User size={16} />
                </div>
                <span className="hidden lg:block">{userName}</span>
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-300 ${
                    isUserDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Dropdown menu */}
              <div
                ref={desktopDropdownRef}
                className={`absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 transition-all duration-300 ease-in-out transform origin-top-right ${
                  isUserDropdownOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="py-1">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userEmail}
                    </p>
                  </div>
                  <hr className="my-1" />
                  <button
                    onClick={handleSignOut}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center hover: cursor-pointer"
                  >
                    <LogOut className="mr-2" size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            {/* Mobile user profile button */}
            <div className="mr-2" ref={mobileButtonWrapperRef}>
              <button
                ref={mobileButtonRef}
                onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                className="flex items-center justify-center bg-white p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-blue-500 flex items-center justify-center text-white">
                  <User size={16} />
                </div>
              </button>

              {/* Mobile dropdown menu */}
              <div
                ref={mobileDropdownRef}
                className={`absolute right-0 mt-2 mr-4 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50 transition-all duration-300 ease-in-out transform origin-top-right ${
                  isUserDropdownOpen
                    ? "opacity-100 scale-100"
                    : "opacity-0 scale-95 pointer-events-none"
                }`}
              >
                <div className="py-1">
                  <div className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {userName}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {userEmail}
                    </p>
                  </div>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsUserDropdownOpen(false);
                    }}
                    className="w-full text-left block px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center"
                  >
                    <LogOut className="mr-2" size={16} />
                    Sign Out
                  </button>
                </div>
              </div>
            </div>

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
