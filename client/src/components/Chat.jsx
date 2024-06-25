import { useContext, useEffect, useRef, useState } from "react";
import Logo from "./Logo";
import { UserContext } from "./UserContext";
import uniqBy from "lodash/uniqBy";
import Contact from "./Contact";
import axios from "axios";

export default function Chat() {
  const [ws, setWS] = useState(null);
  const [onlinePeople, setOnlinePeople] = useState({});
  const [offlinePeople, setOfflinePeople] = useState({});
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [newMessageText, setNewMessageText] = useState("");
  const [messages, setMessages] = useState([]);
  const { username, id, setId, setUserName } = useContext(UserContext);
  const divUnderMessages = useRef();

  useEffect(() => {
    connectToWs();
  }, []);

  const connectToWs = () => {
    const ws = new WebSocket("wss://https://chat-app-dan.vercel.app");
    setWS(ws);
    ws.addEventListener("message", handleMessage);
    ws.addEventListener("close", () => {
      setTimeout(() => {
        console.log("Disconnected. Trying to reconnect.");
        connectToWs();
      }, 1000);
    });
  };

  const showOnlinePoeple = (peopleArray) => {
    const people = {};
    peopleArray.forEach(({ userId, username }) => {
      people[userId] = username;
    });
    setOnlinePeople(people);
  };

  function handleMessage(ev) {
    const messageData = JSON.parse(ev.data);
    if ("online" in messageData) {
      showOnlinePoeple(messageData.online);
    } else if ("text" in messageData) {
      if(messageData.sender === selectedUserId){
        setMessages((prev) => [...prev, { ...messageData }]);
      }
    }
  }

  const SendMessage = (ev, file = null) => {
    if (ev) ev.preventDefault();
    ws.send(
      JSON.stringify({
        recipient: selectedUserId,
        text: newMessageText,
        file,
      }));
    if (file) {
      axios.get("/messages/" + selectedUserId).then(res => {
        setMessages(res.data);
      });
    } else {
      setNewMessageText("");
      setMessages(prev => ([
        ...prev,
        {
          text: newMessageText,
          sender: id,
          recipient: selectedUserId,
          _id: Date.now(),
        },
      ]));
    }
  };

  function logout() {
    axios.post("/logout").then(() => {
      setWS(null);
      setId(null);
      setUserName(null);
    });
  }

  function sendFile(ev) {
    const reader = new FileReader();
    reader.readAsDataURL(ev.target.files[0]);
    reader.onload = () => {
      SendMessage(null, {
        name: ev.target.files[0].name,
        data: reader.result,
      });
    };
  }

  useEffect(() => {
    const div = divUnderMessages.current;
    if (div) {
      div.scrollIntoView({ behavior: "smooth", block: "end" });
    }
  }, [messages]);

  useEffect(() => {
    axios.get("/people").then((res) => {
      const offlinePeopleArr = res.data
        .filter((p) => p._id !== id)
        .filter((p) => !Object.keys(onlinePeople).includes(p._id));
      const offlinePeople = {};
      offlinePeopleArr.forEach((p) => {
        offlinePeople[p._id] = p;
      });
      setOfflinePeople(offlinePeople);
    });
  }, [onlinePeople]);

  useEffect(() => {
    if (selectedUserId) {
      axios.get("/messages/" + selectedUserId).then((res) => {
        setMessages(res.data);
      });
    }
  }, [selectedUserId]);

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString()
  };

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit'})
  }

  const onlinePeopleExclOurUser = { ...onlinePeople };
  delete onlinePeopleExclOurUser[id];

  const messagesWithoutDupes = uniqBy(messages, "_id");

  return (
    <div className="flex h-screen">
      <div className="bg-white w-1/3 flex flex-col">
        <div className="flex-grow">
          <Logo />
          {Object.keys(onlinePeopleExclOurUser).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              online={true}
              username={onlinePeopleExclOurUser[userId]}
            />
          ))}
          {Object.keys(offlinePeople).map((userId) => (
            <Contact
              key={userId}
              id={userId}
              onClick={() => setSelectedUserId(userId)}
              selected={userId === selectedUserId}
              online={false}
              username={offlinePeople[userId].username}
            />
          ))}
        </div>
        <div className="p-2 text-center flex items-center justify-center">
          <span className="mr-2 text-sm text-gray-600 flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="size-4"
            >
              <path
                fillRule="evenodd"
                d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z"
                clipRule="evenodd"
              />
            </svg>
            {username}
          </span>
          <button
            onClick={logout}
            className="text-sm text-gray-500 bg-blue-100 py-1 px-2 border rounded-sm"
          >
            Logout
          </button>
        </div>
      </div>
      <div className="flex flex-col bg-blue-50 w-2/3 p-2">
        <div className="flex-grow">
          {!selectedUserId && (
            <div className="flex flex-grow h-full items-center justify-center">
              <div className="text-gray-300">
                &larr; Select a person from the sidebar
              </div>
            </div>
          )}
          {selectedUserId && (
            <div className="relative h-full">
              <div className="overflow-y-scroll absolute top-0 left-0 right-0 bottom-2">
                {messagesWithoutDupes.map(message => (
                  <div
                    key={message._id}
                    className={`${
                      message.sender === id ? "text-right" : "text-left"
                    }`}
                  >
                    <div className="w-20 flex justify-center text-xs text-gray-300 p-1 bg-pink rounded-sm hover:text-gray-700">
                          <span className="date text-center">{formatDate(message.createdAt)} </span>
                      </div>
                    <div
                      className={`text-left inline-block p-2 my-2 rounded-sm text-sm hover:p-3 transition-colors duration-500 cursor-pointer ${
                        message.sender === id
                          ? "bg-blue-500 text-white"
                          : "bg-white text-gray-500"
                      }`}
                    >
                      {message.text}
                      {message.file && (
                        <div className="">
                          <a
                            target="_blank"
                            className="flex items-center gap-1 border-b"
                            href={
                              axios.defaults.baseURL +
                              "/uploads/" +
                              message.file
                            }
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="size-4"
                            >
                              <path
                                fillRule="evenodd"
                                d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <img src={`https://chat-app-dan.vercel.app/uploads/${message.file}`} className="w-30 h-30 bg-transparent" />
                          </a>
                        </div>
                      )}
                      <div className="absolue bottom-0 right-0 text-xs text-green-500 p-1">
                          <span className="time block">{formatTime(message.createdAt)} </span>
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={divUnderMessages}/>
              </div>
            </div>
          )}
        </div>
        {!!selectedUserId && (
          <form className="flex gap-2" onSubmit={SendMessage}>
            <input
              value={newMessageText}
              onChange={(ev) => setNewMessageText(ev.target.value)}
              type="text"
              className="bg-white border p-2 flex-grow border rounded-sm"
              placeholder="Type your message here"
            />
            <label
              type="button"
              className="bg-blue-200 p-2 text-gray-600 cursor-pointer rounded-sm border border-blue-200"
            >
              <input type="file" className="hidden" onChange={sendFile} />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="currentColor"
                className="size-6"
              >
                <path
                  fillRule="evenodd"
                  d="M18.97 3.659a2.25 2.25 0 0 0-3.182 0l-10.94 10.94a3.75 3.75 0 1 0 5.304 5.303l7.693-7.693a.75.75 0 0 1 1.06 1.06l-7.693 7.693a5.25 5.25 0 1 1-7.424-7.424l10.939-10.94a3.75 3.75 0 1 1 5.303 5.304L9.097 18.835l-.008.008-.007.007-.002.002-.003.002A2.25 2.25 0 0 1 5.91 15.66l7.81-7.81a.75.75 0 0 1 1.061 1.06l-7.81 7.81a.75.75 0 0 0 1.054 1.068L18.97 6.84a2.25 2.25 0 0 0 0-3.182Z"
                  clipRule="evenodd"
                />
              </svg>
            </label>
            <button
              className="bg-blue-500 p-2 text-white rounded-sm"
              type="submit"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  sendMessage
                  d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5"
                />
              </svg>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
