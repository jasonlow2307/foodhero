import { useEffect, useState } from "react";
import Header from "./sections/Header/Header";
import LocationForm from "./sections/LocationForm/LocationForm";
import LocationList from "./sections/LocationList/LocationList";
import { SnackbarProvider } from "notistack";
import "./App.css";
import WhatToEat from "./sections/WhatToEat/WhatToEat";
import { ScreenSizeProvider } from "./utils/responsiveUtils";
import HomePage from "./sections/HomePage/HomePage";

function App() {
  const [page, setPage] = useState(() => {
    const savedPage = localStorage.getItem("currentPage");
    return savedPage || "whatToEat";
  });
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Save page to localStorage when it changes
  useEffect(() => {
    localStorage.setItem("currentPage", page);
  }, [page]);

  // Custom page setter that also updates localStorage
  const handleSetPage = (newPage: string) => {
    setPage(newPage);
    localStorage.setItem("currentPage", newPage);
  };

  const renderPage = () => {
    switch (page) {
      case "list":
        return (
          <LocationList
            initialSelectedLocation={selectedLocation}
            clearSelectedLocation={() => setSelectedLocation(null)}
            setPage={handleSetPage}
          />
        );
      case "add":
        return <LocationForm />;
      case "whatToEat":
        return <WhatToEat />;
      case "home":
        return <HomePage setPage={handleSetPage} />;
      default:
        return <LocationList setPage={handleSetPage} />;
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
        <Header
          setPage={handleSetPage}
          setSelectedLocation={setSelectedLocation}
        />
        {/* {page == "add" && <LocationForm />}
      {page == "list" && (
        <LocationList
          initialSelectedLocation={selectedLocation}
          clearSelectedLocation={() => setSelectedLocation(null)}
          setPage={setPage}
        />
      )}
      {page == "whatToEat" && <WhatToEat />} */}
        <main>{renderPage()}</main>
      </SnackbarProvider>
    </ScreenSizeProvider>
  );
}

export default App;
