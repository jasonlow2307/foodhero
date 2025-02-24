// filepath: /C:/Users/jason/OneDrive - Sunway Education Group/Desktop/Projects/food-hero/src/sections/header.tsx
import { Icon } from "@iconify/react";
import React, { useState } from "react";
import "./Header.css";
import useFirestoreCollection from "../../firebase/useFirestoreCollection";
import {
  ClickAwayListener,
  Paper,
  Autocomplete,
  TextField,
} from "@mui/material";

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
    <header className="header">
      {" "}
      {/* Use the CSS class */}
      {/* Left Side - Logo & Navigation */}
      <div style={{ display: "flex", alignItems: "center" }}>
        <img
          src="/logo.svg"
          alt="FoodHero"
          style={{ height: "80px", marginRight: "20px" }}
        />
        <nav>
          <a href="#" className="nav-link">
            {" "}
            {/* Use the CSS class */}
            What To Eat
          </a>
          <a href="#" className="nav-link" onClick={() => setPage("list")}>
            {" "}
            {/* Use the CSS class */}
            List of Locations
          </a>
        </nav>
      </div>
      {/* Right Side - Authentication Buttons */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <a href="#" className="signup-button">
          {" "}
          {/* Use the CSS class */}
          <Icon
            icon="ic:baseline-plus"
            style={{ fontSize: "30px", fontWeight: "bold" }}
            onClick={() => setPage("add")}
          />
        </a>
        <ClickAwayListener onClickAway={() => setIsSearchOpen(false)}>
          <div style={{ position: "relative" }}>
            <a
              href="#"
              className="signup-button"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
            >
              <Icon
                icon="material-symbols:search-rounded"
                style={{ fontSize: "30px", fontWeight: "bold" }}
              />
            </a>
            {isSearchOpen && (
              <Paper
                sx={{
                  position: "absolute",
                  right: 0,
                  top: "100%",
                  width: "300px",
                  mt: 1,
                  zIndex: 1000,
                }}
              >
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
                      sx={{ p: 1 }}
                    />
                  )}
                />
              </Paper>
            )}
          </div>
        </ClickAwayListener>
      </div>
    </header>
  );
};

export default Header;
