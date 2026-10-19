// @/hooks/useRealtimeData.ts
"use client";

import { useEffect, useState, useRef } from "react";
import { ref, onValue } from "firebase/database";
import db from "@/app/Actions/FirebaseLib";
import { useRouter } from "next/navigation";

export default function useRealtimeData(roomId: string) {
  const router = useRouter();
  const [dataObject, setDataObject] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  // Store the latest snapshot silently when the tab/window is in the background
  const latestDataRef = useRef<Record<string, any> | null>(null);
  const hasPendingUpdateRef = useRef<boolean>(false);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const dbRef = ref(db, `rooms/${roomId}`);

    // Helper to check if the user is actively looking at or focusing on the page
    const isPageActive = () => {
      if (typeof document === "undefined") return true;
      return document.visibilityState === "visible" && document.hasFocus();
    };

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          latestDataRef.current = null;
          setDataObject(null);
          setLoading(false);
          router.replace("/");
          return;
        }

        const val = snapshot.val();
        const freshCopy =
          typeof val === "object" && val !== null ? { ...val } : val;

        // Always keep the latest Firebase data in the ref
        latestDataRef.current = freshCopy;

        // Always allow the very first load through, or update immediately if page is focused
        if (isPageActive() || loading) {
          setDataObject(freshCopy);
          hasPendingUpdateRef.current = false;
        } else {
          // User is on another tab/app: pause React re-renders and mark update as pending
          hasPendingUpdateRef.current = true;
        }

        setLoading(false);
      },
      (error) => {
        console.error("Error fetching realtime data:", error);
        setLoading(false);
      }
    );

    // Flush the latest cached data immediately when the user returns to the tab/window
    const syncOnReturn = () => {
      if (
        document.visibilityState === "visible" &&
        hasPendingUpdateRef.current &&
        latestDataRef.current !== null
      ) {
        // Create a fresh object reference so React and useEffects (like startTime) trigger immediately
        setDataObject({ ...latestDataRef.current });
        hasPendingUpdateRef.current = false;
      }
    };

    window.addEventListener("focus", syncOnReturn);
    document.addEventListener("visibilitychange", syncOnReturn);

    return () => {
      unsubscribe();
      window.removeEventListener("focus", syncOnReturn);
      document.removeEventListener("visibilitychange", syncOnReturn);
    };
  }, [roomId, router]);

  return { dataObject, loading };
}