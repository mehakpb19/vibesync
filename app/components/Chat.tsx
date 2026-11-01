"use client";

import { useEffect, useRef, useState } from "react";
import { IoIosSend } from "react-icons/io";
import { Getmsg, Postmsg } from "../Actions/ChatAction";

interface Message {
  sender: string;
  msg: string;
}

export default function Chat({ roomId }: { roomId: string }) {
  const { dataObject } = Getmsg(roomId) as { dataObject: Record<string, Message> | null };

  const [user, setUser] = useState<string>("");
  useEffect(() => {
    setUser(localStorage.getItem("user") ?? "");
  }, []);

  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [dataObject]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed || !user) return;
    Postmsg(trimmed, roomId, user);
    setInput("");
  };

  return (
    <div className="flex h-full w-full flex-col overflow-hidden">
      <div className="flex-1 overflow-y-auto gap-3 flex flex-col w-full px-3 py-2 [&::-webkit-scrollbar]:w-0">
        {dataObject &&
          Object.entries(dataObject).map(([key, value]) => {
            const isOwnMessage = value.sender === user;
            return (
              <div
                key={key}
                className={`relative rounded-3xl w-fit max-w-[75%] break-words h-fit px-3 py-1.5 text-white ${
                  isOwnMessage
                    ? "self-end bg-linear-to-r from-[#1a51b8] via-[#22417c] to-[#276394]"
                    : "self-start bg-[#2A3B5C]"
                }`}
              >
                {value.msg}
              </div>
            );
          })}

        <div ref={messagesEndRef} />
      </div>

      <div className="h-10 flex bottom-0 relative">
        <input
          className="w-full border bg-[#1D2A40] h-full pr-22 rounded-2xl border-gray-400 p-3 text-white outline-none"
          type="text"
          value={input}
          placeholder="Send a message..."
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
        />
        <button
          onClick={handleSend}
          className="flex absolute right-0 hover:scale-105 active:scale-110 duration-200 outline-none px-3 gap-1 transition-transform h-full items-center bg-cyan-500 rounded-2xl"
        >
          <IoIosSend size={20} />
          Send
        </button>
      </div>
    </div>
  );
}