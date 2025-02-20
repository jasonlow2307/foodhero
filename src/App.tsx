import { useState } from "react";
import Header from "./sections/Header/Header";
import FoodForm from "./sections/FoodForm/FoodForm";
import FoodList from "./sections/FoodList/FoodList";

function App() {
  const [page, setPage] = useState("list");
  console.log(page);

  return (
    <>
      <Header setPage={setPage} />
      {page == "add" && <FoodForm />}
      {page == "list" && <FoodList />}
    </>
  );
}

export default App;
