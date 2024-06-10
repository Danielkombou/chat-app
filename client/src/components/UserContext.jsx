import { createContext, useState, useEffect } from "react";
import axios from "axios";

export const UserContext = createContext({});
export function UserContextProvider({ children }) {
  const [username, setUserName] = useState(null);
  const [id, setId] = useState(null);

  useEffect(() => {
    axios.get("/profile").then((response) => {
      setId(response.data.userId);
      setUserName(response.data.username);
      // console.log(response.data)
    });
  }, []);

  return (
    <UserContext.Provider value={{ username, setUserName, id, setId }}>
      {children}
    </UserContext.Provider>
  );
}
