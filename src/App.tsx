import { useState } from "react";
import Header from "./sections/Header/Header";
import LocationForm from "./sections/LocationForm/LocationForm";
import LocationList from "./sections/LocationList/LocationList";
import { SnackbarProvider } from "notistack";
import "./App.css";
import WhatToEat from "./sections/WhatToEat/WhatToEat";
import { ScreenSizeProvider } from "./utils/responsiveUtils";

function App() {
  const [page, setPage] = useState("add");
  const [selectedLocation, setSelectedLocation] = useState(null);

  const renderPage = () => {
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
        return <WhatToEat />; // Assuming you have this component
      default:
        return <LocationList setPage={setPage} />;
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
        <Header setPage={setPage} setSelectedLocation={setSelectedLocation} />
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
