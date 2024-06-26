import React from "react";
import Avatar from "./Avatar";

// Some links
// client-side = 'https://chat-app-silk-theta.vercel.app'
// server-side = 'https://chat-api-alpha.vercel.app

function Contact({id,onClick, username, selected, online}) {
  return (
    <div
      key={id}
      onClick={() => onClick(id)}
      className={`border-b group border-gray-100 flex items-center hover:opacity-100 hover:bg-blue-800 cursor-pointer gap-2 hover:p-2 hover:shadow-2xl hover:scale-100 transition duration-300 ${
        selected ? "bg-blue-50" : ""
      }`}
    >
      {selected && (
        <div className="w-1 bg-blue-500 h-12 rounded-r-md"/>
      )}
      <div className="flex gap-2 py-2 pl-4 items-center ">
        <Avatar online={online} username={username} userId={id} />
        <span className="text-gray-800 group-hover:text-white">{username}</span>
      </div>
    </div>
  );
}

export default Contact;
