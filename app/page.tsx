"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const roomId = localStorage.getItem('roomId');
    roomId?router.push(`/${roomId}`):router.push("/login");
  }, []);
  return <></>;
}














// export default function page() {
//   const YouTube = require("youtube-sr").default;

//   async function searchVideos() {
//     const results = await YouTube.search("JavaScript tutorial", { limit: 5 });
//     console.log(results[1]);
//   }

//   searchVideos();

//   return <div></div>;
// }
