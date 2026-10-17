"use client";

import Contorls from "../components/Contorls";
import YouTubePlayer from "@/app/components/YoutubePlayer";
import useRealtimeData from "@/app/Actions/RealtimedataAction";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adduser, removeUser, updateIspalying } from "../Actions/RoomAction";

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

  // Prevent rendering anything until client-side hydration is complete
  if (!isMounted || loading) return <p>Loading...</p>;
  if (!dataObject) {
    localStorage.clear();
    return null;
  }
  const usercount = dataObject.Users?.length ?? 0;
  return (
    <div className="h-full w-full">
      <div className="bg-black/30">
        <h1 className="text-4xl text-blue-600 font-bold ">VibeSync</h1>
      </div>
      <div className="flex w-[90%] justify-between items-center gap-4">
        <YouTubePlayer
          roomid={roomid}
          videoId={dataObject.videoId}
          startTime={dataObject.timestamp}
          isPlaying={dataObject.isPlaying}
        />
        {usercount}
        <Contorls />
      </div>
    </div>
  );
}
