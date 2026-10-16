// @/hooks/useRealtimeData.ts
"use client";

import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import db from "@/app/Actions/FirebaseLib";
import { useRouter } from "next/navigation";

export default function useRealtimeData(roomId: string) {
  const router = useRouter();
  const [dataObject, setDataObject] = useState<Record<string, any> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const dbRef = ref(db, `rooms/${roomId}`);

    const unsubscribe = onValue(
      dbRef,
      (snapshot) => {
        if (!snapshot.exists()) {
          setDataObject(null);
          setLoading(false);
          router.replace("/");
          return;
        }

        const val = snapshot.val();
        // Spread into a brand-new object reference so React ALWAYS re-renders
        // even when only deeply nested fields (like video time or chat) change
        setDataObject(typeof val === "object" && val !== null ? { ...val } : val);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching realtime data:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [roomId, router]);

  return { dataObject, loading };
}