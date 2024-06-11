import React from "react";
import axios from "axios";
import { UserContextProvider } from "./components/UserContext";
import Routing from "./components/Routes";

function App() {
  axios.defaults.baseURL = 'http://localhost:4040';
  axios.defaults.withCredentials = true;

  return (
    <>
      <UserContextProvider>
        <Routing />
      </UserContextProvider>
    </>
  );
}

export default App;
