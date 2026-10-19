"use client";

import Contorls from "../components/Contorls";
import YouTubePlayer from "@/app/components/YoutubePlayer";
import useRealtimeData from "@/app/Actions/RealtimedataAction";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adduser, removeUser, updateIspalying } from "../Actions/RoomAction";
import Exitbtn from "@/app/components/ClientComs/Exitbtn";
import UserCounter from './../components/ClientComs/UserCounter';

export default function Rompage({ roomid }: { roomid: string }) {
  const router = useRouter();
  const { dataObject, loading } = useRealtimeData(roomid);

  // Track client hydration state to prevent HTML mismatch errors
  const [isMounted, setIsMounted] = useState(false);

  // Setup refs for persistent effects
  const hasAddedRef = useRef(false);
  const unmountTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setIsMounted(true);

    // Securely initialize localStorage only on the client
    let user = localStorage.getItem("user");
    if (!user || !localStorage.getItem("roomid")) {
      user = "user" + Math.floor(Math.random() * 1000);
      localStorage.setItem("roomid", roomid);
      localStorage.setItem("user", user);
    }

    const addtheuser = () => {
      adduser(roomid, user);
      console.log("added user:", user);
    };

    const removetheuser = () => {
      removeUser(roomid, user);
      console.log("Removing user:", user);
    };

    // Strict Mode / Re-mount Protection logic
    if (unmountTimeoutRef.current) {
      clearTimeout(unmountTimeoutRef.current);
    }

    if (!hasAddedRef.current) {
      addtheuser();
      hasAddedRef.current = true;
    }

    const handleTabClose = () => {
      removetheuser();
    };

    window.addEventListener("beforeunload", handleTabClose);
    window.addEventListener("pagehide", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      window.removeEventListener("pagehide", handleTabClose); // Fixed bug: was addEventListener in your cleanup

      unmountTimeoutRef.current = setTimeout(() => {
        removetheuser();
        hasAddedRef.current = false;
      }, 50);
    };
  }, [roomid]);

  if (!isMounted || loading) return <p>Loading...</p>;
  if (!dataObject) {
    localStorage.clear();
    return null;
  }
  const usercount = dataObject.Users?.length ?? 0;
  return (
    <div className="h-full w-full flex justify-center flex-col">

      <div className=" px-3 justify-between flex h-21 bg-[linear-gradient(180deg,rgba(255,255,255,0)_-25%,rgba(20,33,55,0.84)_100%)] border-b border-cyan-200">
        <div className="leading-0">
        <h1 className="text-4xl text-cyan-200 font-bold pt-2  ">VibeSync</h1>
        <div className='flex items-center justify-between'>
          <p className="text-white/80 text-[14px] pl-2"><span className="font-semibold">{localStorage.getItem('user')}'</span> Room </p>
         
          <UserCounter usercount={usercount}/>
        </div>
          </div>
        <Exitbtn />
      </div>

      <div className="h-full w-full flex justify-center items-center gap-4 bg-[linear-gradient(180deg,rgba(20,33,55,0.84)_0%,rgba(255,255,255,0)_50%)]">
        <div className="flex gap-10">
          <YouTubePlayer
          roomid={roomid}
          videoId={dataObject.videoId}
          startTime={dataObject.timestamp}
          isPlaying={dataObject.isPlaying}
        />
        <Contorls />
        </div>
      </div>
    </div>
  );
}
