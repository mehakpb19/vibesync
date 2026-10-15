"use client";
import YouTube from "react-youtube";


export default function PersonalYouTubePlayer({
  videoId,
  startTime = 0,
}: {
  videoId: string;
  startTime?: number;
}) {

  const opts = {
    height: "390",
    width: "640",
    playerVars: {
      autoplay: 0,
      start: startTime,
    },
  };

  const onReady = (event: {
    target: { seekTo: (arg0: number, arg1: boolean) => void };
  }) => {};

  return (
    <div className="youtube-component-wrapper overflow-hidden rounded-4xl">
      <YouTube videoId={videoId} opts={opts} onReady={onReady} />
    </div>
  );
}
