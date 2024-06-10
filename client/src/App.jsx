import React from "react";
import axios from "axios";
import { UserContextProvider } from "./components/UserContext";
import Routing from "./components/Routes";
// import Register from "./components/Register/Register";

function App() {
  axios.defaults.baseURL = "https://chat-app-dan.vercel.app";
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
