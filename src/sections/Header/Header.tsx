// filepath: /C:/Users/jason/OneDrive - Sunway Education Group/Desktop/Projects/food-hero/src/sections/header.tsx
import React, { useState } from "react";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import { ClickAwayListener, Autocomplete, TextField } from "@mui/material";
import { Plus, Search } from "lucide-react";

interface HeaderProps {
  setPage: (page: string) => void;
  setSelectedLocation: (locationName: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setPage, setSelectedLocation }) => {
  // Add inside Header component before return
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");

  const { data: locationsData } = useFirestoreCollection("locations");

  const locations = locationsData?.map((doc) => doc.location) || [];

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
    <header className="bg-white shadow-md px-6 py-4">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        {/* Left Side - Logo & Navigation */}
        <div className="flex items-center space-x-8">
          <img src="/logo.svg" alt="FoodHero" className="h-16 w-auto" />
          <nav className="hidden md:flex space-x-6">
            <a
              href="#"
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
        <div className="flex items-center space-x-4">
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
        </div>
      </div>
    </header>
  );
};

export default Header;
