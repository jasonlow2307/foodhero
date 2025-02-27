// filepath: /C:/Users/jason/OneDrive - Sunway Education Group/Desktop/Projects/food-hero/src/sections/header.tsx
import React, { useState } from "react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { ClickAwayListener, Autocomplete, TextField } from "@mui/material";
import { LogOut, Menu, Plus, Search, User } from "lucide-react";
import { enqueueSnackbar } from "notistack";
import { useAuth } from "../../contexts/AuthContext";

interface HeaderProps {
  setPage: (page: string) => void;
  setSelectedLocation: (locationName: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setPage, setSelectedLocation }) => {
  const { currentUser, logout } = useAuth();

  // Add inside Header component before return
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  // Add state for user menu
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { data: locationsData } = useFirestoreCollection("locations");

  const locations = locationsData?.map((doc) => doc.location) || [];

  console.log(currentUser);

  const handleLogout = async () => {
    try {
      await logout();
      localStorage.setItem("currentPage", "auth");
      setPage("auth");
      enqueueSnackbar?.("Successfully logged out", { variant: "success" });
    } catch (error) {
      console.error("Failed to log out", error);
      enqueueSnackbar?.("Failed to log out", { variant: "error" });
    }
  };

  // Add this function inside the Header component
  const handleLocationSelect = (locationName: string) => {
    const locationDoc = locationsData.find(
      (doc) => doc.location === locationName
    );

    if (locationDoc) {
      setPage("list");
      setSelectedLocation?.(locationDoc);
    }

    setSearchValue("");
    setIsSearchOpen(false);
  };

  return (
    <header className="bg-white shadow-md px-4 md:px-6 py-3 md:py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Side - Logo & Navigation */}
        <div className="flex items-center space-x-4 md:space-x-8">
          <img
            src="/logo.svg"
            onClick={() => setPage("home")}
            alt="FoodHero"
            className="h-10 md:h-16 w-auto hover: cursor-pointer"
          />
          <nav className="hidden md:flex space-x-6">
            <a
              href="#"
              onClick={() => setPage("whatToEat")}
              className="text-gray-600 hover:text-green-500 transition-colors duration-200 font-medium"
            >
              What To Eat
            </a>
            <a
              href="#"
              onClick={() => setPage("list")}
              className="text-gray-600 hover:text-green-500 transition-colors duration-200 font-medium"
            >
              List of Locations
            </a>
          </nav>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Add mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors"
          >
            <Menu size={24} />
          </button>

          {/* Add Location Button */}
          <button
            onClick={() => setPage("add")}
            className="p-2 rounded-xl hover:bg-green-50 text-green-500 transition-colors duration-200 hover: cursor-pointer"
          >
            <Plus size={24} />
          </button>

          {/* Search */}
          <ClickAwayListener onClickAway={() => setIsSearchOpen(false)}>
            <div className="relative">
              <button
                onClick={() => setIsSearchOpen(!isSearchOpen)}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors duration-200 hover: cursor-pointer"
              >
                <Search size={24} />
              </button>

              {isSearchOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
                  <Autocomplete
                    freeSolo
                    options={locations}
                    value={searchValue}
                    onChange={(_event: any, newValue: string | null) => {
                      if (newValue) {
                        handleLocationSelect(newValue);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        size="small"
                        placeholder="Search locations..."
                        autoFocus
                        sx={{
                          p: 1,
                          "& .MuiOutlinedInput-root": {
                            borderRadius: "0.75rem",
                          },
                        }}
                      />
                    )}
                  />
                </div>
              )}
            </div>
          </ClickAwayListener>

          <ClickAwayListener onClickAway={() => setUserMenuOpen(false)}>
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="p-2 rounded-xl hover:bg-gray-50 text-gray-500 transition-colors duration-200 hover: cursor-pointer"
              >
                <User size={24} />
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800">
                      {currentUser?.displayName || currentUser?.email}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {currentUser?.email}
                    </p>
                  </div>
                  <div className="p-2">
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg flex items-center gap-2 transition-colors hover: cursor-pointer"
                    >
                      <LogOut size={16} /> Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </ClickAwayListener>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden py-3 border-t border-gray-100">
          <nav className="flex flex-col space-y-3 px-4">
            <a
              href="#"
              onClick={() => {
                setPage("whatToEat");
                setMobileMenuOpen(false);
              }}
              className="text-gray-600 py-2 hover:text-green-500 transition-colors duration-200 font-medium"
            >
              What To Eat
            </a>
            <a
              href="#"
              onClick={() => {
                setPage("list");
                setMobileMenuOpen(false);
              }}
              className="text-gray-600 py-2 hover:text-green-500 transition-colors duration-200 font-medium"
            >
              List of Locations
            </a>
            <button
              onClick={() => {
                handleLogout();
                setMobileMenuOpen(false);
              }}
              className="text-left text-red-600 py-2 hover:text-red-700 transition-colors duration-200 font-medium flex items-center gap-2"
            >
              <LogOut size={18} /> Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
