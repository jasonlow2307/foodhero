// filepath: /C:/Users/jason/OneDrive - Sunway Education Group/Desktop/Projects/food-hero/src/sections/header.tsx
import { Icon } from "@iconify/react";
import React from "react";
import "./Header.css";

interface HeaderProps {
  setPage: (page: string) => void;
}

const Header: React.FC<HeaderProps> = ({ setPage }) => {
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
            List of Foods
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
        <a href="#" className="signup-button">
          {" "}
          {/* Use the CSS class */}
          <Icon
            icon="material-symbols:search-rounded"
            style={{ fontSize: "30px", fontWeight: "bold" }}
          />
        </a>
      </div>
    </header>
  );
};

export default Header;
