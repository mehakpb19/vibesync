"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Login from "@/app/components/Login";
export default function page() {
    const router = useRouter();
    useEffect(() => {
      const roomId = localStorage.getItem('roomId');
      roomId?router.push(`/${roomId}`):router.push("/login");
    }, []);
  return (
    <div className=" flex flex-col justify-center items-center  bg-linear-to-br from-[#192646] to-[#29323b] h-screen w-full">
      <Login />
    </div>
  );
}
