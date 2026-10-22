"use client";

import Contorls from "../components/Contorls";
import YouTubePlayer from "@/app/components/YoutubePlayer";
import useRealtimeData from "@/app/Actions/RealtimedataAction";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { adduser, removeUser, updateIspalying } from "../Actions/RoomAction";
import Exitbtn from "@/app/components/ClientComs/Exitbtn";
import UserCounter from "./../components/ClientComs/UserCounter";
import { FaRegCopy } from "react-icons/fa6";
import { ToastContainer, Zoom, toast } from "react-toastify";
export default function Rompage({ roomid }: { roomid: string }) {
  const router = useRouter();
  if (/[A-Z]/.test(roomid)) {
    router.push(`/${roomid.toLocaleLowerCase()}`);
  }
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
    };

    const removetheuser = () => {
      removeUser(roomid, user);
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
      <ToastContainer
        position="bottom-center"
        autoClose={2000}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        limit={1}
        draggable
        pauseOnHover={false}
        theme="dark"
        transition={Zoom}
      />
      <div className=" px-3 justify-between flex h-21 bg-[linear-gradient(180deg,rgba(255,255,255,0)_-25%,rgba(20,33,55,0.84)_100%)] border-b border-cyan-200">
        <div className="leading-0">
          <h1 className="text-4xl text-cyan-200 font-bold pt-2  ">VibeSync</h1>
          <div className="flex items-center justify-between">
            <p className="text-white/80 text-[14px] pl-2">
              <span className="font-semibold">
                {localStorage.getItem("user")}'
              </span>{" "}
              Room{" "}
            </p>

            <UserCounter usercount={usercount} />
          </div>
        </div>

        <div className="h-full flex items-center gap-4">
          <button
            onClick={async () => {
              await navigator.clipboard.writeText(roomid);
              toast.success("Wow so easy!");
            }}
            className="bg-gradient-to-r active:-translate-y-0 hover:-translate-y-1.5 duration-500 to-[#216af2] via-[#4097e9] from-[#23838a] p-1.5 flex text-1xl items-center rounded-lg -translate-y-1 gap-2 h-fit"
          >
            <FaRegCopy size={20} /> Copy RoomId
          </button>
          <Exitbtn />
        </div>
      </div>

      <div className="h-full w-full flex justify-center items-center gap-4 bg-[linear-gradient(180deg,rgba(20,33,55,0.84)_0%,rgba(255,255,255,0)_50%)]">
        <div className="flex p-4 flex-col md:flex-row h-auto md:h-90 gap-6 md:gap-10 items-center justify-center w-full">
          <YouTubePlayer
            roomid={roomid}
            videoId={dataObject.videoId}
            startTime={dataObject.timestamp}
            isPlaying={dataObject.isPlaying}
          />
          <Contorls roomId={roomid} />
        </div>
      </div>
    </div>
  );
}
