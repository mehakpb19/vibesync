"use client";
import CreateRoombtn from "@/app/components/ClientComs/CreateRoombtn";
import { useState } from "react";

export default function Login() {
  const [roomId, setRoomId] = useState("");
  const [user, setUser] = useState("");
  const [error, setError] = useState("");
  
  return (
    <div className=" p-6 rounded-2xl bg-[#2a395c] flex flex-col gap-5">
      <div className="flex  flex-col">
        <input
          className="border outline-none focus:border-gray-200 border-gray-400 p-3 rounded-lg"
          type="text"
          placeholder="enter roomId"
          value={roomId}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setRoomId(e.target.value);
          }}
        />
        <div className="text-red-500">
          {error == "Enter RoomId plz" && error}
        </div>
      </div>
      <div className="flex flex-col gap-3">
        <input
          className=" outline-none border focus:border-gray-200 border-gray-400 p-3 rounded-lg"
          type="text"
          placeholder="enter username"
          value={user}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            setUser(e.target.value);
          }}
        />

        <div className="text-red-500">
          {error == "Enter User plz" && error}
          {error == "User alredy exit in the room" && error}
        </div>

        <CreateRoombtn
          join={true}
          text={"Join Room"}
          roomId={roomId}
          user={user}
          setError={setError}
        />

        <CreateRoombtn
          join={false}
          text={"Create Room"}
          roomId={roomId}
          user={user}
          setError={setError}
        />
      </div>
    </div>
  );
}
