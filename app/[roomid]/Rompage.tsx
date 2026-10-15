"use client";

import GetRealtimeData from "../Actions/RealtimedataAction";
import Contorls from "../components/Contorls";
import YouTubePlayer from "@/app/components/YoutubePlayer";

export default function Rompage({ roomid }: { roomid: string }) {
  const data: { videoId: string; users: any[] } = GetRealtimeData(roomid) || { videoId: "", users: [] };
  return (
    <div>
      <div className="flex w-[90%] justify-between items-center gap-4">
        <YouTubePlayer videoId={data.videoId} />
        <div>{data.users.length}</div>
        <Contorls />
      </div>
    </div>
  );
}
