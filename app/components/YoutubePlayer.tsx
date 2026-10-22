"use client";

import { useMemo, useRef, useEffect, useCallback } from "react";
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

  // Sync & anti-echo refs
  const lastPlayerTimeRef = useRef<number>(startTime);
  const isApplyingRemoteRef = useRef<boolean>(false);
  const remoteLockTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
    null,
  );
  const lastSentTimeRef = useRef<number>(-1);

  const lockRemoteAction = useCallback((durationMs = 1000) => {
    isApplyingRemoteRef.current = true;
    if (remoteLockTimeoutRef.current) {
      clearTimeout(remoteLockTimeoutRef.current);
    }
    remoteLockTimeoutRef.current = setTimeout(() => {
      isApplyingRemoteRef.current = false;
    }, durationMs);
  }, []);

  // 1. Do NOT set autoplay: 1 in opts (it causes black screens when browser blocks unmuted autoplay).
  // Instead, control playback cleanly inside onReady.
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

  // 2. Dynamically control play/pause whenever DB `isPlaying` changes
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current) return;
    try {
      const internalState = playerRef.current.getPlayerState();

      if (isPlaying) {
        if (
          internalState !== PLAYER_STATES.PLAYING &&
          internalState !== PLAYER_STATES.BUFFERING
        ) {
          lockRemoteAction(1000);
          playerRef.current.playVideo();
        }
      } else {
        if (
          internalState === PLAYER_STATES.PLAYING ||
          internalState === PLAYER_STATES.BUFFERING
        ) {
          lockRemoteAction(1000);
          playerRef.current.pauseVideo();
        }
      }
    } catch {
      // Player not ready yet
    }
  }, [isPlaying, lockRemoteAction]);

  // 3. Receive remote timestamp updates safely
  useEffect(() => {
    if (!playerRef.current || !isReadyRef.current || startTime < 0) return;
    if (Math.abs(startTime - lastSentTimeRef.current) < 0.8) return;

    try {
      const currentPlayerTime = playerRef.current.getCurrentTime() || 0;
      const drift = Math.abs(currentPlayerTime - startTime);

      if (drift > MAX_ALLOWED_DRIFT) {
        lockRemoteAction(1200);
        lastPlayerTimeRef.current = startTime;

        if (isPlayingRef.current) {
          playerRef.current.seekTo(startTime, true);
          playerRef.current.playVideo();
        } else {
          const state = playerRef.current.getPlayerState();
          // If the video hasn't started yet (-1 or 5), cueVideoById prevents a black screen
          if (state === PLAYER_STATES.UNSTARTED || state === PLAYER_STATES.CUED) {
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

  // 4. Fix Black Screen on Ready
  const onReady: YouTubeProps["onReady"] = useCallback(
    (event: YouTubeEvent) => {
      const player = event.target;
      playerRef.current = player;
      isReadyRef.current = true;

      const initialStart = startTimeRef.current > 0 ? startTimeRef.current : 0;
      lastPlayerTimeRef.current = initialStart;

      lockRemoteAction(1200);

      if (isPlayingRef.current) {
        if (initialStart > 0) {
          player.seekTo(initialStart, true);
        }
        player.playVideo();
      } else {
        // Cue the video instead of calling pauseVideo() on an unstarted player
        // This ensures the video thumbnail/frame shows instead of a black box
        if (initialStart > 0) {
          player.cueVideoById({
            videoId: videoIdRef.current,
            startSeconds: initialStart,
          });
        }
      }
    },
    [lockRemoteAction],
  );

  // 5. State change handler
  const onStateChange: YouTubeProps["onStateChange"] = useCallback(
    (event: YouTubeEvent) => {
      const player = event.target;
      const currentState = event.data;
      const currentTime = player.getCurrentTime() || 0;

      if (isApplyingRemoteRef.current) {
        lastPlayerTimeRef.current = currentTime;

        // If the player started playing while the DB says paused, force pause it
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
      } else if (currentState === PLAYER_STATES.PAUSED) {
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
    [pushLocalState],
  );

  // Classic 16:9 padding-top trick (pt-[56.25%]) guarantees the box NEVER collapses to 0 height in flex/grid layouts
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
      </div>
    </div>
  );
}