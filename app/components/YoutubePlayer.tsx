import { useMemo, useRef, useEffect, useCallback } from "react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";

export default function PersonalYouTubePlayer({
  videoId,
  startTime = 0,
}: {
  videoId: string;
  startTime?: number;
}) {
  const playerRef = useRef<YouTubePlayer | null>(null);

  // 1. Memoize opts so the object reference NEVER changes across re-renders.
  // Notice we do NOT put `startTime` in the dependency array here!
  const opts: YouTubeProps["opts"] = useMemo(
    () => ({
      height: "390",
      width: "640",
      host: "https://www.youtube-nocookie.com",
      playerVars: {
        autoplay: 0,
        start: startTime, // Only used for the very first initial load
        origin:
          typeof window !== "undefined" ? window.location.origin : undefined,
      },
    }),
    [] // Empty dependency array locks the config so the iframe never reloads
  );

  // 2. Save the player instance when ready
  const onReady: YouTubeProps["onReady"] = useCallback((event) => {
    playerRef.current = event.target;
  }, []);

  // 3. If startTime changes later, seek smoothly without reloading the iframe
  useEffect(() => {
    if (playerRef.current && startTime > 0) {
      playerRef.current.seekTo(startTime, true);
    }
  }, [startTime]);

  return (
    // Fixed dimensions on the wrapper prevent layout jumping while loading
    <div className="youtube-component-wrapper w-[640px] h-[390px] overflow-hidden rounded-4xl bg-black">
      <YouTube videoId={videoId} opts={opts} onReady={onReady} />
    </div>
  );
}