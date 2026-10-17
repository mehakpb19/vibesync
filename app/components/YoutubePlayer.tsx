import { useState, useMemo, useRef, useEffect, useCallback } from "react";
import YouTube, { YouTubeProps, YouTubePlayer } from "react-youtube";
import { updateIspalying, updateTimeStamp } from "../Actions/RoomAction";

const PLAYER_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

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
  const [isMounted, setIsMounted] = useState(false);

  const playerRef = useRef<YouTubePlayer | null>(null);
  const logIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Refs to always read the latest database props without recreating callbacks
  const startTimeRef = useRef(startTime);
  startTimeRef.current = startTime;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const roomidRef = useRef(roomid);
  roomidRef.current = roomid;

  // Sync & anti-snapback refs
  const lastPlayerTimeRef = useRef<number>(startTime);
  const ignoreRemoteUntilRef = useRef<number>(0);
  const lastSentTimeRef = useRef<number>(-1);
  // Prevents initial seekTo() on refresh from accidentally flipping DB isPlaying to true
  const isInitializingRef = useRef<boolean>(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 1. Static opts so the iframe never destroys itself
  const opts: YouTubeProps["opts"] = useMemo(
    () => ({
      height: "360",
      width: "640",
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
        fs: 1,
      },
    }),
    []
  );

  const pushLocalTime = useCallback((time: number) => {
    ignoreRemoteUntilRef.current = Date.now() + 1500;
    lastSentTimeRef.current = time;
    lastPlayerTimeRef.current = time;
    updateTimeStamp(roomidRef.current, time);
  }, []);

  // 2. Dynamically control play/pause whenever DB `isPlaying` changes
  useEffect(() => {
    if (!playerRef.current) return;
    try {
      const internalState = playerRef.current.getPlayerState();
      if (isPlaying && internalState !== PLAYER_STATES.PLAYING) {
        playerRef.current.playVideo();
      } else if (!isPlaying && internalState === PLAYER_STATES.PLAYING) {
        playerRef.current.pauseVideo();
      }
    } catch {
      // Player not ready yet
    }
  }, [isPlaying]);

  // 3. Receive remote timestamp updates safely without auto-playing when paused
  useEffect(() => {
    if (!playerRef.current || startTime <= 0) return;
    if (Date.now() < ignoreRemoteUntilRef.current) return;
    if (Math.abs(startTime - lastSentTimeRef.current) < 0.5) return;

    try {
      const currentPlayerTime = playerRef.current.getCurrentTime();
      const drift = Math.abs(currentPlayerTime - startTime);

      if (drift > 2.0) {
        ignoreRemoteUntilRef.current = Date.now() + 1000;
        lastPlayerTimeRef.current = startTime;
        playerRef.current.seekTo(startTime, true);

        // If the DB state is paused, keep it paused after seeking!
        if (!isPlayingRef.current) {
          playerRef.current.pauseVideo();
        }
      }
    } catch {
      // Player not ready yet
    }
  }, [startTime]);

  // 4. Respect database `isPlaying` on initial load / page refresh
  const onReady: YouTubeProps["onReady"] = useCallback((event) => {
    const player = event.target;
    playerRef.current = player;
    isInitializingRef.current = true;

    if (startTimeRef.current > 0) {
      lastPlayerTimeRef.current = startTimeRef.current;
      player.seekTo(startTimeRef.current, true);
    }

    // Dynamically check the database `isPlaying` value on load
    if (isPlayingRef.current) {
      player.playVideo();
    } else {
      // Because seekTo() auto-plays, explicitly pause if DB says isPlaying is false
      player.pauseVideo();
    }

    // Release initialization lock after the initial state settles
    setTimeout(() => {
      isInitializingRef.current = false;
    }, 600);
  }, []);

  // 5. State change handler (Protected against initial refresh auto-play bug)
  const onStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event) => {
      const player = event.target;
      const currentState = event.data;
      const currentTime = player.getCurrentTime();

      // While initializing on page refresh, enforce the DB `isPlaying` state
      // instead of letting seekTo() overwrite the database with `true`
      if (isInitializingRef.current) {
        if (!isPlayingRef.current && currentState === PLAYER_STATES.PLAYING) {
          player.pauseVideo();
        }
        return;
      }

      if (currentState === PLAYER_STATES.PLAYING) {
        if (!isPlayingRef.current) {
          updateIspalying(roomidRef.current, true);
        }
      } else if (currentState === PLAYER_STATES.PAUSED) {
        if (isPlayingRef.current) {
          updateIspalying(roomidRef.current, false);
        }
        if (Math.abs(currentTime - lastPlayerTimeRef.current) > 1.5) {
          pushLocalTime(currentTime);
        }
      } else if (currentState === PLAYER_STATES.BUFFERING) {
        if (
          Date.now() > ignoreRemoteUntilRef.current &&
          Math.abs(currentTime - lastPlayerTimeRef.current) > 1.5
        ) {
          pushLocalTime(currentTime);
        }
      }
    },
    [pushLocalTime]
  );

  // 6. Local watcher for manual slider scrubbing
  const startLogging: YouTubeProps["onPlay"] = useCallback(
    (event) => {
      // Do not start logging if the player only briefly fired onPlay during refresh while DB is false
      if (isInitializingRef.current && !isPlayingRef.current) return;

      const player = event.target;
      if (logIntervalRef.current) clearInterval(logIntervalRef.current);

      const initialTime = player.getCurrentTime();
      if (Math.abs(initialTime - lastPlayerTimeRef.current) > 1.5) {
        pushLocalTime(initialTime);
      }
      lastPlayerTimeRef.current = initialTime;

      logIntervalRef.current = setInterval(() => {
        const currentTime = player.getCurrentTime();
        const expectedTime = lastPlayerTimeRef.current + 0.5;
        const localJump = Math.abs(currentTime - expectedTime);

        if (localJump > 1.5 && Date.now() > ignoreRemoteUntilRef.current) {
          pushLocalTime(currentTime);
        } else {
          lastPlayerTimeRef.current = currentTime;
        }
      }, 500);
    },
    [pushLocalTime]
  );

  const stopLogging = useCallback(() => {
    if (logIntervalRef.current) {
      clearInterval(logIntervalRef.current);
      logIntervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      stopLogging();
    };
  }, [stopLogging]);

  if (!isMounted) {
    return <div className="bg-red-500 w-[640px] h-[360px] rounded-2xl" />;
  }

  return (
    <div className="bg-red-500 overflow-clip rounded-2xl">
      <YouTube
        videoId={videoId}
        opts={opts}
        onPlay={startLogging}
        onPause={stopLogging}
        onEnd={stopLogging}
        onReady={onReady}
        onStateChange={onStateChange}
      />
    </div>
  );
}