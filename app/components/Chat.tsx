"use client";

import { useEffect, useRef, useState } from "react";
import { IoIosSend } from "react-icons/io";
import { Getmsg, Postmsg } from "../Actions/ChatAction";

export default function Chat({ roomId }: { roomId: string }) {
  const { dataObject } = Getmsg(roomId);
  
  // Safely get user from localStorage ensuring it works with Next.js SSR
  const [user, setUser] = useState<string>("");
  useEffect(() => {
    setUser(localStorage.getItem("user") ?? "");
  }, []);

  const [input, setInput] = useState("");
  
  // 1. Explicitly type the ref for TypeScript
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 2. Scroll into view whenever dataObject updates
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dataObject]);

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto gap-3 flex flex-col w-full px-3 py-2 [&::-webkit-scrollbar]:w-0">
        {dataObject &&
          Object.entries(dataObject).map(([key, value]) => {
            if (value.sender === user) {
              return (
                <div
                  key={key}
                  className="relative self-end bg-linear-to-r from-[#1a51b8] via-[#22417c] to-[#276394] rounded-3xl w-fit h-fit px-2 py-1 text-white"
                >
                  {value.msg}
                </div>
              );
            } else {
              return (
                <div
                  key={key}
                  className="relative self-start bg-linear-to-r from-[#1a51b8] via-[#22417c] to-[#276394] rounded-3xl w-fit h-fit px-2 py-1 text-white"
                >
                  {value.msg}
                </div>
              );
            }
          })}

        {/* 3. The anchor element that forces the view down */}
        <div ref={messagesEndRef} />
      </div>

      <div className="h-10 flex bottom-0 relative">
        <input
          className="w-full border bg-[#1D2A40] h-full pr-22 rounded-2xl border-gray-400 p-3 text-white outline-none"
          type="text"
          value={input}
          placeholder="Send a message..."
          onChange={(e) => {
            setInput(e.target.value);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && input.trim() !== "") {
              Postmsg(input, roomId, user);
              setInput("");
            }
          }}
        />
        <button
          onClick={() => {
            if (input.trim() === "") return;
            Postmsg(input, roomId, user);
            setInput("");
          }}
          className="flex absolute right-0 hover:scale-105 active:scale-110 duration-200 outline-none px-3 gap-1 transition-transform h-full items-center bg-cyan-500 rounded-2xl"
        >
          <IoIosSend size={20} />
          Send
        </button>
      </div>
    </div>
  );
}
