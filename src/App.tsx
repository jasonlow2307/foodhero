import { useState } from "react";
import Header from "./sections/Header/Header";
import LocationForm from "./sections/LocationForm/LocationForm";
import LocationList from "./sections/LocationList/LocationList";
import { SnackbarProvider } from "notistack";
import "./App.css";

function App() {
  const [page, setPage] = useState("add");
  const [selectedLocation, setSelectedLocation] = useState(null);

  return (
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
      {page == "add" && <LocationForm />}
      {page == "list" && (
        <LocationList
          initialSelectedLocation={selectedLocation}
          clearSelectedLocation={() => setSelectedLocation(null)}
        />
      )}
    </SnackbarProvider>
  );
}

export default App;
