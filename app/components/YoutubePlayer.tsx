"use client";

import { useMemo, useRef, useEffect, useCallback, useState } from "react";
import YouTube, {
  YouTubeProps,
  YouTubePlayer,
  YouTubeEvent,
} from "react-youtube";
import { syncPlayerState, updateTimeStamp } from "../Actions/RoomAction";

const PLAYER_STATES = {
  UNSTARTED: -1,
  ENDED: 0,
  PLAYING: 1,
  PAUSED: 2,
  BUFFERING: 3,
  CUED: 5,
};

const MAX_ALLOWED_DRIFT = 1.5;
const REMOTE_LOCK_FALLBACK_MS = 1000; // safety net only; normally cleared by the state event
const TAP_CHECK_MS = 1500;

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
  const [needsTap, setNeedsTap] = useState(false);

  // Latest props, read inside stable callbacks
  const startTimeRef = useRef(startTime);
  startTimeRef.current = startTime;

  const isPlayingRef = useRef(isPlaying);
  isPlayingRef.current = isPlaying;

  const roomidRef = useRef(roomid);
  roomidRef.current = roomid;

  const videoIdRef = useRef(videoId);
  videoIdRef.current = videoId;

  // Sync & anti-echo refs
  const lastPlayerTimeRef = useRef<number>(startTime);
  const isApplyingRemoteRef = useRef<boolean>(false);
  const remoteLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastSentTimeRef = useRef<number>(-1);

  // Set while we apply a remote change. Cleared by the matching state event
  // (see onStateChange). The timer is only a fallback if no event arrives.
  const lockRemoteAction = useCallback((durationMs = REMOTE_LOCK_FALLBACK_MS) => {
    isApplyingRemoteRef.current = true;
    if (remoteLockTimeoutRef.current) {
      clearTimeout(remoteLockTimeoutRef.current);
    }
    remoteLockTimeoutRef.current = setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, durationMs);
  }, []);

  const unlockRemoteAction = useCallback(() => {
    isApplyingRemoteRef.current = false;
    if (remoteLockTimeoutRef.current) {
      clearTimeout(remoteLockTimeoutRef.current);
      remoteLockTimeoutRef.current = null;
    }
  }, []);

  // Clear pending timers on unmount
  useEffect(() => {
    return () => {
      if (remoteLockTimeoutRef.current) {
        clearTimeout(remoteLockTimeoutRef.current);
      }
    };
  }, []);

  // No autoplay: 1 in opts. Browsers block unmuted autoplay and cause black
  // screens. Playback is started cleanly in onReady and by the tap fallback.
  const opts: YouTubeProps["opts"] = useMemo(
    () => ({
      height: "100%",
      width: "100%",
      playerVars: {
        autoplay: 0,
        controls: 1,
        modestbranding: 1,
        iv_load_policy: 3,
        cc_load_policy: 0,
        fs: 1,
        playsinline: 1,
      },
    }),
    [],
  );

  const pushLocalState = useCallback((playing: boolean, time: number) => {
    lastSentTimeRef.current = time;
    lastPlayerTimeRef.current = time;
    isPlayingRef.current = playing;
    syncPlayerState(roomidRef.current, playing, time);
  }, []);

  // 1. Apply play/pause when the database isPlaying changes
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      const internalState = playerRef.current.getPlayerState();

      if (isPlaying) {
        if (
          internalState !== PLAYER_STATES.PLAYING &&
          internalState !== PLAYER_STATES.BUFFERING
        ) {
          lockRemoteAction();
          playerRef.current.playVideo();
        }
      } else {
        if (
          internalState === PLAYER_STATES.PLAYING ||
          internalState === PLAYER_STATES.BUFFERING
        ) {
          lockRemoteAction();
          playerRef.current.pauseVideo();
        }
      }
    } catch {
      // Player not ready yet
    }
  }, [isPlaying, lockRemoteAction]);

  // 2. Apply remote timestamp updates
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current || startTime < 0) return;
    // Our own echo: we already have this position
    if (Math.abs(startTime - lastSentTimeRef.current) < 0.8) return;

    try {
      const currentPlayerTime = playerRef.current.getCurrentTime() || 0;
      const drift = Math.abs(currentPlayerTime - startTime);

      if (drift > MAX_ALLOWED_DRIFT) {
        lockRemoteAction();
        lastPlayerTimeRef.current = startTime;

        if (isPlayingRef.current) {
          playerRef.current.seekTo(startTime, true);
          playerRef.current.playVideo();
        } else {
          const state = playerRef.current.getPlayerState();
          // Not started yet: cue so the thumbnail shows instead of a black box
          if (
            state === PLAYER_STATES.UNSTARTED ||
            state === PLAYER_STATES.CUED
          ) {
            playerRef.current.cueVideoById({
              videoId: videoIdRef.current,
              startSeconds: startTime,
            });
          } else {
            playerRef.current.seekTo(startTime, true);
            playerRef.current.pauseVideo();
          }
        }
      }
    } catch {
      // Player not ready yet
    }
  }, [startTime, lockRemoteAction]);

  // 3. Ready: start or cue, then offer a tap if autoplay was blocked
  const onReady: YouTubeProps["onReady"] = useCallback(
    (event: YouTubeEvent) => {
      const player = event.target;
      playerRef.current = player;
      isReadyRef.current = true;

      const initialStart = startTimeRef.current > 0 ? startTimeRef.current : 0;
      lastPlayerTimeRef.current = initialStart;
      lockRemoteAction();

      if (isPlayingRef.current) {
        if (initialStart > 0) {
          player.seekTo(initialStart, true);
        }
        player.playVideo();

        // If it didn't start, autoplay was probably blocked. Show a tap target.
        setTimeout(() => {
          const p = playerRef.current;
          if (!p || !isPlayingRef.current) return;
          const st = p.getPlayerState();
          if (st !== PLAYER_STATES.PLAYING && st !== PLAYER_STATES.BUFFERING) {
            setNeedsTap(true);
          }
        }, TAP_CHECK_MS);
      } else if (initialStart > 0) {
        player.cueVideoById({
          videoId: videoIdRef.current,
          startSeconds: initialStart,
        });
      }
    },
    [lockRemoteAction],
  );

  // 4. State changes: detect real user actions, ignore our own echoes
  const onStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event: YouTubeEvent) => {
      const player = event.target;
      const currentState = event.data;
      const currentTime = player.getCurrentTime() || 0;

      if (currentState === PLAYER_STATES.PLAYING) setNeedsTap(false);

      // Only PLAYING and PAUSED express intent. Ignore BUFFERING, CUED, UNSTARTED.
      if (
        currentState !== PLAYER_STATES.PLAYING &&
        currentState !== PLAYER_STATES.PAUSED
      ) {
        return;
      }

      if (isApplyingRemoteRef.current) {
        // This is the echo of our own programmatic call. Clear the lock now
        // instead of waiting for a timer.
        unlockRemoteAction();
        lastPlayerTimeRef.current = currentTime;

        // Started playing while the room says paused: force it back
        if (currentState === PLAYER_STATES.PLAYING && !isPlayingRef.current) {
          player.pauseVideo();
        }
        return;
      }

      if (currentState === PLAYER_STATES.PLAYING) {
        if (!isPlayingRef.current) {
          pushLocalState(true, currentTime);
        } else if (
          Math.abs(currentTime - lastPlayerTimeRef.current) > MAX_ALLOWED_DRIFT
        ) {
          lastSentTimeRef.current = currentTime;
          lastPlayerTimeRef.current = currentTime;
          updateTimeStamp(roomidRef.current, currentTime);
        }
        lastPlayerTimeRef.current = currentTime;
      } else {
        // PAUSED
        if (isPlayingRef.current) {
          pushLocalState(false, currentTime);
        } else if (
          Math.abs(currentTime - lastPlayerTimeRef.current) > MAX_ALLOWED_DRIFT
        ) {
          lastSentTimeRef.current = currentTime;
          lastPlayerTimeRef.current = currentTime;
          updateTimeStamp(roomidRef.current, currentTime);
        }
        lastPlayerTimeRef.current = currentTime;
      }
    },
    [pushLocalState, unlockRemoteAction],
  );

  const handleTap = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    setNeedsTap(false);
    lockRemoteAction();
    if (startTimeRef.current > 0) p.seekTo(startTimeRef.current, true);
    p.playVideo();
  }, [lockRemoteAction]);

  // 16:9 padding trick keeps the box from collapsing to 0 height
  if (!videoId) {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="relative w-full pt-[56.25%] bg-black rounded-xl md:rounded-2xl shadow-lg" />
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative w-full pt-[56.25%] bg-black overflow-hidden rounded-xl md:rounded-2xl shadow-lg">
        <YouTube
          videoId={videoId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="absolute top-0 left-0 w-full h-full"
          iframeClassName="w-full h-full border-0"
        />

        {needsTap && (
          <button
            type="button"
            onClick={handleTap}
            className="absolute inset-0 z-10 flex items-center justify-center bg-black/60 text-base font-medium text-white"
          >
            Tap to sync playback
          </button>
        )}
      </div>
    </div>
  );
}