import { useState } from "react";
import Header from "./sections/Header/Header";
import LocationForm from "./sections/LocationForm/LocationForm";
import LocationList from "./sections/LocationList/LocationList";
import { SnackbarProvider } from "notistack";

function App() {
  const [page, setPage] = useState("list");
  console.log(page);

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
      <Header setPage={setPage} />
      {page == "add" && <LocationForm />}
      {page == "list" && <LocationList />}
    </SnackbarProvider>
  );
}

export default App;
