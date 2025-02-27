import React, { useEffect, useState } from "react";
import { SnackbarProvider } from "notistack";
import "./App.css";
import Header from "./sections/Header/Header";
import LocationForm from "./sections/LocationForm/LocationForm";
import LocationList from "./sections/LocationList/LocationList";
import WhatToEat from "./sections/WhatToEat/WhatToEat";
import { ScreenSizeProvider } from "./utils/responsiveUtils";
import HomePage from "./sections/HomePage/HomePage";
import Footer from "./sections/Footer/Footer";
import AuthPage from "./sections/AuthPage/AuthPage";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Separate component for content that needs auth
const AppContent = () => {
  const { currentUser, loading } = useAuth();
  const [page, setPage] = useState(() => {
    const savedPage = localStorage.getItem("currentPage");
    return savedPage || "auth";
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  useEffect(() => {
    if (!currentUser && page !== "auth") {
      setPage("auth");
    } else if (currentUser && page === "auth") {
      setPage("home");
    }
  }, [currentUser, page]);

  // Save page to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("currentPage", page);
  }, [page]);

  // Handle the page content based on auth status
  const renderContent = () => {
    // Always show auth page if not logged in
    if (!currentUser) {
      return <AuthPage setPage={setPage} />;
    }

    // Only show these pages if logged in
    switch (page) {
      case "list":
        return (
          <LocationList
            initialSelectedLocation={selectedLocation}
            clearSelectedLocation={() => setSelectedLocation(null)}
            setPage={setPage}
          />
        );
      case "add":
        return <LocationForm />;
      case "whatToEat":
        return <WhatToEat />;
      case "home":
      default:
        return <HomePage setPage={setPage} />;
    }
  };

  return (
    <ScreenSizeProvider>
      <SnackbarProvider
        maxSnack={3}
        anchorOrigin={{
          vertical: "top",
          horizontal: "center",
        }}
        style={{
          marginTop: "20px",
        }}
      >
        {/* Only show header if user is logged in */}
        {currentUser && (
          <Header setPage={setPage} setSelectedLocation={setSelectedLocation} />
        )}
        <main>{renderContent()}</main>
        <Footer />
      </SnackbarProvider>
    </ScreenSizeProvider>
  );
};

// Main App component
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
