"use client";

import { useState } from "react";
import YtSearch from "./ClientComs/YtSearch";
import Chat from "./Chat";

export default function Contorls({roomId}:{roomId:string}) {
  const [tab, setTab] = useState("Youtube");

  return (
    <div className="h-90 flex flex-col overflow-clip bg-slate-800/80 w-100 rounded-2xl">
      {/* button */}
      <div className=" relative w-full flex flex-wrap p-1 text-sm bg-[#0F172A] rounded-lg shadow-[0_0_0_1px_rgba(0,0,0,0.06)] box-border">
        <label className="flex-1 text-center cursor-pointer">
          <input
            onClick={(e) => {
              setTab("Youtube");
            }}
            type="radio"
            name="radio"
            defaultChecked
            className="peer hidden"
          />
          <span className="flex items-center justify-center py-2 text-slate-400 peer-checked:text-slate-800/80 rounded-lg transition-all duration-300 ease-in-out peer-checked:bg-white peer-checked:font-semibold">
            Youtube
          </span>
        </label>

        <label className="flex-1 text-center cursor-pointer">
          <input
            onClick={(e) => {
              setTab("Chat");
            }}
            type="radio"
            name="radio"
            className="peer hidden"
          />
          <span className="flex items-center justify-center py-2 text-slate-400 peer-checked:text-slate-800/80 rounded-lg transition-all duration-300 ease-in-out peer-checked:bg-white peer-checked:font-semibold">
            Chat
          </span>
        </label>
      </div>

      {/* Content */}
      <div className="min-h-0 grow">
        {(tab == "Youtube" && <YtSearch roomId={roomId} />) ||
          (tab == "Chat" && <Chat roomId={roomId}/>)}
      </div>
    </div>
  );
}
