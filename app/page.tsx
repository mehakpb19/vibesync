"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const roomId = localStorage.getItem('roomid');
    roomId?router.push(`/${roomId}`):router.push("/login");
  }, []);
  return <></>;
}