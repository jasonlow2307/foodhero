import { useState } from "react";
import Header from "./sections/Header/Header";
import FoodForm from "./sections/FoodForm/FoodForm";
import FoodList from "./sections/FoodList/FoodList";
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
      {page == "add" && <FoodForm />}
      {page == "list" && <FoodList />}
    </SnackbarProvider>
  );
}

export default App;
