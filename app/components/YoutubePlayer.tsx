import { useMemo, useRef, useEffect, useCallback } from "react";
import YouTube, {
  YouTubeProps,
  YouTubePlayer,
  YouTubeEvent,
} from "react-youtube";
import { updateIspalying, updateTimeStamp } from "../Actions/RoomAction";

const PLAYER_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

// Max allowed difference in seconds (1s sync accuracy)
const MAX_ALLOWED_DRIFT = 1.0;

export default function PersonalYouTubePlayer({
  roomid,
  videoId,
  startTime = 0,
  isPlaying,
}: {
  roomid: string;
  videoId: string;
  startTime?: number;
  isPlaying: boolean;
}) {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isReadyRef = useRef<boolean>(false);

  // Refs to always read latest database props inside stable callbacks
  const startTimeRef = useRef(startTime);
  startTimeRef.current = startTime;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const roomidRef = useRef(roomid);
  roomidRef.current = roomid;

  const videoIdRef = useRef(videoId);
  videoIdRef.current = videoId;

  // Sync & anti-snapback refs
  const lastPlayerTimeRef = useRef<number>(startTime);
  const ignoreRemoteUntilRef = useRef<number>(0);
  const lastSentTimeRef = useRef<number>(-1);

  // 1. Static opts so the iframe never destroys itself
  const opts: YouTubeProps["opts"] = useMemo(
    () => ({
      height: "360",
      width: "640",
      playerVars: {
        autoplay: 1,
        controls: 1,
        modestbranding: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
        fs: 1,
      },
    }),
    [],
  );

  const pushLocalTime = useCallback((time: number) => {
    ignoreRemoteUntilRef.current = Date.now() + 1500;
    lastSentTimeRef.current = time;
    lastPlayerTimeRef.current = time;
    updateTimeStamp(roomidRef.current, time);
  }, []);

  // 2. Dynamically control play/pause whenever DB `isPlaying` changes
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      const internalState = playerRef.current.getPlayerState();
      if (isPlaying && internalState !== PLAYER_STATES.PLAYING) {
        ignoreRemoteUntilRef.current = Date.now() + 1000;
        playerRef.current.playVideo();
      } else if (!isPlaying && internalState === PLAYER_STATES.PLAYING) {
        ignoreRemoteUntilRef.current = Date.now() + 1000;
        playerRef.current.pauseVideo();
      }
    } catch {
      // Player not ready yet
    }
  }, [isPlaying]);

  // 3. Receive remote timestamp updates safely (1.0s max drift)
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current || startTime < 0) return;
    if (Date.now() < ignoreRemoteUntilRef.current) return;
    if (Math.abs(startTime - lastSentTimeRef.current) < 0.8) return;

    try {
      const currentPlayerTime = playerRef.current.getCurrentTime();
      const drift = Math.abs(currentPlayerTime - startTime);

      if (drift > MAX_ALLOWED_DRIFT) {
        ignoreRemoteUntilRef.current = Date.now() + 1500;
        lastPlayerTimeRef.current = startTime;

        if (isPlayingRef.current) {
          playerRef.current.seekTo(startTime, true);
        } else {
          // If paused in DB, cue at the new timestamp so it doesn't auto-play or black-screen
          playerRef.current.cueVideoById({
            videoId: videoIdRef.current,
            startSeconds: startTime,
          });
        }
      }
    } catch {
      // Player not ready yet
    }
  }, [startTime]);

  // 4. Fix Black Screen on Ready + Respect DB `isPlaying` on Refresh
  const onReady: YouTubeProps["onReady"] = useCallback(
    (event: YouTubeEvent) => {
      const player = event.target;
      playerRef.current = player;
      isReadyRef.current = true;

      const initialStart = startTimeRef.current > 0 ? startTimeRef.current : 0;
      lastPlayerTimeRef.current = initialStart;

      if (isPlayingRef.current) {
        if (initialStart > 0) {
          player.seekTo(initialStart, true);
        }
        player.playVideo();
      } else {
        if (initialStart > 0) {
          player.cueVideoById({
            videoId: videoIdRef.current,
            startSeconds: initialStart,
          });
        }
      }
    },
    [],
  );

  // 5. State change handler (updates ONLY on Play, Pause, or Seek/Jump)
  const onStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event: YouTubeEvent) => {
      const player = event.target;
      const currentState = event.data;
      const currentTime = player.getCurrentTime();

      if (Date.now() < ignoreRemoteUntilRef.current) {
        lastPlayerTimeRef.current = currentTime;
        return;
      }

      if (currentState === PLAYER_STATES.PLAYING) {
        if (!isPlayingRef.current) {
          updateIspalying(roomidRef.current, true);
          pushLocalTime(currentTime);
        } else if (
          Math.abs(currentTime - lastPlayerTimeRef.current) > MAX_ALLOWED_DRIFT
        ) {
          // Caught a seek/jump that finished and resumed playing
          pushLocalTime(currentTime);
        }
      } else if (currentState === PLAYER_STATES.PAUSED) {
        if (isPlayingRef.current) {
          updateIspalying(roomidRef.current, false);
        }
        if (
          Math.abs(currentTime - lastPlayerTimeRef.current) > MAX_ALLOWED_DRIFT
        ) {
          pushLocalTime(currentTime);
        }
      } else if (currentState === PLAYER_STATES.BUFFERING) {
        if (Math.abs(currentTime - lastPlayerTimeRef.current) > 1.2) {
          pushLocalTime(currentTime);
        }
      }
    },
    [pushLocalTime],
  );

  if (!videoId) {
    return <div className="bg-black w-160 h-90 rounded-2xl" />;
  }

  return (
    <div className="bg-black overflow-clip rounded-2xl">
      <YouTube
        videoId={videoId}
        opts={opts}
        onReady={onReady}
        onStateChange={onStateChange}
      />
    </div>
  );
}