import React from "react";
import axios from "axios";
import { UserContextProvider } from "./components/UserContext";
import Routing from "./components/Routes";

function App() {
  axios.defaults.baseURL = 'https://chat-api-alpha.vercel.app';
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
