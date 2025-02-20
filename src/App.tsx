import { useState } from "react";
import Header from "./sections/Header/Header";
import FoodForm from "./sections/FoodForm/FoodForm";

function App() {
  const [page, setPage] = useState("add");
  console.log(page);

  return (
    <>
      <Header setPage={setPage} />
      {page == "add" && <FoodForm />}
    </>
  );
}

export default App;
